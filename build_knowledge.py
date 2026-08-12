#!/usr/bin/env python3
"""build_knowledge.py —— 由体系精讲生成 knowledge-detail.js（图鉴的详情层）。

旧版是手写的「现场怎么用／判断顺序三条／常见误用」，无出处、无核对。
新版直接给**教材原话**（带页码）＋精讲里标出的要害(⭐)与易错(⚠️)，
读者点开图鉴看到的每一句都能回查原书。

结构：id -> {q:[[原文, 出处], …], key:[…], warn:[…]}
"""
import io, json, re, pathlib
HERE = pathlib.Path(__file__).parent
exec(open(HERE / '_map_library.py', encoding='utf8').read())

s = io.open(HERE / 'data/lectures.js', encoding='utf8').read()
LEC = json.loads(s[s.index('['):s.rindex(']') + 1])
byCode = {i['n']: i for c in LEC for i in c['items'] if not i.get('note')}

def plain(t):
    return re.sub(r'<[^>]+>', '', t).strip()

MAXQ, MAXN = 3, 2
out = {}
for lid, code, _t, _w in MAP:
    it = byCode[code]
    qs, key, warn = [], [], []
    for b in it['blocks']:
        if b['t'] == 'q' and len(qs) < MAXQ:
            txt = plain('　'.join(b['v']))
            if 20 <= len(txt) <= 160:          # 太短没信息，太长在卡片里读不动
                qs.append([txt, b.get('src', '')])
        elif b['t'] == 'note':
            v = plain(b['v'])
            if b.get('k') == 'key' and len(key) < MAXN and len(v) > 12:
                key.append(v)
            elif b.get('k') == 'warn' and len(warn) < MAXN and len(v) > 12:
                warn.append(v)
    if not qs:                                  # 放宽长度限制再试一次
        for b in it['blocks']:
            if b['t'] == 'q' and len(qs) < MAXQ:
                qs.append([plain('　'.join(b['v']))[:160], b.get('src', '')])
    out[lid] = {'q': qs, 'key': key, 'warn': warn}

body = ',\n'.join(' %d:%s' % (k, json.dumps(v, ensure_ascii=False)) for k, v in sorted(out.items()))
io.open(HERE / 'knowledge-detail.js', 'w', encoding='utf8').write(
"""/* 由 build_knowledge.py 从体系精讲生成，勿手改——改精讲 md 后重跑本脚本。
   旧版是手写的「现场怎么用／判断顺序／常见误用」，无出处也从没被核对过。
   新版给的是**教材原话＋页码**，以及精讲里标出的要害(key)与易错(warn)。 */
const KNOWLEDGE_DETAIL={
""" + body + """
};
""")
n = sum(len(v['q']) for v in out.values())
print('✅ %d 条详情 · %d 处教材原话 · 要害 %d · 易错 %d → knowledge-detail.js'
      % (len(out), n, sum(len(v['key']) for v in out.values()), sum(len(v['warn']) for v in out.values())))
short = [k for k, v in out.items() if not v['q']]
print('没有可用原文的:', short or '无')
