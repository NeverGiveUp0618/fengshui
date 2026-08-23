#!/usr/bin/env python3
"""_fix_source.py —— 用正文里真实出现的引文标记，重算每节末尾的「**出处**：」行。

为什么要有这个：出处行原本是手写的。只要 _fix_cite.py 动过一次页码，
出处行就跟正文对不上了，而 _verify_cite.py 只查引文块、不查出处行，
这种漂移没人拦得住。所以让出处行变成产物，别再手写。

用法：
    python3 _fix_source.py                  # 全部精讲稿
    python3 _fix_source.py 03-精讲-B-*.md   # 指定文件
    python3 _fix_source.py -n               # 只看差异，不写回

规则：
  - 一节 = 从 `## ` 到下一个 `## `（`###` 是节内小标题，不切）。
  - 只认引文块行尾的 〔书名 pNN〕/〔第一课 第N课〕，正文别处的方括号不算。
  - 同书页码去重、按数字排序；书的先后按 BOOK_ORDER，和教材次第一致。
  - 没有任何引文的节（收尾／说明性小节）不动，也不给它加出处行。
"""
import re
import sys
import io
import pathlib

BOOK_ORDER = ['初级', '中级', '高级', '家居', '第一课']

# 引文标记：〔初级 p65〕〔初级 p774,p889〕〔第一课 第6课〕
CITE = re.compile(r'〔([^〕\s]+)\s+((?:p\d+|第\d+课)(?:\s*[,，]\s*(?:p\d+|第\d+课))*)〕')
SRC_LINE = re.compile(r'^\*\*出处\*\*：.*$', re.M)


def page_key(x):
    m = re.search(r'\d+', x)
    return int(m.group()) if m else 0


def collect(section):
    """→ {书: [页, ...]}，保持 BOOK_ORDER 次序"""
    found = {}
    for book, pages in CITE.findall(section):
        bucket = found.setdefault(book, set())
        for one in re.split(r'[,，]', pages):
            one = one.strip()
            if one:
                bucket.add(one)
    return found


def render(found):
    parts = []
    known = [b for b in BOOK_ORDER if b in found]
    # 不在 BOOK_ORDER 里的书排在后面，别静默丢掉
    rest = sorted(b for b in found if b not in BOOK_ORDER)
    for book in known + rest:
        pages = sorted(found[book], key=page_key)
        # 同一本书里 p65 只在第一个带 p，后面跟数字 —— 与既有稿一致
        if pages and pages[0].startswith('p'):
            shown = [pages[0]] + [x.lstrip('p') for x in pages[1:]]
        else:
            shown = pages
        parts.append('%s %s' % (book, ','.join(shown)))
    return '**出处**：' + '｜'.join(parts)


def do(path, dry):
    text = io.open(path, encoding='utf8').read()
    # 切节：保留分隔符，末节到文件尾
    bounds = [m.start() for m in re.finditer(r'^## ', text, re.M)] + [len(text)]
    out, changed = [], []
    out.append(text[:bounds[0]])
    for i in range(len(bounds) - 1):
        sec = text[bounds[i]:bounds[i + 1]]
        found = collect(sec)
        title = sec.split('\n', 1)[0].strip('# ').strip()
        if not found:
            out.append(sec)
            continue
        line = render(found)
        old = SRC_LINE.search(sec)
        if old:
            if old.group() != line:
                changed.append((title, old.group(), line))
                sec = sec[:old.start()] + line + sec[old.end():]
        else:
            changed.append((title, '（缺）', line))
            # 插在节末的 `---` 之前；没有 `---` 就补在末尾
            hr = sec.rfind('\n---\n')
            if hr > 0:
                sec = sec[:hr] + '\n\n' + line + sec[hr:]
            else:
                sec = sec.rstrip('\n') + '\n\n' + line + '\n'
        out.append(sec)
    if changed and not dry:
        io.open(path, 'w', encoding='utf8').write(''.join(out))
    return changed


def main():
    args = [a for a in sys.argv[1:] if a != '-n']
    dry = '-n' in sys.argv
    here = pathlib.Path(__file__).parent
    files = [here / a for a in args] if args else sorted(here.glob('*-精讲-*.md'))
    total = 0
    for f in files:
        changed = do(f, dry)
        if changed:
            print('\n### %s' % f.name)
            for title, old, new in changed:
                print('  %s' % title)
                print('    旧 %s' % old)
                print('    新 %s' % new)
            total += len(changed)
    print('\n%s %d 处出处行' % ('待改' if dry else '已重算', total))


if __name__ == '__main__':
    main()
