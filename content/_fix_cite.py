# -*- coding: utf-8 -*-
"""把精讲稿里的引用页码改成实测值（配合 _verify_cite.py 用）。

只改页码数字，不动书名、不动引文一个字。引文本身若与原文不符，
必须人工回原文改——那属于引用准确性，不能自动"修"。

用法：python3 _fix_cite.py [文件…]　　-n 只看不改
"""
import re, os, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import importlib.util
spec = importlib.util.spec_from_file_location('vc', os.path.join(HERE, '_verify_cite.py'))
vc = importlib.util.module_from_spec(spec)
spec.loader.exec_module.__self__ if False else None
src = open(os.path.join(HERE, '_verify_cite.py'), encoding='utf8').read()
exec(src.split("def main()")[0])          # 复用 load/where/probes/CITE


def fix(path, dry=False):
    lines = open(path, encoding='utf8').read().split('\n')
    changed = 0
    i = 0
    while i < len(lines):
        if not lines[i].startswith('>'):
            i += 1
            continue
        j = i
        while j < len(lines) and lines[j].startswith('>'):
            j += 1
        block = '\n'.join(lines[i:j])
        for k in range(i, j):
            for cite in CITE.findall(lines[k]):
                m = re.match(r'\s*(初级|中级|家居|高级|第一课)\s*(.*)', cite)
                if not m:
                    continue
                book, rest = m.group(1), m.group(2)
                if not re.search(r'p\d+', rest):
                    continue          # 「第N课」式定位不动
                found = set()
                for pr in probes(block):
                    found |= set(x for x in where(book, pr) if x.startswith('p'))
                if not found:
                    continue
                declared = set('p' + x for x in re.findall(r'p(\d+)', rest))
                if declared & found:
                    continue
                real = sorted(found, key=lambda x: int(x[1:]))
                newrest = re.sub(r'p\d+(\s*[,，、]\s*p?\d+)*', ','.join(real), rest, count=1)
                old = f'〔{cite}〕'
                new = f'〔{book} {newrest}〕'
                lines[k] = lines[k].replace(old, new)
                changed += 1
                print(f'   {old} → {new}')
        i = j
    if changed and not dry:
        open(path, 'w', encoding='utf8').write('\n'.join(lines))
    return changed


if __name__ == '__main__':
    dry = '-n' in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith('-')] or \
            sorted(glob.glob(os.path.join(HERE, '0*-精讲-*.md')))
    tot = 0
    for f in files:
        print(f'\n### {os.path.basename(f)}')
        tot += fix(f, dry)
    print(f'\n{"（试运行）" if dry else ""}共修正 {tot} 处页码')
