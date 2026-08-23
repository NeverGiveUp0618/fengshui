# -*- coding: utf-8 -*-
"""五本风水教材 md → 知识点清单（00-知识点清单.md）

为跨教材整合做准备：同一个知识点（如「二十四山」）在初级课件、中级理气、
家居高级罗盘实操里各讲一遍，深浅侧重不同。清单要能一眼看出
**这个知识点在哪几本书的哪几页出现过**，才谈得上整合。

候选来源：md 的章节标题 + 正文条目行（一、／1、／（一））+ 冒号短标题。
只做客观归集，不臆断分类、不改写原文。
"""
import re, os, json
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = [
    ('杨公风水初级.md', '初级'),
    ('杨公风水中级.md', '中级'),
    ('家居风水高级课程.md', '家居高级'),
    ('杨公风水高级.md', '高级'),
    ('风水第一课.md', '第一课'),
]

ITEM = re.compile(r'^(?:[一二三四五六七八九十]+[、．]'
                  r'|[（(][一二三四五六七八九十\d]+[)）][、．]?'
                  r'|\d+[、．](?!\d))\s*(.+)$')
PAGE = re.compile(r'^<!--\s*(?:p|图 p|⚠️ p)(\d+)')
HEAD = re.compile(r'^(#{2,4})\s*(.+)$')

# 正文句子混进来的特征：带句读、以连接词起头、太长
BAD_START = ('如', '即', '是', '在', '有', '不', '这', '那', '因', '所以', '比如', '例', '注')
DROP_CHARS = '，。；！？"”'

# ⚠️ 结构/导航词必须剔除，否则「跨教材重复」榜首全是「视频1」「目录」「封面」
#    「答疑」「用法」这类噪音，真知识点被埋掉。
STOP = {'目录', '封面', '总封面', '答疑', '自己提问', '提问', '笔记', '课件', '练习题',
        '附录', '附录参考', '用法', '注', '例', '说明', '总结', '小结', '内容', '要点',
        '原则', '方法', '区别', '作用', '意思', '如下', '图中', '上图', '下图', '补充',
        '课堂补充', '游学笔记', '课堂笔记', '第一部分', '第二部分', '第三部分',
        '峦头部分', '理气部分', '前言', '概述', '简介', '其他', '其它', '问', '答',
        # 单独出现时没有知识点价值的泛词（组合成「十二长生水法推算步骤」时不受影响，
        # STOP 是精确匹配）。不清掉，它们会靠高频占据每一类的前排。
        '特点', '年运', '区别', '总结', '步骤', '范围', '程度', '条件', '类型', '种类',
        '名称', '顺序', '方向', '效果', '意义', '价值', '目的', '方式', '形式', '状态',
        '解释', '释义', '注解', '含义', '定义', '特征', '标准', '依据', '原理', '技巧',
        '关键', '核心', '重点', '难点', '推算方法', '应用方法', '推算步骤', '用法总结'}
STOP_RE = re.compile(r'^(?:视频\s*\d+|第\s*\d+\s*[课节讲部]|课程\d+|'
                     r'线下课.*|直播.*回放|\d{4}年.*课|.*线上课'
                     r'|\d{6}[-–—\d]*录音.*|.*录音$'      # 250619-005录音
                     r'|老师答|学员?问|群里答疑|同学问|问答'
                     r'|.*课件$)$')
# 标题里的前缀（「第3课 什么风水最旺财」→「什么风水最旺财」）
PREFIX = re.compile(r'^(?:第\s*[\d一二三四五六七八九十]+\s*[课节讲部分]+[上中下]?'
                    r'|视频\s*[\d\-–~至]+)\s*[:：、]?\s*')
# 口语句混进条目的特征（「他马上竖大拇指」「倒地木和倒地火没有搞明白」）
CHATTY = re.compile(r'^[他她它你我]|没有搞|不明白|没听懂|忘记了|记不|马上|竖大拇指'
                    r'|下来讲|讲一下|说一下|再来看|接下来'
                    r'|^上面|^更改后|^改为|^前面讲|^如下|^下面是|^以下为')


def norm(s):
    """条目文字 → 知识点名：剥前缀、切掉冒号后的解释、去掉括号注和尾标点"""
    s = s.strip()
    s = re.sub(r'^\*+|\*+$', '', s)
    s = re.sub(r'^[（(][^）)]*[）)]\s*', '', s)   # 「（杨公高级补充）寿考」→「寿考」
    s = re.sub(r'^[A-Za-z][.、）)]\s*', '', s)     # 「A.生气」→「生气」（八宅九星那组）
    s = PREFIX.sub('', s)          # 「第3课 什么风水最旺财」→「什么风水最旺财」
    s = re.split(r'[:：]', s)[0]
    s = re.sub(r'[（(][^）)]*[）)]\s*$', '', s)      # 尾部括号注
    s = s.strip(' 　、．.-—')
    return s


def ok(s):
    if not (2 <= len(s) <= 16):
        return False
    if any(c in s for c in DROP_CHARS):
        return False
    if s.startswith(BAD_START):
        return False
    if re.fullmatch(r'[\d一二三四五六七八九十）)、．.\s]+', s):
        return False
    if s in STOP or STOP_RE.match(s):
        return False
    if CHATTY.search(s):
        return False
    return True


def parse(path):
    """→ [(知识点, 章节, 页码)]"""
    out = []
    page, sec = None, ''
    for ln in open(path, encoding='utf8'):
        ln = ln.rstrip('\n')
        m = PAGE.match(ln.strip())
        if m:
            page = int(m.group(1))
            continue
        if ln.startswith('<!--'):
            continue
        m = HEAD.match(ln)
        if m:
            sec = m.group(2).strip()
            t = norm(sec)
            if ok(t):
                out.append((t, sec, page))
            continue
        s = ln.strip()
        if not s or s.startswith(('>', '```', '*（')):
            continue
        m = ITEM.match(s)
        cand = None
        if m:
            cand = norm(m.group(1))
        elif len(s) <= 16 and s.endswith(('：', ':')):
            cand = norm(s)
        if cand and ok(cand):
            out.append((cand, sec, page))
    return out


# 术语级泛词：作为「知识点」没有整合价值，会把真术语挤出榜单
GENERIC = {'风水', '老师', '案例', '口诀', '内容', '方法', '问题', '时候', '地方',
           '东西', '情况', '图片', '照片', '视频', '大家', '我们', '自己', '现在',
           '以后', '这样', '那样', '什么', '怎么', '如何', '可以', '需要', '注意',
           '说明', '总结', '要点', '基础', '应用', '实际', '一般', '比如', '例如',
           '师父', '师爷', '东家', '同学', '学员', '课程', '讲座', '笔记', '补充',
           '房子', '房屋', '地方', '位置', '时间', '关系', '影响', '结果', '原因'}


def pages_of(path, by_lesson=False):
    """md → [(定位标识, 该块正文)]，用于术语的全文定位。
    ⚠️《风水第一课》是按课切的、没有 `<!-- p## -->` 页码标记，
       不特殊处理会整本漏掉（表格里那一列全是「—」）。它改用课号定位。"""
    out, loc, buf = [], None, []
    for ln in open(path, encoding='utf8'):
        if by_lesson:
            m = re.match(r'^##\s*(第\d+课)', ln)
            if m:
                if loc:
                    out.append((loc, ''.join(buf)))
                loc, buf = m.group(1), []
                continue
        else:
            m = PAGE.match(ln.strip())
            if m:
                if loc:
                    out.append((loc, ''.join(buf)))
                loc, buf = 'p' + m.group(1), []
                continue
        if ln.startswith('<!--'):
            continue
        buf.append(ln)
    if loc:
        out.append((loc, ''.join(buf)))
    return out


def term_spread(terms, books):
    """术语 → {书: (出现次数, [页码])}。
    ⚠️ 标题级精确匹配会把「劫煞」和「二十四山劫煞」当两回事，跨教材重复
       只认出 65 个。全文搜索才看得出一个知识点真正在哪几本书里讲过。"""
    spread = defaultdict(dict)
    for label, pgs in books.items():
        for t in terms:
            hits, n = [], 0
            for p, txt in pgs:
                c = txt.count(t)
                if c:
                    n += c
                    hits.append(p)
            if n:
                spread[t][label] = (n, hits)
    return spread


def main():
    per_book = {}
    idx = defaultdict(lambda: defaultdict(list))     # 知识点 → 书 → [页]
    struct = defaultdict(list)                        # 书 → [(章节, 知识点, 页)]
    for fn, label in BOOKS:
        items = parse(os.path.join(HERE, fn))
        per_book[label] = items
        for t, sec, p in items:
            if p and p not in idx[t][label]:
                idx[t][label].append(p)
            elif not p and not idx[t][label]:
                idx[t][label] = []
            struct[label].append((sec, t, p))

    labels = [l for _f, l in BOOKS]
    # 跨教材：出现在 ≥2 本里的知识点
    cross = {t: b for t, b in idx.items() if len(b) >= 2}
    cross_sorted = sorted(cross.items(), key=lambda kv: (-len(kv[1]),
                          -sum(len(v) for v in kv[1].values()), kv[0]))

    L = ['# 风水知识点清单（五本教材全量）\n',
         '> 由 `_build_index.py` 从五本 md 自动归集，页码可回查原文。\n'
         '> 只做客观归集：知识点名取自教材自己的条目标题，未改写、未按我的理解分类。\n']
    L.append(f'\n**总计 {len(idx)} 个不重复知识点**，其中 **{len(cross)} 个跨教材重复出现**'
             f'（这些是整合时要合并的重点）。\n')

    # 术语级：拿 2-6 字的知识点名当术语，回到全文里数
    books_pages = {label: pages_of(os.path.join(HERE, fn), by_lesson=(label == '第一课'))
                   for fn, label in BOOKS}
    terms = sorted({t for t in idx if 2 <= len(t) <= 6 and t not in GENERIC})
    spread = term_spread(terms, books_pages)
    multi = {t: b for t, b in spread.items() if len(b) >= 2}
    multi_sorted = sorted(multi.items(),
                          key=lambda kv: (-len(kv[1]), -sum(v[0] for v in kv[1].values())))

    L.append('\n## 一、跨教材讲过的知识点（全文统计）\n')
    L.append(f'共 **{len(multi)}** 个术语在两本以上教材里出现。数字＝该书里出现次数，'
             '括号内是页码（只列前 3 页）。**这是整合时要合并的清单**——'
             '同一个知识点在初级、中级、家居高级里深浅与侧重都不同。\n')
    L.append('\n| 知识点 | 覆盖 | 总频次 | ' + ' | '.join(labels) + ' |')
    L.append('|---|---|---|' + '---|' * len(labels))
    for t, b in multi_sorted[:400]:
        cells = []
        for l in labels:
            v = b.get(l)
            if v:
                n, ps = v
                cells.append(f'{n}次 ({",".join(ps[:3])}{"…" if len(ps)>3 else ""})')
            else:
                cells.append('—')
        L.append(f'| **{t}** | {len(b)}本 | {sum(v[0] for v in b.values())} | '
                 + ' | '.join(cells) + ' |')
    if len(multi_sorted) > 400:
        L.append(f'\n（另有 {len(multi_sorted)-400} 个只在少数几处出现，见 `_index.json`）\n')

    L.append('\n\n## 二、标题级重复（各书目录里用同一个名字的）\n')
    L.append('\n| 知识点 | 覆盖 | ' + ' | '.join(labels) + ' |')
    L.append('|---|---|' + '---|' * len(labels))
    for t, b in cross_sorted:
        cells = []
        for l in labels:
            ps = b.get(l)
            cells.append('p' + ',p'.join(map(str, ps[:4])) + ('…' if ps and len(ps) > 4 else '')
                         if ps else '—')
        L.append(f'| **{t}** | {len(b)}本 | ' + ' | '.join(cells) + ' |')

    L.append('\n\n## 三、按教材结构的完整清单\n')
    L.append('教材自己的章节层级，条目后的页码可直接回查原文。\n')
    for _fn, label in BOOKS:
        seen_sec, rows = None, []
        for sec, t, p in struct[label]:
            if sec != seen_sec:
                rows.append(f'\n**{sec}**\n')
                seen_sec = sec
            rows.append(f'- {t}' + (f' <!-- p{p} -->' if p else ''))
        n = len([r for r in rows if r.startswith('- ')])
        L.append(f'\n### {label}（{n} 条）\n')   # 条数写进标题，别再事后 insert（会插错位）
        L.extend(rows)

    out = os.path.join(HERE, '00-知识点清单.md')
    open(out, 'w', encoding='utf8').write('\n'.join(L))
    json.dump({t: dict(b) for t, b in idx.items()},
              open(os.path.join(HERE, '_index.json'), 'w', encoding='utf8'),
              ensure_ascii=False, indent=1)

    print(f'✅ {out}  {os.path.getsize(out)/1024:.0f} KB')
    print(f'   不重复知识点 {len(idx)}｜跨教材重复 {len(cross)}')
    for _f, l in BOOKS:
        print(f'   {l}: {len(per_book[l])} 条候选')
    print('\n跨教材出现最多的 20 个：')
    for t, b in cross_sorted[:20]:
        print(f'   {t:<12} {len(b)}本  ' + ' '.join(f'{k}{len(v)}处' for k, v in b.items()))


if __name__ == '__main__':
    main()
