#!/usr/bin/env python3
"""Fidelidade a referencias visuais (PIL + numpy).

  python3 referencias.py analisar <pasta_ou_imagens...> --saida estudio/clientes/<slug>/referencias/ficha
        Le as referencias do cliente e gera ficha.json (paleta, luz, contraste, saturacao, temperatura, respiro,
        densidade, onde fica o peso visual) + ficha.png (moodboard com as cores medidas).
  python3 referencias.py comparar <ficha.json> <peca.png> [<peca2.png> ...] [--saida pasta]
        Mede a peca criada contra a ficha: nota de 0 a 100, lista de desvios com o que corrigir
        e uma prancha lado a lado (referencias x peca) para conferencia visual.
"""
import json, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


# ---------------------------------------------------------------- cor
def _srgb_lin(c):
    c = c / 255.0
    return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)


def lab(rgb):
    rgb = np.asarray(rgb, dtype=float).reshape(-1, 3)
    l = _srgb_lin(rgb)
    M = np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]])
    xyz = l @ M.T / np.array([.95047, 1, 1.08883])
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[:, 1] - 16, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], 1)


def de(a, b):
    return float(np.linalg.norm(lab(a)[0] - lab(b)[0]))


def hexc(c):
    return "#%02X%02X%02X" % tuple(int(x) for x in c)


def paleta(img, k=6):
    q = img.convert("RGB").resize((200, int(200 * img.height / img.width) or 1)).quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:k * 3]
    cont = sorted(q.getcolors(), reverse=True)
    tot = sum(n for n, _ in cont)
    return [dict(hex=hexc(pal[i * 3:i * 3 + 3]), rgb=pal[i * 3:i * 3 + 3], peso=round(n / tot, 3)) for n, i in cont]


# ---------------------------------------------------------------- medidas
def medir(path):
    img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    a = np.asarray(img.resize((400, int(400 * img.height / img.width) or 1)), dtype=float)
    L = lab(a.reshape(-1, 3))[:, 0]
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    LAB = lab(a.reshape(-1, 3))
    g = Image.fromarray(a.astype(np.uint8)).convert("L")
    bordas = np.asarray(g.filter(ImageFilter.FIND_EDGES), dtype=float)
    det = bordas > 28
    # respiro: blocos 16x16 quase sem detalhe
    h, w = det.shape
    bh, bw = h // 16, w // 16
    blocos = det[:bh * 16, :bw * 16].reshape(bh, 16, bw, 16).mean((1, 3))
    respiro = float((blocos < .02).mean())
    ys, xs = np.nonzero(det)
    cx, cy = (float(xs.mean() / w), float(ys.mean() / h)) if len(xs) else (.5, .5)
    return dict(
        arquivo=Path(path).name, proporcao=round(img.width / img.height, 3),
        luminosidade=round(float(L.mean()), 1), contraste=round(float(L.std()), 1),
        saturacao=round(float(sat.mean()), 3), temperatura=round(float(LAB[:, 2].mean()), 1),
        respiro=round(respiro, 3), densidade_detalhe=round(float(det.mean()), 3),
        peso_visual=dict(x=round(cx, 2), y=round(cy, 2)), paleta=paleta(img))


def agregar(medidas):
    num = ["luminosidade", "contraste", "saturacao", "temperatura", "respiro", "densidade_detalhe"]
    ag = {k: dict(media=round(float(np.mean([m[k] for m in medidas])), 3),
                  min=round(float(np.min([m[k] for m in medidas])), 3), max=round(float(np.max([m[k] for m in medidas])), 3))
          for k in num}
    # paleta consolidada: agrupa cores proximas (dE < 12) somando o peso
    cores = []
    for m in medidas:
        for c in m["paleta"]:
            for g in cores:
                if de(g["rgb"], c["rgb"]) < 12:
                    g["peso"] += c["peso"]
                    break
            else:
                cores.append(dict(rgb=list(c["rgb"]), peso=c["peso"]))
    tot = sum(c["peso"] for c in cores)
    cores = sorted(cores, key=lambda c: -c["peso"])[:10]
    for c in cores:
        c["peso"] = round(c["peso"] / tot, 3)
        c["hex"] = hexc(c["rgb"])
    return ag, cores


def leitura(ag, cores):
    r = []
    L = ag["luminosidade"]["media"]
    r.append("fundos e tons claros, luz alta" if L > 70 else "atmosfera escura, luz baixa" if L < 38 else "luminosidade media")
    s = ag["saturacao"]["media"]
    r.append("cores dessaturadas e sobrias" if s < .18 else "cores vivas e saturadas" if s > .42 else "saturacao moderada")
    t = ag["temperatura"]["media"]
    r.append("paleta quente (amarelos, beges, terrosos)" if t > 8 else "paleta fria (azuis, cinzas)" if t < -4 else "temperatura neutra")
    c = ag["contraste"]["media"]
    r.append("alto contraste" if c > 30 else "contraste suave" if c < 16 else "contraste moderado")
    rs = ag["respiro"]["media"]
    r.append(f"muito respiro ({rs:.0%} da area livre): composicao minimalista" if rs > .45
             else f"pouco respiro ({rs:.0%}): composicao cheia" if rs < .2 else f"respiro moderado ({rs:.0%})")
    r.append("cores dominantes: " + ", ".join(f"{c['hex']} ({c['peso']:.0%})" for c in cores[:5]))
    return r


def prancha(imagens, cores, out, titulo="REFERENCIAS", peca=None):
    W = 1600
    th = 300
    thumbs = []
    for p in imagens[:12]:
        im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
        im.thumbnail((th * 2, th))
        thumbs.append(im)
    cols = 4 if peca is None else 3
    area = W if peca is None else int(W * .62)
    cw = area // cols
    rows = max(1, (len(thumbs) + cols - 1) // cols)
    H = 90 + rows * (th + 16) + 160
    pc = None
    if peca is not None:
        pc = ImageOps.exif_transpose(Image.open(peca)).convert("RGB")
        pc.thumbnail((W - area - 60, H - 140))
        H = max(H, pc.height + 140)
    can = Image.new("RGB", (W, H), "#F4F1EA")
    d = ImageDraw.Draw(can)
    try:
        f = ImageFont.truetype("DejaVuSans-Bold.ttf", 26)
        fs = ImageFont.truetype("DejaVuSans.ttf", 18)
    except Exception:
        f = fs = ImageFont.load_default()
    d.text((30, 30), titulo, fill="#111", font=f)
    for i, im in enumerate(thumbs):
        x = 30 + (i % cols) * cw
        y = 90 + (i // cols) * (th + 16)
        im2 = im.copy()
        im2.thumbnail((cw - 16, th))
        can.paste(im2, (x, y))
    y0 = H - 140
    x = 30
    for c in cores[:10]:
        wdt = max(60, int((area - 60) * c["peso"]))
        d.rectangle([x, y0, x + wdt, y0 + 70], fill=c["hex"])
        if wdt >= 100:
            d.text((x + 4, y0 + 78), c["hex"], fill="#111", font=fs)
        x += wdt + 6
        if x > area - 40:
            break
    if pc is not None:
        d.text((area + 30, 30), "PECA", fill="#111", font=f)
        can.paste(pc, (area + 30, 90))
    can.save(out, quality=92)


def analisar(entradas, saida):
    imgs = []
    for e in entradas:
        p = Path(e)
        imgs += sorted(x for x in p.rglob("*") if x.suffix.lower() in EXT) if p.is_dir() else [p]
    imgs = [i for i in imgs if "ficha" not in i.stem and "comparacao" not in i.stem]
    if not imgs:
        raise SystemExit("nenhuma imagem de referencia encontrada")
    med = [medir(i) for i in imgs]
    ag, cores = agregar(med)
    ficha = dict(referencias=[str(i) for i in imgs], agregado=ag, paleta_medida=cores, leitura=leitura(ag, cores), por_imagem=med)
    saida = Path(saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    Path(str(saida) + ".json").write_text(json.dumps(ficha, ensure_ascii=False, indent=1))
    prancha(imgs, cores, str(saida) + ".png")
    print(json.dumps(dict(leitura=ficha["leitura"], agregado=ag), ensure_ascii=False, indent=1))
    print(f"ficha: {saida}.json  moodboard: {saida}.png")


def comparar(ficha_path, pecas, saida=None):
    ficha = json.loads(Path(ficha_path).read_text())
    ag, ref_cores = ficha["agregado"], ficha["paleta_medida"]
    res = []
    for p in pecas:
        m = medir(p)
        desvios, pen = [], 0.0
        # cores: cada cor relevante da peca precisa existir na paleta das referencias
        fora = []
        for c in m["paleta"]:
            if c["peso"] < .04:
                continue
            dist = min(de(c["rgb"], r["rgb"]) for r in ref_cores)
            if dist > 18:
                fora.append((c["hex"], c["peso"], round(dist, 1)))
                pen += min(25, c["peso"] * dist * .9)
        if fora:
            desvios.append("cores fora da paleta das referencias: " + ", ".join(f"{h} ({p:.0%} da peca, dE {d})" for h, p, d in fora))

        def faixa(k, nome, tol, unid=""):
            nonlocal pen
            lo, hi = ag[k]["min"] - tol, ag[k]["max"] + tol
            if not lo <= m[k] <= hi:
                alvo = ag[k]["media"]
                pen += min(15, abs(m[k] - alvo) / max(tol, 1e-6) * 4)
                desvios.append(f"{nome}: peca {m[k]}{unid}, referencias {ag[k]['min']} a {ag[k]['max']}{unid} "
                               f"({'baixar' if m[k] > alvo else 'subir'} para perto de {alvo})")
        faixa("luminosidade", "luminosidade", 8)
        faixa("saturacao", "saturacao", .06)
        faixa("temperatura", "temperatura (b*)", 5)
        faixa("contraste", "contraste", 6)
        faixa("respiro", "respiro (area livre)", .1)
        faixa("densidade_detalhe", "densidade de elementos", .04)
        nota = max(0, round(100 - pen))
        r = dict(peca=str(p), nota=nota, aprovado=nota >= 80 and not fora, desvios=desvios, medidas={k: m[k] for k in
                 ("luminosidade", "contraste", "saturacao", "temperatura", "respiro", "densidade_detalhe")},
                 paleta_peca=[c["hex"] for c in m["paleta"]])
        if saida:
            Path(saida).mkdir(parents=True, exist_ok=True)
            out = Path(saida) / f"comparacao_{Path(p).stem}.jpg"
            prancha([Path(x) for x in ficha["referencias"]], ref_cores, out, f"REFERENCIAS x PECA  nota {nota}", peca=p)
            r["prancha"] = str(out)
        res.append(r)
    print(json.dumps(res, ensure_ascii=False, indent=1))
    return res


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"):
        print(__doc__)
        return
    saida = None
    if "--saida" in a:
        i = a.index("--saida")
        saida = a[i + 1]
        a = a[:i] + a[i + 2:]
    if a[0] == "analisar":
        analisar(a[1:], saida or "ficha")
    elif a[0] == "comparar":
        comparar(a[1], a[2:], saida)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
