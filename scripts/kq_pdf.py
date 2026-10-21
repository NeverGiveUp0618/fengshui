#!/usr/bin/env python3
"""知识点练习册：lianxi.html 的全部在用选择题排成一本，可打印离线做（配色同勘地本）。
题目实时读 data/kq.js 与 data/kq_sec.js（与网站同源）；按 A–M 十三章排，章内按精讲小节先后，小节归属同网站「看原文」。
每 10 题后紧跟这 10 题的答案与讲解；选项顺序按题号固定打乱（每次生成一样），答案写 A–D。
用法：python3 scripts/kq_pdf.py      输出：~/Documents/风水勘地本/6-知识点练习册.pdf
"""
import os, re, json, html, random, subprocess, tempfile
import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.expanduser("~/Documents/风水勘地本/6-知识点练习册.pdf")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
GROUP = 10
CN = "零一二三四五六七八九十"


def load():
    js = ("const a=require('./data/kq.js'),b=require('./data/kq_sec.js');"
          "console.log(JSON.stringify({cats:a.KQ_CATS,d:a.KQ_DATA,off:[...a.KQ_OFF],sec:b.KQ_SEC,t:b.KQ_SECT}))")
    return json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, capture_output=True, text=True, check=True).stdout)


CSS = """
@page{size:A4;margin:14mm 14mm 14mm;@bottom-center{content:counter(page);font:8.5pt "PingFang SC",sans-serif;color:#7f919e}}
@page cover{margin:0;@bottom-center{content:none}}
:root{--ink:#1f2d38;--ink2:#4a5c69;--mute:#7f919e;--line:#bcd2e2;--line2:#dbe8f1;--dai:#2f6690;--sky:#7fb3d5;--bg:#f2f7fb;--seal:#a9442f;--jin:#9a7a3a}
*{box-sizing:border-box}body{margin:0;color:var(--ink);font:10.2pt/1.6 "Songti SC","STSong",serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.cover{page:cover;height:297mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:#fff;
  background:linear-gradient(160deg,#2f6690 0%,#4f90c0 60%,#9cc7e4 100%);break-after:page}
.cover .seal{background:var(--seal);color:#fff;width:58px;height:58px;display:grid;place-items:center;font:700 20px/1 serif;border-radius:5px;margin-bottom:22px}
.cover h1{font-size:32pt;letter-spacing:.3em;margin:0 0 0 .3em;font-weight:600}
.cover h2{font-size:14pt;letter-spacing:.2em;font-weight:500;margin:14px 0 26px}
.cover p{font:10pt/1.9 "PingFang SC",sans-serif;opacity:.92;margin:0}
.front{break-after:page}
.ft{font-size:16pt;letter-spacing:.3em;color:var(--dai);text-align:center;margin:8mm 0 5mm}
.front p{font-size:10.3pt;color:var(--ink2);margin:0 0 2.5mm}
.toc{list-style:none;padding:0;margin:0 12mm}.toc li{display:flex;gap:4mm;padding:1.6mm 0;border-bottom:.5pt dotted var(--line)}
.toc .c{color:var(--dai);width:10mm}.toc .t{flex:1}.toc .n{color:var(--mute)}
.chap{break-before:page}
.chead{display:flex;align-items:baseline;gap:4mm;border-bottom:1.4pt solid var(--dai);padding-bottom:1.5mm;margin-bottom:2mm}
.chead .cn{background:var(--dai);color:#fff;border-radius:1mm;padding:.3mm 2.6mm;font-size:12pt}
.chead .ct{font-size:17pt;color:var(--dai);letter-spacing:.15em}.chead .cc{margin-left:auto;color:var(--mute);font:9pt "PingFang SC",sans-serif}
.sec{color:var(--dai);font-size:10.5pt;margin:4mm 0 1mm;break-after:avoid}.sec i{font-style:normal;color:var(--sky);margin-right:2mm}
.q{break-inside:avoid;padding:1.8mm 0 2.2mm;border-bottom:.5pt dashed var(--line2)}
.q .h{display:flex;gap:2mm}.q .no{flex:none;min-width:10mm;color:var(--dai);font:9pt/1.9 "PingFang SC",sans-serif}
.op{display:grid;grid-template-columns:1fr 1fr;gap:.5mm 5mm;margin:1mm 0 0 12mm;color:var(--ink2);font-size:9.6pt}
.op span i{font-style:normal;color:var(--dai);margin-right:1.2mm}
.ans{break-inside:avoid;background:var(--bg);border-left:2.4pt solid var(--sky);border-radius:1.2mm;padding:2mm 3.5mm;margin:3mm 0 4mm;font:8.8pt/1.55 "PingFang SC",sans-serif}
.ans h5{margin:0 0 1mm;font:10pt "Songti SC",serif;color:var(--seal)}
.ar{display:flex;gap:2mm;padding:.4mm 0}.ar .an{flex:none;width:10mm;color:var(--dai)}.ar .al{flex:none;width:4mm;color:var(--seal);font-weight:bold}
.ar .ax{flex:1;color:var(--ink2)}.ar .ax b{color:var(--ink);font-weight:600}.ar .src{color:var(--jin);white-space:nowrap;margin-left:1.5mm}
"""


def secnum(s):
    return int(re.sub(r"\D", "", s) or 0)


def main():
    D = load()
    data, off, sec, titles = D["d"], set(D["off"]), D["sec"], D["t"]
    esc = html.escape
    body, toc, total = [], [], 0
    for k, name in D["cats"]:
        idx = [i for i, q in enumerate(data) if q[0] == k and i not in off]
        idx.sort(key=lambda i: (secnum(sec[i][0]), i))
        total += len(idx)
        toc.append('<li><span class="c">%s</span><span class="t">%s</span><span class="n">%d 题</span></li>' % (k, esc(name), len(idx)))
        parts = ['<section class="chap"><div class="chead"><span class="cn">%s</span><span class="ct">%s</span><span class="cc">%d 题</span></div>' % (k, esc(name), len(idx))]
        last = None
        for g in range(0, len(idx), GROUP):
            grp, ans = idx[g:g + GROUP], []
            for j, i in enumerate(grp):
                cat, qt, a, ws, exp, src = data[i]
                s = sec[i][0]
                if s != last:
                    parts.append('<div class="sec"><i>%s</i>%s</div>' % (s, esc(titles.get(s, ""))))
                    last = s
                opts = [a] + ws
                random.Random(i).shuffle(opts)
                no = "%s-%d" % (k, g + j + 1)  # 带横线，别和精讲节号 A1 撞
                parts.append('<div class="q"><div class="h"><span class="no">%s</span><span>%s</span></div><div class="op">%s</div></div>'
                             % (no, esc(qt), "".join('<span><i>%s</i>%s</span>' % ("ABCD"[x], esc(o)) for x, o in enumerate(opts))))
                ans.append('<div class="ar"><span class="an">%s</span><span class="al">%s</span><span class="ax"><b>%s</b>　%s<span class="src">%s</span></span></div>'
                           % (no, "ABCD"[opts.index(a)], esc(a), esc(exp), esc(src)))
            parts.append('<div class="ans"><h5>答案 · %s-%d～%s-%d</h5>%s</div>' % (k, g + 1, k, g + len(grp), "".join(ans)))
        parts.append("</section>")
        body.append("".join(parts))
    assert total == len(data) - len(off), (total, len(data), len(off))
    use = ("<p>1. 这本是网站「观山 · 知识点练习」的全部选择题，<b>%d 题</b>，与网站同源。按体系精讲 A–M 十三章排，章内按小节先后，小节标题就是精讲的节号。</p>"
           "<p>2. 每 <b>10 题</b>后紧跟这 10 题的答案和讲解。先遮住答案框做完，再对。</p>"
           "<p>3. 讲解末尾是教材页码，答错就回精讲那一节或原书那一页。</p>"
           "<p>4. 网站上点精讲某节末尾的「这节练一练」，可以单练这一节的题，答错会进错题本。</p>") % total
    cover = ('<div class="cover"><div class="seal">练</div><h1>知识点练习册</h1><h2>观山 · 体系精讲 A–M</h2>'
             '<p>%d 题　每十题附答案与教材页码</p><p>二〇二六年十月</p></div>') % total
    doc = ('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>知识点练习册</title><style>%s</style></head><body>%s'
           '<div class="front"><div class="ft">凡　例</div>%s<div class="ft" style="margin-top:12mm">目　录</div><ol class="toc">%s</ol></div>%s</body></html>'
           ) % (CSS, cover, use, "".join(toc), "".join(body))
    tmpd = tempfile.mkdtemp()
    h, raw = os.path.join(tmpd, "kq.html"), os.path.join(tmpd, "raw.pdf")
    open(h, "w", encoding="utf-8").write(doc)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--print-to-pdf=" + raw, "file://" + h],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    d = fitz.open(raw)
    n = d.page_count
    d.set_metadata({"title": "知识点练习册", "subject": "观山 · 体系精讲配套", "author": "", "creator": "fengshui"})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    d.save(OUT, garbage=3, deflate=True)
    d.close()
    print("✓", os.path.basename(OUT), total, "题", n, "页")


if __name__ == "__main__":
    main()
