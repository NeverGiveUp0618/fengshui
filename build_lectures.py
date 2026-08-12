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

SRC_DIR = os.path.expanduser(
    '~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/学习/风水教材')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'lectures.js')

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
            nq = sum(1 for b in it['blocks'] if b['t'] == 'q')
            nc = 0
            for b in it['blocks']:
                if b['t'] == 'table':          # 表格块没有 v 键
                    nc += sum(len(''.join(r)) for r in [b['head']] + b['rows'])
                else:
                    v = b.get('v', '')
                    nc += len(''.join(v)) if isinstance(v, list) else len(str(v))
            it['nq'] = nq
            it['c'] = nc
            # 自检：正文条目必须有引文。收尾／说明性小节除外——它们本来就不引原文。
            # 说明性小节（本类完成情况／归属说明等）打 note 标记：
            # 它们是编者按，不是可学的条目，别计进进度分母。
            if re.search(r'未收入|进度|未展开|归属说明|完成情况|待整合', it['t']):
                it['note'] = 1
            if nq == 0 and not it.get('note'):
                problems.append(f'{name} {it["n"]}「{it["t"]}」没有一处教材引文')
        cats.append({'c': code, 'name': name, 'intro': intro, 'items': items})

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
    print(f'✅ {len(cats)} 类 · 正文 {ni - nnote} 条（另 {nnote} 条说明不计进度）· {nq} 处引文 → data/lectures.js '
          f'（{os.path.getsize(OUT)/1024:.1f} KB）')
    for c in cats:
        print(f'   {c["c"]} {c["name"]}：{len(c["items"])} 条，'
              f'{sum(i["nq"] for i in c["items"])} 处引文')


if __name__ == '__main__':
    main()
