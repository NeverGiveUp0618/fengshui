# -*- coding: utf-8 -*-
"""《风水第一课》1-27 → markdown 教材（试点）
只用标准库 + fitz，照 bazi-course 的思路：PDF 是源、markdown 是产物给人读。
切分锚点＝每课口播开场白（3 种变体），锚点前的连续非空行＝标题（可能有备选）。
"""
import fitz, re, os, sys, json

PDF = "/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/fs合集/风水大合集/风水第一课1-27合集书签版.pdf"

# 每课开场白。⚠️ 别写死「学风水，易先生，」这个前缀——第1课是「"学风水，知天命"；
# 欢迎大家来到…」，写死会漏掉它、导致 27 课整体错位一课（拿书签逐条比对才发现）。
# 只认「欢迎…来到风水文化第一课」这个共同核心，另加第2课的独立变体。
OPEN = re.compile(r'(?:欢迎(?:大家)?来到《?风水文化第一课》?'
                  r'|大家好[！!]\s*这里是《风水第一课》)')
# 制作标记行，整行丢弃
NOISE = re.compile(r'^\s*(?:字[：:]\s*(?:物料补充|建议增减)|[—–-]{8,})\s*$')
# 结尾口播：下一讲预告 / 再见
OUTRO = re.compile(r'^(?:好[！!，,]?\s*)?(?:本讲就讲到这里|好本讲就讲到这里)')
# 开场白常被 PDF 硬折成两行，前半截会被误当成备选标题，须剔除
OPEN_FRAG = re.compile(r'(?:易先生|知天命|学风水[，,]\s*$|大家好)')


def load_pages():
    d = fitz.open(PDF)
    toc = [t for _lv, t, _p in d.get_toc()]
    raw = "\n".join(d[i].get_text() for i in range(d.page_count))
    return raw, toc, d.page_count


END = '。！？；："」』）…—'


def is_verse_run(lines, i):
    """判断从 i 起是否是口诀/韵文：连续 ≥2 行、每行 5-9 字、无句读、字数整齐。
    ⚠️ 不加这条，「地理先须辨五星／木直火尖土星横…」四句会被硬折行规则粘成一坨，
    连后面的「说的意思是」都糊进去——风水教材里口诀极多，这是必须保住的东西。"""
    run = []
    for ln in lines[i:]:
        s = ln.strip()
        if not (5 <= len(s) <= 9) or any(c in s for c in END + '，,、'):
            break
        run.append(s)
    if len(run) < 2:
        return 0
    # 字数整齐才算韵文（允许 1 字浮动），否则是普通短句
    if max(len(x) for x in run) - min(len(x) for x in run) > 1:
        return 0
    return len(run)


def unwrap(lines):
    """归并 PDF 硬折行：行尾无句读则与下一行接续；但口诀原样保留分行。"""
    lines = [l.strip() for l in lines if l.strip()]
    out, i = [], 0
    while i < len(lines):
        n = is_verse_run(lines, i)
        if n:
            out.append('@@VERSE@@' + '\n'.join(lines[i:i + n]))
            i += n
            continue
        ln = lines[i]
        if out and not out[-1].startswith('@@VERSE@@') and out[-1][-1] not in END:
            out[-1] += ln
        else:
            out.append(ln)
        i += 1
    return out


def split_lessons(raw):
    """按开场白锚点切分，返回 [(titles[], body_lines[])]"""
    anchors = [m.start() for m in OPEN.finditer(raw)]
    if len(anchors) != 27:
        print(f'⚠️ 开场白锚点 {len(anchors)} 个，期望 27', file=sys.stderr)
    lessons = []
    for i, a in enumerate(anchors):
        # 标题 = 锚点往前的连续非空行（去掉噪音行、去掉上一课的结尾）
        head_start = anchors[i - 1] if i else 0
        head = raw[head_start:a].split('\n')
        titles = []
        for ln in reversed(head):
            s = ln.strip()
            if not s:
                if titles:
                    break
                continue
            if NOISE.match(s):
                break
            if OPEN_FRAG.search(s):   # 开场白折行残片，跳过但不中断
                continue
            # 上一课的正文结尾（带句号的长句）不算标题
            if len(s) > 34 or s.endswith(('。', '！', '？')):
                break
            titles.insert(0, s)
            if len(titles) >= 4:
                break
        body_end = anchors[i + 1] if i + 1 < len(anchors) else len(raw)
        body = raw[a:body_end].split('\n')
        body = [l for l in body if not NOISE.match(l)]
        # 砍掉正文里属于下一课标题的尾巴
        tail_titles = 0
        for ln in reversed(body):
            s = ln.strip()
            if not s:
                continue
            if len(s) <= 34 and not s.endswith(('。', '！', '？')):
                tail_titles += 1
            else:
                break
        if tail_titles and i + 1 < len(anchors):
            cut = len(body)
            seen = 0
            for j in range(len(body) - 1, -1, -1):
                s = body[j].strip()
                if not s:
                    continue
                if len(s) <= 34 and not s.endswith(('。', '！', '？')):
                    cut = j
                    seen += 1
                    if seen >= tail_titles:
                        break
                else:
                    break
            body = body[:cut]
        lessons.append((titles, body))
    return lessons


def clean_body(body):
    """去开场白，归并硬折行，剥离结尾口播，返回 (正文段落[], 结尾预告)"""
    lines = unwrap(body)
    if lines and OPEN.search(lines[0]):
        lines[0] = OPEN.sub('', lines[0]).strip()
        # 剥完开场白常剩下孤零零的标点（第1课那句以「。」收尾）
        lines[0] = re.sub(r'^[。，,；;！!、\s"“”]+', '', lines[0])
        if not lines[0]:
            lines.pop(0)
    # PDF 在数字与中文间插空格：「2018 年」→「2018年」
    lines = [re.sub(r'(?<=\d)\s+(?=[一-鿿])', '', l) for l in lines]
    # ⚠️ 口播结尾常与正文最后一句同在一行（硬折行合并后）：
    #    「好，这就是寻龙和点穴的方法。本讲就讲到这里，下一讲……再见！」
    #    整行切掉会连正文一起丢（质检抽句时抓到的真 bug）。只从口播起点切。
    OUTRO_IN = re.compile(r'(?:好[！!，,]?\s*)?本讲就讲到这里|欢迎(?:收看|关注|关系)下一讲|下一讲[，,]\s*我们')
    outro = ''
    for i, ln in enumerate(lines):
        m = OUTRO_IN.search(ln)
        if m and i >= len(lines) - 4:
            head = ln[:m.start()].strip()
            outro = (ln[m.start():] + ' ' + ' '.join(lines[i + 1:])).strip()
            lines = lines[:i] + ([head] if head else [])
            break
    return lines, outro


def main():
    raw, toc, npages = load_pages()
    lessons = split_lessons(raw)
    outdir = os.path.dirname(os.path.abspath(__file__))
    meta, issues = [], []
    parts = ['# 风水第一课\n',
             '> 源：《风水第一课》1-27 合集书签版（讲稿脚本，共 %d 页）\n' % npages]
    for i, (titles, body) in enumerate(lessons, 1):
        # 去掉标题里混进的课号前缀
        titles = [re.sub(r'^\d{1,2}[、．.\s]\s*', '', t).strip() for t in titles]
        titles = [t for t in titles if t]
        main_t = titles[0] if titles else f'第{i}课'
        alt = titles[1:]
        bmk = re.sub(r'^第\d+课\s*', '', toc[i - 1]) if i - 1 < len(toc) else ''
        paras, outro = clean_body(body)
        nchar = sum(len(p) for p in paras)
        meta.append({'n': i, 'title': main_t, 'alt': alt, 'bookmark': bmk,
                     'chars': nchar, 'paras': len(paras), 'outro': outro})
        if bmk and bmk != main_t:
            issues.append(f'第{i:>2}课 标题不一致｜正文「{main_t}」｜书签「{bmk}」')
        if alt:
            issues.append(f'第{i:>2}课 原稿留有备选标题 {alt}')
        parts.append(f'\n## 第{i}课 {main_t}\n')
        if alt:
            parts.append(f'<!-- 备选标题：{" / ".join(alt)} -->\n')
        for p in paras:
            if p.startswith('@@VERSE@@'):
                v = p[len('@@VERSE@@'):]
                parts.append('\n'.join('> ' + x + '  ' for x in v.split('\n')) + '\n')
            else:
                parts.append(p + '\n')
        if outro:
            parts.append(f'\n<!-- 口播结尾：{outro} -->\n')
    md = '\n'.join(parts)
    open(os.path.join(outdir, '风水第一课.md'), 'w', encoding='utf8').write(md)
    json.dump(meta, open(os.path.join(outdir, 'fs01_meta.json'), 'w', encoding='utf8'),
              ensure_ascii=False, indent=1)

    print(f'✅ 27 课 → {sum(m["chars"] for m in meta)} 字（原始 {len(raw)}）')
    print(f'   最短 {min(m["chars"] for m in meta)} 字 / 最长 {max(m["chars"] for m in meta)} 字')
    print(f'\n--- 需你定夺的 {len(issues)} 处 ---')
    for s in issues:
        print(' ', s)


if __name__ == '__main__':
    main()
