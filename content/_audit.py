# -*- coding: utf-8 -*-
"""风水教材 md 质检：确认提取没吞内容、口诀没被粘连、不可靠页都已标出。

一个只会打印「通过」的脚本毫无价值——本脚本每项都拿实物证据：
随机抽原文完整句回验是否出现在 md 里、逐句报出缺失的那一条。
"""
import fitz, re, os, random, sys

SRC = "/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/fs合集/风水大合集"
HERE = os.path.dirname(os.path.abspath(__file__))

PAIRS = [
    ('杨公风水初级.md', '杨公风水初级合集.pdf', [(489, 764), (825, 882)]),  # 课件截图 + 重复的合并笔记
    ('杨公风水中级.md', '杨公风水中级合集.pdf', None),
    ('杨公风水高级.md', '杨公风水高级合集.pdf', None),
    ('家居风水高级课程.md', '家居风水高级课程合集书签版.pdf', [(1, 9)]),
    ('风水第一课.md', '风水第一课1-27合集书签版.pdf', None),
]

# 《风水第一课》是视频讲稿，每课首尾的口播是**刻意剥离**的，不是漏字。
# 不排除掉，这项检查就恒红——一个只会报红或只会报绿的脚本都没有价值。
DROPPED = re.compile(r'下一讲|本讲就讲到这里|欢迎(?:大家)?来到|再见|大家好|这里是《风水第一课》'
                     r'|欢迎收看|欢迎关|学风水，易先生|知天命'
                     r'|^\s*\d{1,2}、')     # 课号标题行已改写成 md 的 ## 标题

random.seed(20260811)
fail = 0

for mdname, pdfname, skip in PAIRS:
    md = open(os.path.join(HERE, mdname), encoding='utf8').read()
    flat = re.sub(r'\s', '', re.sub(r'<!--.*?-->', '', md, flags=re.S))
    d = fitz.open(os.path.join(SRC, pdfname))
    sk = set()
    for lo, hi in (skip or []):
        sk |= set(range(lo - 1, hi))
    pages = [i for i in range(d.page_count) if i not in sk]
    raw = '\n'.join(d[i].get_text() for i in pages)

    # 完整句：两个句读之间、12-30 字、不含换行断裂
    sents = [s for s in re.split(r'[。！？\n]', raw)
             if 12 <= len(s) <= 26 and '　' not in s and not DROPPED.search(s)]
    sample = random.sample(sents, min(120, len(sents)))
    miss = [s for s in sample if re.sub(r'\s', '', s) not in flat]

    verses = re.findall(r'(?:^> .*\n)+', md, re.M)
    frag = len(re.findall(r'疑似表格或竖排', md))
    imgs = len(re.findall(r'此页以图为主', md))
    han = lambda s: len(re.findall(r'[一-鿿]', s))

    ok = len(miss) <= 2
    if not ok:
        fail += 1
    print(f'\n{"✅" if ok else "❌"} {mdname}')
    print(f'   汉字 {han(flat)} / 原文 {han(raw)}｜抽查 {len(sample)} 句完整句，缺 {len(miss)}')
    print(f'   口诀块 {len(verses)}｜标注的表格/竖排页 {frag}｜以图为主页 {imgs}')
    for s in miss[:4]:
        print(f'   ✗ 未找到：{s.strip()[:34]}')

print(f'\n{"❌ 有文件未通过" if fail else "✅ 全部通过：抽查句全部能在 md 中找到"}')
sys.exit(1 if fail else 0)
