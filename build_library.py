#!/usr/bin/env python3
"""build_library.py —— 由体系精讲生成 library.js（知识图鉴）。

为什么要生成而不是手写：图鉴原来是手写摘要，出处只有书名标签、没有页码，
也从没被 _verify_cite 查过——查出「九不葬」只见于目录行、「十种证穴」五本
查无此说、「三种罗盘」漏掉「杨公只用地盘」。全站其余内容都是核对过的引文，
图鉴不能再用另一套口径。

⚠️ id = 数组下标+1 = SRS 进度的键。**顺序与条数绝不能动**，改了用户已学记录全废。
   所以本脚本严格按 _map_library.py 的 100 条顺序输出。

摘要取精讲的 lead（一句话结论），出处取精讲的 src（真实页码），
另存 lec 字段供「去精讲看全文」。
"""
import io, json, re, pathlib

HERE = pathlib.Path(__file__).parent
exec(open(HERE / '_map_library.py', encoding='utf8').read())

CAT = {}  # id -> 原分类（分类不变，它是「查」页的筛选维度）
src = io.open(HERE / 'library.js', encoding='utf8').read()
rows = re.findall(r"^\['([^']*)','([^']*)','([^']*)','([^']*)'\],?$", src, re.M)
assert len(rows) == 100, '原 library.js 不是 100 条：%d' % len(rows)
for i, r in enumerate(rows, 1):
    CAT[i] = (r[0], r[1])

s = io.open(HERE / 'data/lectures.js', encoding='utf8').read()
LEC = json.loads(s[s.index('['):s.rindex(']') + 1])
byCode = {i['n']: (c, i) for c in LEC for i in c['items'] if not i.get('note')}

def plain(t):
    return re.sub(r'<[^>]+>', '', t).replace('&amp;', '&').strip()

out, notes = [], []
for lid, code, newt, why in MAP:
    cat, oldt = CAT[lid]
    c, it = byCode[code]
    title = newt or oldt
    lead = ''
    srcline = ''
    for b in it['blocks']:
        if b['t'] == 'lead' and not lead:
            lead = plain(b['v'])
        if b['t'] == 'src' and not srcline:
            srcline = plain(b['v']).replace('出处：', '')
    if not lead:                      # 极少数没有「一句话」的，退回首条引文
        for b in it['blocks']:
            if b['t'] == 'q':
                lead = plain(b['v'][0])[:80]; break
    assert lead, '%s 没有可用摘要' % code
    assert srcline, '%s 没有出处行' % code
    out.append([cat, title, lead, srcline, code])
    if newt:
        notes.append('  %3d  %s → %s  （%s %s）%s' % (lid, oldt, title, code, plain(it['t']), why))

body = ',\n'.join(json.dumps(r, ensure_ascii=False) for r in out)
io.open(HERE / 'library.js', 'w', encoding='utf8').write(
"""/* 由 build_library.py 从体系精讲生成，勿手改——改精讲 md 后重跑本脚本。
   ⚠️ id = 下标+1 = SRS 进度的键，顺序与条数不可变（见 _map_library.py）。
   summary 取精讲的「一句话」，source 取精讲的真实页码，lec 指向精讲条目。 */
const LIBRARY=[
""" + body + """
].map((x,i)=>({id:i+1,cat:x[0],title:x[1],summary:x[2],source:x[3],lec:x[4]}));
""")
print('✅ 100 条 → library.js｜改标题 %d 条' % len(notes))
for n in notes:
    print(n)
