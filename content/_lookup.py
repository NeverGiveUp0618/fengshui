# -*- coding: utf-8 -*-
"""按知识点把五本教材的相关原文调出来，供写精讲时逐条核对。

用法：
    python3 _lookup.py 过峡              # 全部五本
    python3 _lookup.py 过峡 -b 初级 中级   # 限定教材
    python3 _lookup.py 过峡 -n 3          # 每本最多 3 段
    python3 _lookup.py 过峡 -f            # 完整段落（默认截断到 400 字）

写精讲的铁律：**只用调出来的原文，不补自己的风水知识**。
教材之间讲法不一致时两边都列、标出处，不替作者做取舍。
"""
import re, os, sys, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = [('杨公风水初级.md', '初级'), ('杨公风水中级.md', '中级'),
         ('家居风水高级课程.md', '家居高级'), ('杨公风水高级.md', '高级'),
         ('风水第一课.md', '第一课')]


def blocks(path, by_lesson=False):
    """→ [(定位, 章节, 段落)]"""
    out, loc, sec = [], '', ''
    for ln in open(path, encoding='utf8'):
        s = ln.rstrip('\n')
        m = re.match(r'^<!--\s*(?:p|图 p|⚠️ p)(\d+)', s.strip())
        if m:
            loc = 'p' + m.group(1)
            continue
        m = re.match(r'^(#{2,4})\s*(.+)$', s)
        if m:
            sec = m.group(2).strip()
            if by_lesson and re.match(r'^第\d+课', sec):
                loc = sec.split()[0]
            continue
        if s.startswith('<!--') or not s.strip():
            continue
        out.append((loc, sec, s.strip()))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('term')
    ap.add_argument('-b', '--books', nargs='*', default=None)
    ap.add_argument('-n', '--num', type=int, default=6)
    ap.add_argument('-f', '--full', action='store_true')
    ap.add_argument('-w', '--width', type=int, default=400)
    # 命中的常是「二、风水的误区：」这种标题行，正文在它后面几段
    ap.add_argument('-a', '--after', type=int, default=0, help='同时显示命中后的 N 段')
    a = ap.parse_args()

    total = 0
    for fn, label in BOOKS:
        if a.books and label not in a.books:
            continue
        bs = blocks(os.path.join(HERE, fn), by_lesson=(label == '第一课'))
        idxs = [i for i, (_l, _s, p) in enumerate(bs) if a.term in p]
        if not idxs:
            continue
        total += len(idxs)
        print(f'\n{"="*72}\n### {label}　{len(idxs)} 段命中\n')
        seen_sec = None
        for i in idxs[:a.num]:
            loc, sec, p = bs[i]
            if sec != seen_sec:
                print(f'  〔{sec}〕')
                seen_sec = sec
            cut = lambda x: x if a.full else (x[:a.width] + ('…' if len(x) > a.width else ''))
            print(f'  [{loc}] {cut(p)}')
            for j in range(i + 1, min(i + 1 + a.after, len(bs))):
                if bs[j][1] != sec:      # 跨到下一章节就停
                    break
                print(f'        {cut(bs[j][2])}')
            print()
        if len(idxs) > a.num:
            print(f'  （另有 {len(idxs)-a.num} 段，加 -n 调）')

    print(f'\n「{a.term}」共命中 {total} 段')


if __name__ == '__main__':
    main()
