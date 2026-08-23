#!/usr/bin/env python3
"""_check_lectures.py —— 精讲稿的结构体检。

_verify_cite 只管「引文对不对得上原书」，_fix_source 只管「出处行对不对得上正文」。
这个补另外四件它俩都不管的事：

  1. 编号：每类 X1..Xn 连续、不重号、不跳号
  2. 每条正文都得有引文，也得有出处行（收尾/说明性小节除外）
  3. 交叉引用（见 **B17**、归 **C 峦头·穴**、📎 **M 断验与应事**）指向的条目**真的存在**
     ——2026-08-12 就抓到过「穴土辨法在 C」这种假指针，C 里根本没有
  4. 跨条重复引文：同一段原文被两条抄了，多半该合并或改成互链

用法：python3 _check_lectures.py [-v]     -v 连重复引文的原文一起列
"""
import io
import re
import sys
import pathlib

HERE = pathlib.Path(__file__).parent
CLASSES = 'ABCDEFGHIJKLM'
# 收尾/说明性小节，允许没有引文与出处
TAIL = re.compile(r'未收入|完成情况|归属说明|待整合|进度|未展开')
H2 = re.compile(r'^## +(.+?)\s*$', re.M)
ENTRY = re.compile(r'^([A-M])(\d+)[　\s]+(.*)$')
CITE = re.compile(r'〔([^〕\s]+)\s+((?:p\d+|第\d+课)(?:\s*[,，]\s*(?:p\d+|第\d+课))*)〕')
SRC = re.compile(r'^\*\*出处\*\*：', re.M)
# 交叉引用：**B17**、**C21 穴土与葬深**、**K 应用·家居城市**、**M 断验与应事**
XREF = re.compile(r'\*\*([A-M])(\d*)\s*([^*]{0,20}?)\*\*')
QUOTE = re.compile(r'^> ?(.*)$', re.M)


def norm(t):
    t = re.sub(r'[\s>*_`]', '', t)
    return t.translate(str.maketrans('“”‘’（）', '""\'\'()'))


def main():
    verbose = '-v' in sys.argv
    files = sorted(HERE.glob('*-精讲-*.md'))
    entries = {}          # 'B17' -> (file, title)
    per_class = {}        # 'B' -> [17, ...]
    problems = []
    quote_owner = {}      # 归一化引文 -> [条目...]

    for f in files:
        text = io.open(f, encoding='utf8').read()
        bounds = [m.start() for m in re.finditer(r'^## ', text, re.M)] + [len(text)]
        for i in range(len(bounds) - 1):
            sec = text[bounds[i]:bounds[i + 1]]
            head = sec.split('\n', 1)[0].lstrip('# ').strip()
            m = ENTRY.match(head)
            if not m:
                if not TAIL.search(head):
                    problems.append(('小节标题不成条目', f.name, head))
                continue
            cls, no, title = m.group(1), int(m.group(2)), m.group(3)
            key = '%s%d' % (cls, no)
            if key in entries:
                problems.append(('条目重号', f.name, key + ' 已在 ' + entries[key][0]))
            entries[key] = (f.name, title)
            per_class.setdefault(cls, []).append(no)

            cites = CITE.findall(sec)
            if not cites:
                problems.append(('条目没有任何引文', f.name, key + ' ' + title))
            if not SRC.search(sec):
                problems.append(('条目缺出处行', f.name, key + ' ' + title))

            for q in QUOTE.findall(sec):
                q = norm(CITE.sub('', q))
                if len(q) >= 24:                      # 太短的容易误报
                    quote_owner.setdefault(q, []).append(key)

    # 1) 编号连续
    for cls in CLASSES:
        nos = sorted(per_class.get(cls, []))
        if not nos:
            problems.append(('整类缺失', '-', cls))
            continue
        want = list(range(1, len(nos) + 1))
        if nos != want:
            miss = [n for n in want if n not in nos]
            extra = [n for n in nos if n > len(nos)]
            problems.append(('编号不连续', cls, '共%d条，缺 %s，越界 %s' % (len(nos), miss or '无', extra or '无')))

    # 3) 交叉引用可解析
    for f in files:
        text = io.open(f, encoding='utf8').read()
        for cls, no, rest in XREF.findall(text):
            if not no:
                continue                              # **K 应用·家居城市** 这类只指整类，不校验
            key = cls + str(int(no))
            if key not in entries:
                problems.append(('交叉引用指向不存在的条目', f.name, key + '（' + rest.strip() + '）'))

    # 4) 跨条重复引文（_dup_ok.txt 里登记过理由的不再报）
    ok = set()
    f = HERE / '_dup_ok.txt'
    if f.exists():
        for line in io.open(f, encoding='utf8'):
            line = line.strip()
            if line and not line.startswith('#'):
                ok.add(frozenset(line.split()[0].split(',')))
    dups = {q: ks for q, ks in quote_owner.items()
            if len(set(ks)) > 1 and frozenset(set(ks)) not in ok}

    # ── 输出 ──
    print('条目合计 %d 条，分布：%s' % (
        len(entries), ' '.join('%s%d' % (c, len(per_class.get(c, []))) for c in CLASSES)))
    if problems:
        print('\n⚠️ %d 处问题：' % len(problems))
        for kind, where, what in problems:
            print('  [%s] %s：%s' % (kind, where, what))
    else:
        print('\n✅ 编号、引文、出处行、交叉引用全部通过')

    if dups:
        print('\n📎 跨条重复引文 %d 处（不一定是错，但值得看一眼是否该改成互链）：' % len(dups))
        for q, ks in sorted(dups.items(), key=lambda x: -len(x[1]))[:40]:
            print('  %s ← %s' % ('、'.join(sorted(set(ks))), q[:52] + ('…' if len(q) > 52 else '')))
        if verbose and len(dups) > 40:
            print('  …另有 %d 处' % (len(dups) - 40))
    else:
        print('\n✅ 没有计划外的跨条重复引文（白名单见 _dup_ok.txt）')

    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
