# -*- coding: utf-8 -*-
"""按 _map_lecimg.py 从教材 PDF 提图 → assets/lecimg/

产物文件名 {书}-p{页}-x{xref}.jpg，与映射表一一对应；build_lectures.py 据此写进 lectures.js。

⚠️ 这些图**不进 sw 预缓存**（同 data/index.js 的理由：预缓存会让每次装 PWA 都先拖一堆图）。
   sw 是网络优先＋缓存回退，看过的自然有离线副本。

依赖 PyMuPDF + Pillow（只在构建时用，站点本身零依赖）。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _map_lecimg import LEC_IMG, PDF_FILES, PDF_DIR, BOOK_SLUG  # noqa: E402

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'lecimg')
MAX_W = 900          # 移动端够看，再大只是浪费流量
QUALITY = 80


def main():
    try:
        import fitz
        from PIL import Image
    except ImportError as e:
        print(f'✗ 需要 PyMuPDF 与 Pillow：{e}', file=sys.stderr)
        sys.exit(1)
    import io

    os.makedirs(OUT_DIR, exist_ok=True)
    docs, problems, made, total_kb = {}, [], 0, 0
    wanted = set()

    for no, imgs in LEC_IMG.items():
        for entry in imgs:
            # 映射表允许 4 元组或带小节锚点的 5 元组，这里只关心前三项
            book, page, xref = entry[0], entry[1], entry[2]
            name = f'{BOOK_SLUG.get(book, book)}-p{page}-x{xref}.jpg'
            wanted.add(name)
            if book not in PDF_FILES:
                problems.append(f'{no}：未知书名「{book}」')
                continue
            if book not in docs:
                path = os.path.join(PDF_DIR, PDF_FILES[book])
                if not os.path.exists(path):
                    problems.append(f'找不到 PDF：{path}')
                    continue
                docs[book] = fitz.open(path)
            d = docs[book]
            if not (1 <= page <= len(d)):
                problems.append(f'{no}：{book} p{page} 超出页数 {len(d)}')
                continue
            # 该页必须真有这个 xref，否则映射表写错了
            if xref not in [im[0] for im in d[page - 1].get_images(full=True)]:
                problems.append(f'{no}：{book} p{page} 上没有 xref={xref} 这张图')
                continue
            out = os.path.join(OUT_DIR, name)
            if not os.path.exists(out):
                px = fitz.Pixmap(d, xref)
                if px.n > 4:
                    px = fitz.Pixmap(fitz.csRGB, px)
                im = Image.open(io.BytesIO(px.tobytes('png'))).convert('RGB')
                im.thumbnail((MAX_W, MAX_W))
                im.save(out, 'JPEG', quality=QUALITY, optimize=True)
                made += 1
            total_kb += os.path.getsize(out) / 1024

    if problems:
        print('✗ 自检未通过：', file=sys.stderr)
        for p in problems:
            print('   ' + p, file=sys.stderr)
        sys.exit(1)

    # 清理：映射表里已删掉的图不该留在产物目录
    stale = [f for f in os.listdir(OUT_DIR) if f.endswith('.jpg') and f not in wanted]
    for f in stale:
        os.remove(os.path.join(OUT_DIR, f))

    n = len(wanted)
    print(f'✅ {len(LEC_IMG)} 条 · {n} 张图 → assets/lecimg/'
          f'（新提 {made} 张，清理 {len(stale)} 张，合计 {total_kb / 1024:.1f} MB，'
          f'平均 {total_kb / n:.0f} KB/张）')
    for no, imgs in LEC_IMG.items():
        print(f'   {no}：{len(imgs)} 张')


if __name__ == '__main__':
    main()
