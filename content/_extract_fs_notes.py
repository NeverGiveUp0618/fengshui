# -*- coding: utf-8 -*-
"""风水大合集（笔记体四本）→ markdown

与《风水第一课》那本（讲稿脚本、靠开场白锚点切分）不同，这四本是**听课笔记体**：
条目化、口诀多、层级深、夹着「线下课XXX课堂补充：」这类不同来源的插入层。
所以骨架改用 PDF 书签，小节用「视频N：」，并保留页码溯源——跨教材整合时要能
回查「这段出自哪本书哪一页」。

产出的 md 只做三件事：还原段落、保住口诀与条目层级、标出提取不可靠的地方。
不改写、不概括、不合并原文。

用法：python3 _extract_fs_notes.py [书名关键词]
"""
import fitz, re, os, sys, json, statistics

SRC = "/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/fs合集/风水大合集"
OUT = os.path.dirname(os.path.abspath(__file__))

BOOKS = [
    {'file': '杨公风水中级合集.pdf', 'name': '杨公风水中级', 'skip': []},
    {'file': '杨公风水高级合集.pdf', 'name': '杨公风水高级', 'skip': []},
    {'file': '家居风水高级课程合集书签版.pdf', 'name': '家居风水高级课程', 'skip': ['封面', '目录（上）', '目录（下）']},
    # 「三、课件」276 页 95% 是 PPT 截图，文字提取不出来，跳过；需要时另做图库。
    # ⚠️「课堂游学合并笔记」与「课堂游学合并笔记（排版完成）」是同一批内容的两个版本
    #    （抽 200 句 100% 重合，33559 vs 33586 汉字），保留排版好的那份，否则
    #    整本多出 3.3 万字、知识点清单多出 146 条假条目。
    {'file': '杨公风水初级合集.pdf', 'name': '杨公风水初级',
     'skip': ['三、课件', '课件', '课堂游学合并笔记']},
]

END = '。！？；："」』）…—'
# 条目行：这些必须自成一段，否则会被硬折行规则并进上一段，层级全糊掉
ITEM = re.compile(r'^\s*(?:视频\s*\d+\s*[-–~至]?\s*\d*\s*[:：]?'
                  r'|第[一二三四五六七八九十百]+[部分课节讲]'
                  r'|[一二三四五六七八九十]+[、．]'
                  r'|[（(][一二三四五六七八九十\d]+[)）][、．]?'
                  r'|\d+[、．](?!\d))')
# 「线下课20250618 课堂补充：」这类插入层，单独标出来——它与正课不是同一来源
INSERT = re.compile(r'^\s*(?:线下课\s*\d+.{0,12}(?:补充|笔记)|.{0,8}课堂补充)\s*[:：]?\s*$')


def is_verse_run(lines, i):
    """口诀/韵文：连续 ≥2 行、每行 5-9 字、无句读、字数整齐。
    ⚠️ 不识别就会被硬折行规则粘成一坨（《风水第一课》五星口诀踩过）。"""
    run = []
    for ln in lines[i:]:
        s = ln.strip()
        if not (5 <= len(s) <= 9) or any(c in s for c in END + '，,、：:'):
            break
        run.append(s)
    if len(run) < 2:
        return 0
    if max(len(x) for x in run) - min(len(x) for x in run) > 1:
        return 0
    return len(run)


def page_kind(page):
    """判定一页的可提取性：normal / frag(表格或竖排) / image(纯图) / blank"""
    t = page.get_text()
    lines = [l.strip() for l in t.split('\n') if l.strip()]
    if not lines:
        return 'blank'
    if len(t.strip()) < 80 and page.get_images():
        return 'image'
    tiny = len([l for l in lines if len(l) <= 2])
    if tiny / len(lines) > 0.55 or statistics.mean(len(l) for l in lines) < 4.5:
        return 'frag'
    return 'normal'


# ⚠️ 只有「行满」的行才是 PDF 硬折行。四本实测排版宽度都是 28-31 字，
#    末尾无标点的行里 90%+ 长 28-31（真折行），其余是短句/标题/口诀。
#    早先只判「行尾无句读就接续」，把「一、廖家九星」+「杨公九星：…」、
#    「五行土金」+「头圆而身带方者号太阴」这类短句全粘成了一句。
FULLWIDTH = 27


def unwrap(items):
    """归并硬折行；口诀、条目行、插入层标题各自独立成段。
    items＝[(页码, 行)]，返回 [(kind, 值, 该段起始页)]。

    ⚠️ 必须逐段带回页码。早先只在「连续正常页」的**第一页**标一次
       `<!-- p## -->`，后面十几页的内容全挂在同一个标记下——初级第2课上
       p11-p31 整段都显示成 p15，精讲稿照抄出处就全错了。溯源是这套东西
       的根基，页码精度不能省。"""
    items = [(p, l.strip()) for p, l in items if l.strip()]
    lines = [l for _p, l in items]
    out, i = [], 0
    lastlen = 0          # 上一物理行的长度（不是合并后段落的长度）
    while i < len(lines):
        n = is_verse_run(lines, i)
        if n:
            out.append(('verse', lines[i:i + n], items[i][0]))
            i += n
            lastlen = 0
            continue
        ln = lines[i]
        if INSERT.match(ln):
            out.append(('insert', ln.rstrip('：: '), items[i][0]))
            i += 1
            lastlen = 0
            continue
        cont = (out and out[-1][0] == 'p' and lastlen >= FULLWIDTH
                and out[-1][1][-1] not in END and not ITEM.match(ln))
        if cont:
            out[-1] = ('p', out[-1][1] + ln, out[-1][2])
        else:
            out.append(('p', ln, items[i][0]))
        lastlen = len(ln)
        i += 1
    # 数字与中文间的多余空格：「2018 年」→「2018年」
    sp = lambda x: re.sub(r'(?<=\d)\s+(?=[一-鿿])', '', x)
    return [(k, sp(v) if k != 'verse' else [sp(x) for x in v], pg) for k, v, pg in out]


def extract(book):
    path = os.path.join(SRC, book['file'])
    d = fitz.open(path)
    toc = d.get_toc()
    npages = d.page_count
    # 书签 → 分节 [(level,title,start,end)]
    marks = [(lv, t, p - 1) for lv, t, p in toc]
    # ⚠️ 一节的终点＝**紧接的下一个书签**的起始页，不能写成「下一个页码更大的书签」。
    #    父节与它的第一个子节常在同一页（「一、峦头部分」和它下面的「封面」都在 p2），
    #    按后者算会让那一页被父节和子节各输出一遍——中级实测多出 12% 正文。
    #    同页时 z==a，range 为空，父节只留标题，内容归子节。
    secs = []
    for i, (lv, t, p) in enumerate(marks):
        nxt = marks[i + 1][2] if i + 1 < len(marks) else npages
        secs.append([lv, t, p, max(nxt, p)])
    if not secs:
        secs = [[1, book['name'], 0, npages]]

    kinds = {i: page_kind(d[i]) for i in range(npages)}
    parts = [f'# {book["name"]}\n',
             f'> 源：{book["file"]}（{npages} 页）｜本文件由 _extract_fs_notes.py 生成\n'
             f'> 页码标记 `<!-- p## -->` 用于跨教材整合时回查原文\n']
    stat = {'sections': 0, 'skipped': [], 'frag': [], 'image': 0, 'chars': 0}

    for lv, title, a, z in secs:
        # ⚠️ 必须精确匹配：「课堂游学合并笔记」是「课堂游学合并笔记（排版完成）」的
        #    子串，用 in 判断会把要保留的那份也一起跳掉。
        if title.strip() in book['skip']:
            stat['skipped'].append(f'{title}(p{a+1}-{z})')
            parts.append(f'\n{"#"*min(lv+1,4)} {title}\n')
            parts.append(f'<!-- 跳过 p{a+1}-{z}：该段为课件截图，文字提取不到，需要时另做图库 -->\n')
            continue
        # 只取属于本节、且不属于更深层子节的页；子节自己会再输出一遍标题
        body_pages = range(a, z)
        stat['sections'] += 1
        parts.append(f'\n{"#"*min(lv+1,4)} {title}\n')
        parts.append(f'<!-- src: {book["name"]} p{a+1}-{z} -->\n')
        buf = []
        for i in body_pages:
            k = kinds[i]
            if k == 'blank':
                continue
            if k == 'image':
                # ⚠️ 别整页丢：这些页虽以图为主，那几十个字往往是图注，
                #    家居高级实测整页丢会少掉 1276 字。
                stat['image'] += 1
                buf.append(('img', (i + 1, d[i].get_text().strip())))
                continue
            if k == 'frag':
                stat['frag'].append(i + 1)
                buf.append(('frag', (i + 1, d[i].get_text())))
                continue
            buf.append(('txt', (i + 1, d[i].get_text())))
        # 连续的正常页合并后统一 unwrap（跨页硬折行才接得上），
        # 但每段都带回自己的起始页，页码一变就补一个标记。
        run = []          # [(页码, 行)]
        state = {'page': None}
        def flush():
            if not run:
                return
            for kind, v, pg in unwrap(run):
                if pg != state['page']:
                    parts.append(f'<!-- p{pg} -->\n')
                    state['page'] = pg
                if kind == 'verse':
                    parts.append('\n'.join('> ' + x + '  ' for x in v) + '\n')
                elif kind == 'insert':
                    parts.append(f'**〔{v}〕**\n')
                else:
                    parts.append(v + '\n')
                    stat['chars'] += len(v)
            run.clear()
        for kind, v in buf:
            if kind == 'txt':
                run.extend((v[0], ln) for ln in v[1].split('\n'))
            else:
                flush()
                state['page'] = None
                if kind == 'img':
                    pno, cap = v
                    parts.append(f'<!-- 图 p{pno}：此页以图为主，正文需读图补充 -->\n')
                    if cap:
                        for kk, vv, _pg in unwrap([(pno, x) for x in cap.split('\n')]):
                            txt = ' '.join(vv) if kk == 'verse' else vv
                            parts.append(f'*（p{pno} 图注）* {txt}\n')
                            stat['chars'] += len(txt)
                else:
                    pno, raw = v
                    parts.append(f'\n<!-- ⚠️ p{pno} 疑似表格或竖排，下面按原样保留，排版可能错乱 -->\n')
                    parts.append('```\n' + raw.strip() + '\n```\n')
        flush()
    return ''.join(parts), stat, d


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for b in BOOKS:
        if only and only not in b['name']:
            continue
        md, st, d = extract(b)
        fn = os.path.join(OUT, b['name'] + '.md')
        open(fn, 'w', encoding='utf8').write(md)
        # ⚠️ 对账两边必须同口径（都数汉字）：曾一边数全字符一边数汉字，
        #    得出「产物 20 万 > 原始 14 万」的假重复警报。
        han = lambda s: len(re.findall(r'[一-鿿]', s))
        # 原始只统计实际提取的页（跳过区段不算）
        skipped_pages = set()
        for lv, t, p in d.get_toc():
            if t.strip() in b['skip']:
                nxt = d.page_count
                for lv2, t2, p2 in d.get_toc():
                    if p2 > p:
                        nxt = p2
                        break
                skipped_pages |= set(range(p - 1, nxt))
        raw = ''.join(d[i].get_text() for i in range(d.page_count) if i not in skipped_pages)
        body = re.sub(r'<!--.*?-->', '', md, flags=re.S)
        body = re.sub(r'```.*?```', '', body, flags=re.S)   # 原样保留的碎片块两边都不计
        rawfrag = ''.join(d[p - 1].get_text() for p in st['frag'])
        a, z = han(raw) - han(rawfrag), han(body)
        print(f'\n✅ {b["name"]}.md  {os.path.getsize(fn)/1024:.0f} KB')
        print(f'   {st["sections"]} 节 · 产物汉字 {z} / 原文汉字 {a}'
              f'（差 {z-a:+d}，{abs(z-a)*100/max(a,1):.2f}%）')
        if st['skipped']:
            print(f'   跳过：{"; ".join(st["skipped"])}')
        print(f'   纯图页 {st["image"]} 处已标占位｜表格/竖排页 {len(st["frag"])} 处按原样保留'
              + (f'：p{st["frag"][:10]}' if st['frag'] else ''))


if __name__ == '__main__':
    main()
