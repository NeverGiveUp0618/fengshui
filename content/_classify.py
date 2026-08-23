# -*- coding: utf-8 -*-
"""知识点 → 教材体系分类（生成 01-知识体系骨架.md）

体系取自教材自己的编排（龙穴砂水向 → 理气 → 罗盘 → 应用），不是外部套的框架。

⭐ 一个关键设计：**按知识点本体分类，语境做标签**。
   「城市寻龙」和「山地寻龙」是同一个知识点的两种语境，都归「龙」，各带语境标签；
   拆成「峦头·龙」和「城市·龙」两类，跨教材整合就无从谈起了。
   只有六事、室内布局、商业这类家居语境专属的内容才单列成「应用」。

分类依据的优先级：
   1. 知识点名的强特征词（黄泉一定是理气水法，哪怕出现在「观水」章节里）
   2. 所在章节的主题（教材自己就是按体系编排的，比猜知识点名准）
   3. 知识点名的弱特征词（用于「课堂笔记」这类无主题章节）
"""
import re, os, json
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, '_build_index.py'), encoding='utf8').read().split('def main()')[0])

# ── 体系：(代号, 名称, 说明) ────────────────────────────────
CATS = [
    ('A', '总论与门派', '风水的定义、误区辨正、峦头理气之争、各派别与学习次第'),
    ('B', '峦头·龙', '龙的行止剥换过峡、五星九星辨形、寻龙、干龙祖山'),
    ('C', '峦头·穴', '点穴证穴、五星结穴、穴形、二十四凶穴、入首开面'),
    ('D', '峦头·砂', '四象、察砂秀恶有情、吉凶砂、水口砂补峰、形煞'),
    ('E', '峦头·水', '观水放水、水形吉凶、水口出水、明堂、城市之水'),
    ('F', '峦头·向', '立向原则、坐山朝向、兼向'),
    ('G', '理气·基础', '阴阳五行、天干地支、八卦河洛、纳甲、三元三合'),
    ('H', '理气·水法砂法', '黄泉劫煞八煞羊刃禄堂、长生水法、三吉六秀辅星、归元串珠交媾、贵人将星'),
    ('I', '理气·派别用法', '八宅、玄空紫白飞星、三元大卦、太乙'),
    ('J', '罗盘与分金', '罗盘构成与选养、二十四山、分金、穿山透地、实操测量'),
    ('K', '应用·家居城市', '内外六事、室内形法、立极点分宫、商业与工厂、形煞化解'),
    ('L', '口诀歌赋', '八条歌、指迷赋、百章歌、掌诀、理气口诀'),
    ('M', '断验与应事', '富贵贫贱、火灾伤亡疾病子嗣等应事、案例、应期'),
]
CATNAME = {c: n for c, n, _d in CATS}

# ── 0. 不是知识点：录音时间段、笔记结构、章节残留 ───────────
NOISE = re.compile(
    r'^\d{6}(?:-+\d{6})?段$'                    # 155753段 / 202418--202707段
    r'|^\d{8}.*(?:笔记|答疑|提问)$'              # 20250515课堂笔记
    r'|^(?:重点\d*|总曰|断语|此诀讲的是|本上笔记|笔记本上记录|晚上课堂提问|老师解释)$'
    r'|^[一二三四五六七八九十]、'                  # 一、峦头部分
    r'|(?:线下课|第三期课程|附录参考|合并笔记|游学笔记|课堂笔记)$'
    r'|^老师站在.*讲$|^下面我讲|^凶星（二）|自己提问$'
    r'|^(?:课程内容介绍|应用方法|自己理解|解释|释义|以下为重点|老师|住家|另外的案例)$'
    r'|^最后几句话|^请把|^请王老师|^\d+号楼')


# ── 1. 强特征：知识点名一旦命中，直接定类（压过章节）──────────
# ⚠️ 水法要分两类，别混：
#    按干支/卦位命名的（三刑水、六害水、桃花水、火城水）是**理气**水法 → H
#    按形状命名的（金城水、裹头水、玉带、反弓）是**峦头**水形 → E
#    我第一版把三刑水、火城水放进了 E，是错的。
STRONG = [
    ('H', r'黄泉|劫煞|八煞|羊刃|禄堂|禄马|长生水|十二长生|三吉六秀|辅星|归元|串珠|'
          r'交媾|贫单绝|贵人峰|将星|隔八|隔壁口|五鬼|天喜|红鸾|文昌水|太乙|驳杂|'
          r'先后天水|夫妇|催官|救贫|三刑水|火城水|六害水|四破水|六合水|桃花水|'
          r'吉星|凶星|吉神|凶神|闹判|到山理|到水理|消峰|消砂纳水|三神水'),
    ('I', r'八宅|玄空|紫白|飞星|三元不败|三元大卦|翻卦|东四|西四|游年|伏位|'
          r'^生气$|生气位|生气方|天医|延年|绝命|六煞|祸害|五鬼宅|到山到水|双星到|上山下水|五黄|'
          r'天父卦|地母卦'),
    ('J', r'罗盘|天池|海底线|内盘|外盘|二十四山|分金|穿山|透地|廿八宿|二十八宿|'
          r'卦爻分金|测量|磁针|缝针|中针|正针|三针'),
    ('L', r'八条歌|指迷赋|百章歌|掌诀|口诀|歌诀|赋|经文|玉撵经|金镜|断诀|'
          r'阴宅断|阳宅断|何知经|坐向兑丁'),
    ('C', r'点穴|证穴|结穴|穴形|窝钳乳突|凶穴|开面|兜唇|穴星|葬法|倒杖|太极晕|'
          r'五不葬|葬坟|土色|地做大做小|选地|吐火地|喝形|^定点$|乘生气'),
    ('B', r'过峡|剥换|行止|贪狼|巨门|禄存|文曲|廉贞|武曲|破军|左辅|右弼|'
          r'木星|火星|土星|金星|水星|九星|五星|干龙|祖山|来龙|龙脉|寻龙|落脉|入首|'
          r'帐幕|童山|石山|独山|过山|断山|龙分|龙察|龙之|龙的|住结|横结|闪结|生跃'),
    ('D', r'青龙|白虎|朱雀|玄武|察砂|砂手|曜|水口砂|补峰|文昌塔|形煞|尖角|'
          r'天斩|孤峰|探头|反背|印砂|拨砂|贼旗|军旗|地漏|窝煞|电线塔|信号塔|'
          r'风力发电|照壁|四周的砂'),
    ('E', r'明堂|水口|来去水|出水|玉带|反弓|斜飞|直泄|聚水|放水|观水|水城|水的吉凶|'
          r'牵牛|割脚|淋头|瀑面|游渚|金城水|裹头水|水池|水路|阳沟|三步水|'
          r'水为财|水来去|水要汇聚|水就是河流|水是形家|水$|^水[分的为是要]'),
    ('K', r'六事|内六|外六|立极|分宫|入户门|门楼|安门|院门|卧室|厨房|厕所|'
          r'灶|床|楼梯|阳台|客厅|商铺|商业|工厂|办公|化解|室内|开门|耳门|内堂|'
          r'余坪|花台|户型|房间|院内|院外|四合院|缺角|房份|确定门|门的方位|'
          r'门的方向|阳宅总结|总高度|房子影响'),
    ('G', r'阴阳|五行相|天干|地支|六十甲子|八卦|河图|洛书|纳甲|三合|三元|'
          r'生克|旺相|四正|四维|卦象|五虎遁|合化|纳音|净阴净阳|^五行$'),
    ('M', r'应期|发富|发贵|富贵|贫贱|火灾|伤亡|疾病|无后|绝嗣|寿|案例|断验|应事|'
          r'氏宗祠|氏分祠|祠堂|^宗祠$|母亲墓|旺财|利于读书|建阳宅'),
    ('F', r'立向|坐山|朝向|兼向|向法|确定方向|坐的方位'),
    ('A', r'误区|门派|派别|峦头与理气|学风水|入门|次第|真假|辟谣|类象|'
          r'^峦头$|^风水$|风水原则|神秘面纱|三步曲|平原风水看法|^声音$|^颜色$|^形态$|'
          r'什么是风水|何为风水|风水常识|'
          r'做风水大的原则|理气上的原则'),
]
STRONG = [(c, re.compile(p)) for c, p in STRONG]

# ── 2. 章节主题 → 类别（教材自己的编排，最可靠）─────────────
SECMAP = [
    (r'风水误区|风水概念|误区价值|门派', 'A'),
    (r'龙行止|剥换|寻龙与过峡|寻龙和九星|九星|五星(?!结穴)', 'B'),
    (r'五星结穴|二十四凶穴|点穴证穴|论地', 'C'),
    (r'察砂|吉凶砂', 'D'),
    (r'观水|放水|吉凶之水|察砂与观水', 'E'),
    (r'立向', 'F'),
    (r'阴阳五行|八卦河洛|天干地支', 'G'),
    (r'黄泉|隔八|八煞|劫煞|羊刃|禄堂|交媾|太乙|串珠|贫单绝|先后天水|'
     r'河图纳甲|归元|辅星|三吉六秀|贵人峰|将星|长生水法|子午斜流|文昌天喜|'
     r'五鬼闹判|横财|理气(?!口诀)', 'H'),
    (r'八宅|玄空|紫白|三元不败', 'I'),
    (r'罗盘|分金|廿八宿|二十八宿|卦爻', 'J'),
    (r'内六事|外六事|商业风水|工厂规划|阳宅布局|室内形法|实操应用', 'K'),
    (r'指迷赋|八条歌|口诀|玉撵经|掌诀', 'L'),
    (r'城市.*寻龙', 'B'), (r'城市.*察砂', 'D'), (r'城市.*观水', 'E'),
    (r'城市.*点穴', 'C'),
]
SECMAP = [(re.compile(p), c) for p, c in SECMAP]

# ── 3. 语境标签（不影响分类，只作标注）────────────────────
CONTEXT = [('城市', re.compile(r'城市|都市|楼|马路|高架|小区')),
           ('家居', re.compile(r'室内|家居|卧室|厨|厕|门楼|入户')),
           ('阴宅', re.compile(r'阴宅|墓|坟|葬|祖坟')),
           ('平原', re.compile(r'平原|平阳|平洋'))]

NOSEC = re.compile(r'课堂笔记|游学笔记|合并笔记|线下课|课堂和游学|自己提问|附录|'
                   r'^\d{4}年|^[一二三四五六七八九十]、')


# 少数条目靠正则怎么排都会打架，直接点名。
# 「什么是风水」以「水」结尾，会被峦头·水的 `水$` 规则抓走，但它明明是总论。
EXACT = {'什么是风水': 'A', '何为风水': 'A', '风水': 'A', '峦头': 'A',
         '太阳到水': 'H', '太阴到水': 'H', '太阳到山': 'H', '太阴到山': 'H'}


def classify(term, sec):
    if NOISE.search(term):
        return 'X', 'noise'
    if term in EXACT:
        return EXACT[term], 'exact'
    for c, rx in STRONG:
        if rx.search(term):
            return c, 'term'
    if sec and not NOSEC.search(sec):
        for rx, c in SECMAP:
            if rx.search(sec):
                return c, 'sec'
    return None, None


def main():
    rows = []
    for fn, label in BOOKS:
        for t, sec, p in parse(os.path.join(HERE, fn)):
            c, how = classify(t, sec)
            ctx = [name for name, rx in CONTEXT if rx.search(t) or (sec and rx.search(sec))]
            rows.append({'t': t, 'sec': sec, 'p': p, 'book': label, 'c': c,
                         'how': how, 'ctx': ctx})

    # 同名知识点跨书归并
    merged = defaultdict(lambda: {'cats': Counter(), 'src': defaultdict(list), 'ctx': set()})
    for r in rows:
        m = merged[r['t']]
        if r['c']:
            m['cats'][r['c']] += 1
        m['src'][r['book']]          # 即使没页码也要留下书名（第一课那本按课切、无页码）
        if r['p']:
            m['src'][r['book']].append(r['p'])
        m['ctx'] |= set(r['ctx'])

    unclassified = [t for t, m in merged.items() if not m['cats']]
    bycat = defaultdict(list)
    for t, m in merged.items():
        if m['cats']:
            bycat[m['cats'].most_common(1)[0][0]].append((t, m))

    L = ['# 风水知识体系骨架（按教材体系分类）\n',
         '> 由 `_classify.py` 生成。体系取自教材自己的编排，不是外部套的框架。\n'
         '> **按知识点本体分类，语境做标签**：「城市寻龙」与「山地寻龙」同归「峦头·龙」，'
         '各带语境标记，这样跨教材整合时才并得到一起。\n']
    noise_n = len(bycat.pop('X', []))
    tot = sum(len(v) for v in bycat.values())
    L.append(f'\n已归类 **{tot}** 个知识点，待定 {len(unclassified)} 个'
             f'（另剔除 {noise_n} 条录音时间戳、笔记结构等非知识点条目）。\n')
    L.append('\n| 类 | 名称 | 知识点数 | 涵盖 |')
    L.append('|---|---|---|---|')
    for c, n, d in CATS:
        L.append(f'| {c} | **{n}** | {len(bycat.get(c,[]))} | {d} |')

    # ⭐ 覆盖本数要用**全文**统计，不能用标题级：各书叫法不同，标题级只认出 6 个，
    #    全文级是 335 个。骨架是为跨教材整合服务的，这个数标错就没意义了。
    books_pages = {label: pages_of(os.path.join(HERE, fn), by_lesson=(label == '第一课'))
                   for fn, label in BOOKS}
    allterms = sorted({t for t in merged if 2 <= len(t) <= 8})
    spread = term_spread(allterms, books_pages)

    def render(t, m, depth=0):
        src = '；'.join((f'{b} p{",".join(map(str, sorted(set(ps))[:4]))}' if ps else b)
                        for b, ps in m['src'].items())
        ctx = ''.join(f' `{x}`' for x in sorted(m['ctx']))
        sp = spread.get(t, {})
        nb = len(sp)
        flag = f' **★{nb}本**' if nb >= 3 else (' ★2本' if nb == 2 else '')
        where = ''
        if nb >= 2:
            where = '　<small>' + '／'.join(
                f'{b}{v[0]}次' for b, v in sorted(sp.items(), key=lambda kv: -kv[1][0])) + '</small>'
        return '  ' * depth + f'- **{t}**{ctx}{flag}{where or "　<small>" + src + "</small>"}'

    for c, n, d in CATS:
        items = bycat.get(c, [])
        if not items:
            continue
        L.append(f'\n\n## {c}　{n}\n')
        L.append(f'*{d}*　·　{len(items)} 个知识点\n')
        # 两级：短名作父，包含它的长名作子（「黄泉」→「反复黄泉」「八煞黄泉」…）
        names = sorted((t for t, _m in items), key=len)
        parent = {}
        for t in sorted((t for t, _m in items), key=len, reverse=True):
            cands = [x for x in names if x != t and x in t and len(x) >= 2]
            if cands:
                parent[t] = max(cands, key=len)
        dic = dict(items)
        children = defaultdict(list)
        for t, par in parent.items():
            children[par].append(t)
        roots = [t for t, _m in items if t not in parent]
        roots.sort(key=lambda t: (-len(spread.get(t, {})),
                                  -sum(len(v) for v in dic[t]['src'].values()), t))
        for t in roots:
            L.append(render(t, dic[t]))
            for ch in sorted(children.get(t, []),
                             key=lambda x: (-len(spread.get(x, {})), x)):
                L.append(render(ch, dic[ch], 1))
                for gch in sorted(children.get(ch, [])):
                    L.append(render(gch, dic[gch], 2))

    if unclassified:
        L.append('\n\n## 待定（规则未覆盖，需人工归类）\n')
        L.append(f'{len(unclassified)} 个：\n')
        L.append('　'.join(unclassified[:400]))

    out = os.path.join(HERE, '01-知识体系骨架.md')
    open(out, 'w', encoding='utf8').write('\n'.join(L))
    json.dump({t: {'cat': m['cats'].most_common(1)[0][0] if m['cats'] else None,
                   'src': {b: sorted(set(ps)) for b, ps in m['src'].items()},
                   'ctx': sorted(m['ctx'])} for t, m in merged.items()},
              open(os.path.join(HERE, '_cats.json'), 'w', encoding='utf8'),
              ensure_ascii=False, indent=1)

    print(f'✅ {out}  {os.path.getsize(out)/1024:.0f} KB')
    print(f'   已归类 {tot}｜待定 {len(unclassified)}｜剔除噪音 {noise_n}')
    for c, n, _d in CATS:
        print(f'   {c} {n:<14} {len(bycat.get(c,[])):>4}')
    byhow = Counter(r['how'] for r in rows if r['how'])
    print(f'\n   命中方式：知识点名 {byhow["term"]}｜章节主题 {byhow["sec"]}')
    print('\n   待定样例：' + '　'.join(unclassified[:25]))


if __name__ == '__main__':
    main()
