# -*- coding: utf-8 -*-
"""风水教材 markdown → data/textbook.js

⭐ 与本站其余内容相反：markdown 是源，data/textbook.js 是产物（勿手改产物）。
理由同 bazi-course——教材还会持续加，分叉成两份早晚对不上。
改内容只改 Obsidian 里的 md，然后 `python3 build.py`。

零依赖，只用标准库。
"""
import re, os, sys, json

SRC_DIR = os.path.expanduser(
    '~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/学习/风水教材')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'textbook.js')

# 已收录的教材：(文件名, 册名, 副标题, 分组定义)
# 分组＝把连续课号归到一个主题下，首页按组显示，避免 27 课平铺
BOOKS = [{
    'id': 'fs01',
    'file': '风水第一课.md',
    'name': '风水第一课',
    'sub': '入门导论 · 27 课',
    'source': '《风水第一课》1-27 合集',
    'groups': [
        ('什么是风水', 1, 5),
        ('门派与学法', 6, 9),
        ('家居常见疑问', 10, 13),
        ('峦头入门', 14, 17),
        ('五星辨形', 18, 22),
        ('实地应用', 23, 27),
    ],
}]

# 正文里出现这些词 → 该课与站内已有内容相关，供「延伸」互链用
# ⚠️ 只做关键词提示，不复制内容：教材＝系统读，精读课＝视觉识形卡，图鉴＝速查，三者不重写。
# ⚠️ 用词干而非全称（「火星」不是「火星山」）：图鉴条目叫「五星山形」、精读课叫
#    「木星与火星」，写全称会一个都匹配不上，前端只好把整行延伸都过滤掉。
#    前端还会再过滤一道——图鉴和精读课都搜不到的词不显示，避免点出空结果。
LINK_HINTS = ['贪狼', '木星', '火星', '土星', '金星', '水星', '五星', '九星',
              '青龙', '白虎', '明堂', '反弓', '玉带', '过峡', '龙脉',
              '寻龙', '点穴', '立向', '水口', '罗盘', '二十四山']


def parse(md):
    """解析 markdown → [{n,title,alt,paras}]，paras 里 {'t':'p'|'verse','v':...}"""
    lessons = []
    cur = None
    alt_pending = None
    for raw_line in md.split('\n'):
        line = raw_line.rstrip()
        m = re.match(r'^##\s*第(\d+)课\s*(.+)$', line)
        if m:
            if cur:
                lessons.append(cur)
            cur = {'n': int(m.group(1)), 'title': m.group(2).strip(),
                   'alt': [], 'paras': []}
            continue
        if cur is None:
            continue
        m = re.match(r'^<!--\s*备选标题：(.+?)\s*-->$', line)
        if m:
            cur['alt'] = [x.strip() for x in m.group(1).split('/')]
            continue
        if line.startswith('<!--'):        # 口播结尾等注释，不进正文
            continue
        if line.startswith('> '):
            v = line[2:].strip()
            if cur['paras'] and cur['paras'][-1]['t'] == 'verse':
                cur['paras'][-1]['v'].append(v)
            else:
                cur['paras'].append({'t': 'verse', 'v': [v]})
            continue
        if line.strip():
            cur['paras'].append({'t': 'p', 'v': line.strip()})
    if cur:
        lessons.append(cur)
    return lessons


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def main():
    books_out = []
    problems = []
    for b in BOOKS:
        path = os.path.join(SRC_DIR, b['file'])
        if not os.path.exists(path):
            print(f'✗ 找不到源文件 {path}', file=sys.stderr)
            sys.exit(1)
        lessons = parse(open(path, encoding='utf8').read())
        # 自检：课号必须连续、无空课
        ns = [l['n'] for l in lessons]
        if ns != list(range(1, len(ns) + 1)):
            problems.append(f'{b["name"]}：课号不连续 {ns}')
        for l in lessons:
            if not l['paras']:
                problems.append(f'{b["name"]} 第{l["n"]}课「{l["title"]}」正文为空')
            nchar = sum(len(p['v']) if p['t'] == 'p' else sum(map(len, p['v']))
                        for p in l['paras'])
            l['chars'] = nchar
            if nchar < 200:
                problems.append(f'{b["name"]} 第{l["n"]}课只有 {nchar} 字，疑似被切坏')
            l['hints'] = [h for h in LINK_HINTS
                          if any(h in (p['v'] if p['t'] == 'p' else ''.join(p['v']))
                                 for p in l['paras'])]
        # 分组校验：每课必须恰好属于一个组
        covered = []
        for _g, a, z in b['groups']:
            covered += list(range(a, z + 1))
        if sorted(covered) != ns:
            problems.append(f'{b["name"]}：分组覆盖 {sorted(covered)} 与课号 {ns} 不符')
        b2 = dict(b)
        b2['lessons'] = lessons
        books_out.append(b2)

    if problems:
        print('✗ 自检未通过：', file=sys.stderr)
        for p in problems:
            print('   ' + p, file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    parts = ['/* 本文件由 build.py 生成，勿手改。源：Obsidian/MyNotes/学习/风水教材/ */\n',
             'const TEXTBOOKS=[\n']
    for b in books_out:
        parts.append('{id:\'%s\',name:\'%s\',sub:\'%s\',source:\'%s\','
                     % (b['id'], esc(b['name']), esc(b['sub']), esc(b['source'])))
        parts.append('groups:[' + ','.join(
            "['%s',%d,%d]" % (esc(g), a, z) for g, a, z in b['groups']) + '],')
        parts.append('lessons:[\n')
        for l in b['lessons']:
            ps = ','.join(
                ("'%s'" % esc(p['v'])) if p['t'] == 'p'
                else ('{v:[%s]}' % ','.join("'%s'" % esc(x) for x in p['v']))
                for p in l['paras'])
            parts.append("{n:%d,t:'%s',c:%d,alt:[%s],hints:[%s],p:[%s]},\n"
                         % (l['n'], esc(l['title']), l['chars'],
                            ','.join("'%s'" % esc(x) for x in l['alt']),
                            ','.join("'%s'" % esc(x) for x in l['hints']), ps))
        parts.append(']},\n')
    parts.append('];\n')
    parts.append('if(typeof module!=="undefined")module.exports={TEXTBOOKS};\n')
    open(OUT, 'w', encoding='utf8').write(''.join(parts))

    total = sum(len(b['lessons']) for b in books_out)
    chars = sum(l['chars'] for b in books_out for l in b['lessons'])
    size = os.path.getsize(OUT)
    print(f'✅ {len(books_out)} 册 · {total} 课 · {chars} 字 → data/textbook.js（{size/1024:.1f} KB）')
    for b in books_out:
        print(f'   {b["name"]}：{len(b["lessons"])} 课，'
              f'{sum(l["chars"] for l in b["lessons"])} 字，'
              f'{len(b["groups"])} 组')


if __name__ == '__main__':
    main()
