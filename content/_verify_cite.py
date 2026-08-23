# -*- coding: utf-8 -*-
"""核对精讲稿里每一处引用的出处。

精讲稿的全部价值建立在「引文准确 + 出处可回查」上，出处错了比不写还糟。
本脚本把每个引用块的原文拿回五本 md 里搜，比对标注的书名与页码。

用法：python3 _verify_cite.py [02-精讲-A-总论与门派.md ...]
      不给参数则核对所有 `NN-精讲-*.md`（两位数字开头，02~14 全覆盖）。

报告三类问题：
  ✗ 找不到    —— 引文在源里不存在（改写过、或抄错字）
  ⚠ 书名不符  —— 引文在别的书里
  ⚠ 页码不符  —— 书对但页码错，给出实际页码
"""
import re, os, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = {'初级': '杨公风水初级.md', '中级': '杨公风水中级.md',
         '家居': '家居风水高级课程.md', '高级': '杨公风水高级.md',
         '第一课': '风水第一课.md'}

# 〔初级 p6〕〔家居 p13 图注〕〔第一课 第1课〕〔初级 p15，线下课补充〕
CITE = re.compile(r'〔([^〕]+)〕')


def load(name):
    """→ [(定位, 该块纯文本)]"""
    path = os.path.join(HERE, BOOKS[name])
    out, loc, buf = [], '', []
    for ln in open(path, encoding='utf8'):
        m = re.match(r'^<!--\s*(?:p|图 p|⚠️ p)(\d+)', ln.strip())
        if m:
            if buf:
                out.append((loc, ''.join(buf)))
            loc, buf = 'p' + m.group(1), []
            continue
        m2 = re.match(r'^##\s*(第\d+课)', ln)
        if m2 and name == '第一课':
            if buf:
                out.append((loc, ''.join(buf)))
            loc, buf = m2.group(1), []
            continue
        if ln.startswith('<!--'):
            continue
        buf.append(ln)
    if buf:
        out.append((loc, ''.join(buf)))
    return out


CACHE = {}


def where(name, probe):
    """probe 在该书里出现的所有定位"""
    if name not in CACHE:
        CACHE[name] = load(name)
    # ⚠️ 源 md 里口诀是引用块（每行带 `>`），不剥掉就永远匹配不上四句口诀
    # 直引号/弯引号、全角半角括号在两边可能写法不同，一律归一再比
    def flat(s):
        s = re.sub(r'[\s>*_`]', '', s)
        return s.translate(str.maketrans('“”‘’（）', '""\'\'()'))
    p = flat(probe)
    return [loc for loc, txt in CACHE[name] if p in flat(txt)]


def probes(block):
    """从引用块里取几个足够长、无 markdown 标记的片段用于定位。

    ⚠️ 引文允许用省略号删节（可读性需要），所以必须**先按省略号切开**再逐段验，
       否则整段匹配一定失败，会把正常引用全报成「找不到」。"""
    t = re.sub(r'[*_`]', '', block)
    t = re.sub(r'^\s*>\s?', '', t, flags=re.M)
    t = CITE.sub('', t)
    t = re.sub(r'〔[^〕]*$', '', t)
    segs = []
    for chunk in re.split(r'…+|\.{3,}', t):
        segs += [s.strip() for s in re.split(r'[。！？\n；]', chunk)]
    segs = [s for s in segs if 10 <= len(s) <= 40]
    return segs[:5] or [max(re.split(r'…+', t), key=len).strip()[:24]]


def main():
    # ⚠️ 别写成 '0*-精讲-*.md'：那样只匹配 02-09，会静悄悄漏掉 10-I~14-M 五篇
    #    （2026-08-15 发现，那五篇 386 处引用一直没被默认核对过）
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(HERE, '[0-9][0-9]-精讲-*.md')))
    bad = ok = 0
    for f in files:
        print(f'\n{"="*70}\n### {os.path.basename(f)}')
        lines = open(f, encoding='utf8').read().split('\n')
        # 引用块：连续的 > 行；出处可能在块内末尾，也可能在紧随的段里
        i = 0
        while i < len(lines):
            if not lines[i].startswith('>'):
                i += 1
                continue
            # ⚠️ 一个块＝连续的 `>` 行，空行就断开。
            #    早先把空行也吞进块里，相邻两条引文被并成一块，
            #    于是拿第一条的文字去核对第二条的出处，报出一堆假错。
            j = i
            while j < len(lines) and lines[j].startswith('>'):
                j += 1
            block = '\n'.join(lines[i:j])
            i = j
            cites = CITE.findall(block)
            if not cites:
                continue
            for cite in cites:
                m = re.match(r'\s*(初级|中级|家居|高级|第一课)\s*(.*)', cite)
                if not m:
                    continue
                book, rest = m.group(1), m.group(2)
                pages = re.findall(r'p?(\d+)\s*课?', rest)
                declared = set()
                for x in re.findall(r'p(\d+)', rest):
                    declared.add('p' + x)
                for x in re.findall(r'第(\d+)课', rest):
                    declared.add('第' + x + '课')
                found = set()
                for pr in probes(block):
                    for loc in where(book, pr):
                        found.add(loc)
                if not found:
                    # 换本书试试
                    other = [b for b in BOOKS if b != book
                             and any(where(b, pr) for pr in probes(block))]
                    print(f'  ✗ 〔{cite}〕 引文找不到' +
                          (f'　→ 实际在 **{"/".join(other)}**' if other else '（五本里都没有）'))
                    print(f'     「{probes(block)[0][:34]}…」')
                    bad += 1
                elif declared and not (declared & found):
                    print(f'  ⚠ 〔{cite}〕 页码不符　→ 实际 {"、".join(sorted(found))}')
                    print(f'     「{probes(block)[0][:34]}…」')
                    bad += 1
                else:
                    ok += 1
    print(f'\n{"="*70}\n引用核对：{ok} 处正确，{bad} 处需修')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
