# -*- coding: utf-8 -*-
"""精讲稿 markdown → data/lectures.js

源：Obsidian/MyNotes/学习/风水教材/0N-精讲-X-*.md（跨教材整合稿）
产物：data/lectures.js（勿手改）

精讲稿与《风水第一课》那种通读原文不同，它是**结构化**的：一句话结论、
教材原话引用（带出处）、⚠️存疑、⭐要害、📎互见、表格。所以不能当纯文本渲染，
要解析成带类型的块，前端才好分别处理——引文要显出处标签，⚠️要显眼。

零依赖，只用标准库。
"""
import re, os, sys, json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from _map_lecimg import LEC_IMG, BOOK_SLUG
except ImportError:
    LEC_IMG, BOOK_SLUG = {}, {}

SRC_DIR = os.path.expanduser(
    '~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/学习/风水教材')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'lectures.js')
IMG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'lecimg')

# 已完成的精讲（顺序即体系顺序）
FILES = [
    ('A', '总论与门派', '02-精讲-A-总论与门派.md'),
    ('B', '峦头·龙', '03-精讲-B-峦头龙.md'),
    ('C', '峦头·穴', '04-精讲-C-峦头穴.md'),
    ('D', '峦头·砂', '05-精讲-D-峦头砂.md'),
    ('E', '峦头·水', '06-精讲-E-峦头水.md'),
    ('F', '峦头·向', '07-精讲-F-峦头向.md'),
    ('G', '理气·基础', '08-精讲-G-理气基础.md'),
    ('H', '理气·水法砂法', '09-精讲-H-理气水法砂法.md'),
    ('I', '理气·派别用法', '10-精讲-I-理气派别用法.md'),
    ('J', '罗盘与分金', '11-精讲-J-罗盘与分金.md'),
    ('K', '应用·家居城市', '12-精讲-K-应用家居城市.md'),
    ('L', '口诀歌赋', '13-精讲-L-口诀歌赋.md'),
    ('M', '断验与应事', '14-精讲-M-断验与应事.md'),
]

problems_img = []      # place_images 里发现的映射表问题，main 统一报
TAIL_OK = '末尾'      # 映射表第5项写它＝人工确认「就放条目末尾」
NEAR_PAGES = 3        # 图页与引文页最多差几页还算「就近」，超出就退到条目末尾
CITE = re.compile(r'〔([^〕]+)〕\s*$')
NOTE = re.compile(r'^(⚠️|⭐|📎)\s*')


def inline(s):
    """行内标记 → 轻量标签，前端按需要渲染。只处理粗体与书名号。"""
    s = s.strip()
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    return s


def parse_item(lines):
    """一个 ## 条目的正文 → 块列表"""
    blocks, i = [], 0
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            i += 1
            continue
        # 分隔线 / 三级标题
        if re.match(r'^-{3,}$', ln):
            i += 1
            continue
        m = re.match(r'^###\s*(.+)$', ln)
        if m:
            blocks.append({'t': 'h', 'v': inline(m.group(1))})
            i += 1
            continue
        # 表格
        if ln.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'-{2,}|:?-+:?', c) for c in cells):
                    rows.append([inline(c) for c in cells])
                i += 1
            if rows:
                blocks.append({'t': 'table', 'head': rows[0], 'rows': rows[1:]})
            continue
        # 引用块（可能多行；出处在最后一行的〔〕里）
        if ln.startswith('>'):
            buf = []
            while i < len(lines) and lines[i].startswith('>'):
                buf.append(re.sub(r'^>\s?', '', lines[i]).rstrip())
                i += 1
            text = '\n'.join(buf).strip()
            src = ''
            m = CITE.search(text.replace('\n', ' '))
            if m:
                src = m.group(1)
                # 只去掉末尾那一处出处标记
                text = re.sub(r'〔' + re.escape(src) + r'〕\s*$', '', text.rstrip()).rstrip()
            blocks.append({'t': 'q', 'v': [inline(x) for x in text.split('\n') if x.strip()],
                           'src': src})
            continue
        # 列表
        if re.match(r'^[-*]\s+', ln):
            items = []
            while i < len(lines) and re.match(r'^[-*]\s+', lines[i]):
                items.append(inline(re.sub(r'^[-*]\s+', '', lines[i])))
                i += 1
            blocks.append({'t': 'ul', 'v': items})
            continue
        # 出处汇总行
        if ln.startswith('**出处**：'):
            blocks.append({'t': 'src', 'v': ln.replace('**出处**：', '').strip()})
            i += 1
            continue
        # 一句话结论
        if ln.startswith('**一句话**：'):
            blocks.append({'t': 'lead', 'v': inline(ln.replace('**一句话**：', ''))})
            i += 1
            continue
        # ⚠️ ⭐ 📎 提示
        m = NOTE.match(ln)
        if m:
            kind = {'⚠️': 'warn', '⭐': 'key', '📎': 'ref'}[m.group(1)]
            blocks.append({'t': 'note', 'k': kind, 'v': inline(NOTE.sub('', ln))})
            i += 1
            continue
        blocks.append({'t': 'p', 'v': inline(ln)})
        i += 1
    return blocks


def src_pages(src):
    """引文出处 '家居 p171,172' → ('家居', {171,172})；认不出返回 (None, set())"""
    m = re.match(r'^\s*(初级|中级|高级|家居|第一课)\s*(.*)$', src or '')
    if not m:
        return None, set()
    return m.group(1), {int(x) for x in re.findall(r'\d+', m.group(2))}


def place_images(no, blocks):
    """把 LEC_IMG[no] 的图插进 blocks。

    ⭐ 落点＝**引用了该页的那处引文之后**，图才真正跟着讲解走：
    家居 p177 的图会落到「第二个标准：砂形要端正」那段引文下面，而不是堆在条目末尾。
    同页多图按映射表顺序排在一起。配不上任何引文的（页码只在出处汇总行里出现过）
    退到正文末尾、出处行之前——不丢图，但也不硬塞。
    """
    imgs = LEC_IMG.get(no) or []
    if not imgs:
        return blocks
    qinfo = []                       # [(块序号, 书, 页集合)]
    for i, b in enumerate(blocks):
        if b['t'] == 'q':
            bk, pg = src_pages(b.get('src', ''))
            if bk and pg:
                qinfo.append((i, bk, pg))
    tail = next((i for i, b in enumerate(blocks) if b['t'] == 'src'), len(blocks))

    hs = [i for i, b in enumerate(blocks) if b['t'] == 'h']

    plan = {}                        # (块序号, 0=之前/1=之后) -> [图]
    for x in imgs:
        book, page = x[0], x[1]
        anchor = x[4] if len(x) > 4 else ''
        if anchor == TAIL_OK:
            # 人工确认过：该条目没有小节、页码也只出现在出处汇总行里，
            # 图放正文末尾是它能有的最好位置。与「意外掉队」区分开，测试才查得准。
            plan.setdefault((tail, 0), []).append((x, 'tail_ok'))
            continue
        if anchor:
            # 显式锚点：落到该小节里的第一处引文之后；小节内没有引文就紧跟小标题
            hi = next((i for i in hs
                       if anchor in re.sub(r'<[^>]+>', '', blocks[i]['v'])), None)
            if hi is not None:
                end = next((i for i in hs if i > hi), len(blocks))
                q = next((j for j in range(hi + 1, end) if blocks[j]['t'] == 'q'), None)
                plan.setdefault((q if q is not None else hi, 1), []).append((x, 'anchor'))
                continue
            problems_img.append(f'{no}：找不到小节「{anchor}」')
        exact = [i for i, bk, pg in qinfo if bk == book and page in pg]
        if exact:
            plan.setdefault((exact[0], 1), []).append((x, 'exact'))
            continue
        # 图所在页没被正文引用（常见于配图页与讲解页差一两页）：
        # 退而求其次挂到最近的同书引文上，并按页码前后决定插在它前还是后。
        near = sorted((min(abs(page - p) for p in pg), i, min(pg))
                      for i, bk, pg in qinfo if bk == book)
        if near and near[0][0] <= NEAR_PAGES:
            _, i, first = near[0]
            plan.setdefault((i, 0 if page < first else 1), []).append((x, 'near'))
            continue
        plan.setdefault((tail, 0), []).append((x, 'tail'))  # 兜底：正文末尾、出处行之前

    out = []
    for i, b in enumerate(blocks):
        out += [img_block(*p) for p in plan.get((i, 0), [])]
        out.append(b)
        out += [img_block(*p) for p in plan.get((i, 1), [])]
    out += [img_block(*p) for p in plan.get((len(blocks), 0), [])]
    return out


def img_block(x, how='exact'):
    """how 记落点是怎么定的：exact 同页引文／near 就近／anchor 小节锚点／
    tail_ok 人工确认放末尾／tail 意外掉队（测试会报）。
    留在产物里是为了让测试能分清「锚点正好落在最后一节」和「真的掉到末尾」——
    这两种在块序列上长得一模一样。"""
    book, page, xref, cap = x[:4]
    return {'t': 'img', 'f': f'{BOOK_SLUG.get(book, book)}-p{page}-x{xref}.jpg', 'cap': cap,
            'src': f'{book} p{page}', 'how': how}


def parse(path):
    raw = open(path, encoding='utf8').read().split('\n')
    # 文件头的 > 引言（体例说明）不进正文
    body_start = 0
    for k, ln in enumerate(raw):
        if ln.startswith('## '):
            body_start = k
            break
    head = [l for l in raw[:body_start]]
    intro = ' '.join(re.sub(r'^>\s?', '', l).strip() for l in head
                     if l.startswith('>')).strip()
    items, cur, buf = [], None, []
    for ln in raw[body_start:]:
        m = re.match(r'^##\s+(?:([A-M]\d+)　?\s*)?(.+)$', ln)
        if m and not ln.startswith('###'):
            if cur:
                cur['blocks'] = parse_item(buf)
                items.append(cur)
            no, title = m.group(1), m.group(2).strip()
            cur, buf = {'n': no or '', 't': title}, []
            continue
        if cur is not None:
            buf.append(ln)
    if cur:
        cur['blocks'] = parse_item(buf)
        items.append(cur)
    return intro, items


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def main():
    cats, problems = [], []
    for code, name, fn in FILES:
        path = os.path.join(SRC_DIR, fn)
        if not os.path.exists(path):
            print(f'✗ 找不到 {path}', file=sys.stderr)
            sys.exit(1)
        intro, items = parse(path)
        if not items:
            problems.append(f'{name}：一条都没解析出来')
        for it in items:
            if it['n']:
                it['blocks'] = place_images(it['n'], it['blocks'])
            nq = sum(1 for b in it['blocks'] if b['t'] == 'q')
            ni = sum(1 for b in it['blocks'] if b['t'] == 'img')
            nc = 0
            for b in it['blocks']:
                if b['t'] == 'table':          # 表格块没有 v 键
                    nc += sum(len(''.join(r)) for r in [b['head']] + b['rows'])
                elif b['t'] == 'img':          # 图块也没有 v 键，别计字数
                    continue
                else:
                    v = b.get('v', '')
                    nc += len(''.join(v)) if isinstance(v, list) else len(str(v))
            it['nq'] = nq
            it['c'] = nc
            if ni:
                it['ni'] = ni
                for b in it['blocks']:
                    if b['t'] != 'img':
                        continue
                    p = os.path.join(IMG_DIR, b['f'])
                    if not os.path.exists(p):
                        problems.append(f'{name} {it["n"]}：配图文件缺失 {b["f"]}'
                                        f'（先跑 build_images.py）')
            # 自检：正文条目必须有引文。收尾／说明性小节除外——它们本来就不引原文。
            # 说明性小节（本类完成情况／归属说明等）打 note 标记：
            # 它们是编者按，不是可学的条目，别计进进度分母。
            if re.search(r'未收入|进度|未展开|归属说明|完成情况|待整合', it['t']):
                it['note'] = 1
            if nq == 0 and not it.get('note'):
                problems.append(f'{name} {it["n"]}「{it["t"]}」没有一处教材引文')
        cats.append({'c': code, 'name': name, 'intro': intro, 'items': items})

    problems += problems_img
    if problems:
        print('✗ 自检未通过：', file=sys.stderr)
        for p in problems:
            print('   ' + p, file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    js = ('/* 本文件由 build_lectures.py 生成，勿手改。'
          '源：Obsidian/MyNotes/学习/风水教材/0N-精讲-*.md */\n'
          'const LECTURES=' + json.dumps(cats, ensure_ascii=False, separators=(',', ':')) + ';\n'
          'if(typeof module!=="undefined")module.exports={LECTURES};\n')
    open(OUT, 'w', encoding='utf8').write(js)

    ni = sum(len(c['items']) for c in cats)
    nq = sum(it['nq'] for c in cats for it in c['items'])
    nnote = sum(1 for c in cats for it in c['items'] if it.get('note'))
    nimg = sum(it.get('ni', 0) for c in cats for it in c['items'])
    print(f'✅ {len(cats)} 类 · 正文 {ni - nnote} 条（另 {nnote} 条说明不计进度）· {nq} 处引文 '
          f'· {nimg} 张配图 → data/lectures.js（{os.path.getsize(OUT)/1024:.1f} KB）')
    for c in cats:
        img = sum(i.get('ni', 0) for i in c['items'])
        print(f'   {c["c"]} {c["name"]}：{len(c["items"])} 条，'
              f'{sum(i["nq"] for i in c["items"])} 处引文'
              + (f'，{img} 张配图' if img else ''))


if __name__ == '__main__':
    main()
