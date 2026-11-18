#!/usr/bin/env python3
"""Motor de edicao cinematografica do Estudio Criativo (ffmpeg + numpy).

  python3 cinema.py --setup [slug]                 baixa as fontes do perfil (Google Fonts, TTF)
  python3 cinema.py projeto.json                   renderiza o video + contato.jpg + relatorio.json
  python3 cinema.py --acabamento in.mp4 out.mp4 --cliente slug [--look x]
                                                   aplica look, textura de pelicula e loudness num video pronto
  python3 cinema.py --batidas musica.mp3           lista as batidas fortes (para cortar no ritmo)
  python3 cinema.py --quadros video.mp4 t0 t1 n saida.jpg   tira de quadros para conferir uma transicao
  python3 cinema.py --looks                        lista looks e transicoes

Tudo que e de marca (paleta, fontes, look, transicoes preferidas) vem de estudio/clientes/<slug>/perfil.json.
"""
import json, math, os, re, shutil, subprocess, sys, urllib.request
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[3] if (AQUI.parents[3] / "estudio").exists() else Path.cwd()
CLIENTES = RAIZ / "estudio" / "clientes"
HOME = Path(os.environ.get("CINEMA_HOME", "/tmp/cinema_home"))
FONTES = HOME / "fontes"
FPS = 30
FORMATOS = {"9:16": (1080, 1920), "4:5": (1080, 1350), "1:1": (1080, 1080), "16:9": (1920, 1080), "2.39:1": (1920, 804)}
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", "-r", str(FPS), "-g", "15",
       "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2"]
PAL_NEUTRA = {"bg": "#F2F0EC", "fg": "#1A1A1A", "acc": "#8A8A8A", "dark": "#111111", "claro": "#FFFFFF", "destaque": "#FFFFFF", "luz": "#FF9A4D"}

TRANSICOES = {
    "corte": "corte seco (use no ritmo, em match cut ou na batida)",
    "fade": "dissolve suave",
    "respiro": "mergulho lento no preto, para fechamento ou virada emocional",
    "luz": "vazamento de luz quente (light leak) com bloom, cor = paleta.luz",
    "queima": "queima de pelicula: centro estoura em branco e laranja e revela a proxima cena",
    "tinta": "revelacao organica em mancha (ink bleed) por mascara de ruido",
    "zoom": "zoom through: entra na cena com desfoque de movimento e sai na proxima",
    "chicote": "whip pan para a esquerda com desfoque direcional",
    "chicote_d": "whip pan para a direita",
    "giro": "rotacao com zoom e motion blur",
    "prisma": "aberracao cromatica crescente que dissolve na proxima cena",
    "glitch": "falha digital: deslocamento RGB, ruido e fatias",
    "cor": "mergulho na cor da marca (paleta.acc) e volta",
    "flash": "estouro de exposicao em branco",
}
SFX_DE = {"luz": "brilho", "queima": "brilho", "zoom": "whoosh", "chicote": "whoosh", "chicote_d": "whoosh",
          "giro": "whoosh", "glitch": "glitch", "cor": "impacto", "flash": "impacto", "tinta": "sopro", "prisma": "sopro"}


# ------------------------------------------------------------------ util
def sh(cmd, check=True, cwd=None):
    r = subprocess.run(cmd, shell=isinstance(cmd, str), capture_output=True, text=True, cwd=cwd)
    if check and r.returncode:
        raise RuntimeError(f"comando falhou: {' '.join(map(str, cmd)) if isinstance(cmd, list) else cmd}\n{r.stderr[-2500:]}")
    return r


def ff(*a):
    return sh(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, a)])


def probe(p):
    j = json.loads(sh(["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(p)]).stdout)
    v = next((s for s in j["streams"] if s["codec_type"] == "video"), {})
    return dict(dur=float(j["format"].get("duration", 0) or 0), audio=any(s["codec_type"] == "audio" for s in j["streams"]),
                w=v.get("width"), h=v.get("height"))


def dur_de(p):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).stdout.strip())


def rgb(hexc):
    h = hexc.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def perfil(slug):
    if not slug:
        return {}
    p = CLIENTES / slug / "perfil.json"
    if not p.exists():
        raise SystemExit(f"perfil nao encontrado: {p}")
    return json.loads(p.read_text())


# ------------------------------------------------------------------ fontes
def baixar_fonte(familia):
    """Baixa todos os pesos (normal e italico) da familia no Google Fonts como TTF."""
    FONTES.mkdir(parents=True, exist_ok=True)
    marca = FONTES / (re.sub(r"\W", "", familia) + ".ok")
    if marca.exists():
        return True
    fam = familia.replace(" ", "+")
    url = f"https://fonts.googleapis.com/css2?family={fam}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600"
    try:
        css = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "curl/8"}), timeout=30).read().decode()
    except Exception:
        try:
            css = urllib.request.urlopen(urllib.request.Request(f"https://fonts.googleapis.com/css2?family={fam}",
                                                                headers={"User-Agent": "curl/8"}), timeout=30).read().decode()
        except Exception as e:
            print(f"aviso: fonte '{familia}' nao baixada ({e}); use um arquivo .ttf/.otf em estudio/clientes/<slug>/fontes/")
            return False
    for estilo, peso, link in re.findall(r"font-style: (\w+);\s*font-weight: (\d+);\s*src: url\((.+?)\)", css):
        destino = FONTES / f"{re.sub(r'\W', '', familia)}-{peso}{'i' if estilo == 'italic' else ''}.ttf"
        if not destino.exists():
            urllib.request.urlretrieve(link, destino)
    marca.write_text("ok")
    return True


def setup(slug=None):
    HOME.mkdir(parents=True, exist_ok=True)
    pf = perfil(slug) if slug else {}
    fams = set(["Cormorant Garamond", "Montserrat", "Inter"])
    fams.update(v for v in (pf.get("visual", {}).get("fontes", {}) or {}).values() if isinstance(v, str) and v)
    for f in sorted(fams):
        ok = baixar_fonte(f)
        print(f"fonte {f}: {'ok' if ok else 'falhou'}")
    if slug:
        loc = CLIENTES / slug / "fontes"
        if loc.exists():
            for f in list(loc.glob("*.ttf")) + list(loc.glob("*.otf")):
                shutil.copy(f, FONTES / f.name)
                print(f"fonte local: {f.name}")


# ------------------------------------------------------------------ looks (LUT 3D gerada)
def _lum(c):
    return c[..., 0] * .2126 + c[..., 1] * .7152 + c[..., 2] * .0722


def _sat(c, s):
    l = _lum(c)[..., None]
    return l + (c - l) * s


def _curva(x, preto=0.0, branco=1.0, contraste=1.0, ombro=0.0):
    x = preto + (branco - preto) * x
    x = 0.5 + (x - 0.5) * contraste
    if ombro:
        x = np.where(x > .75, .75 + (1 - np.exp(-(x - .75) / ombro)) * ombro * .95, x)
    return np.clip(x, 0, 1)


def _split(c, sombra, luz, forca_s=.12, forca_l=.08):
    l = _lum(c)[..., None]
    ws = np.clip(1 - l * 2, 0, 1) ** 1.5
    wl = np.clip(l * 2 - 1, 0, 1) ** 1.5
    s = np.array(sombra) / 255.0
    h = np.array(luz) / 255.0
    return c + ws * (s - .5) * forca_s * 2 + wl * (h - .5) * forca_l * 2


def look_fn(nome, pal):
    def f(c):
        if nome == "natural":
            return _curva(_sat(c, 1.04), contraste=1.04)
        if nome == "filme_quente":  # pelicula: pretos levantados, sombras verde-azuladas, altas douradas
            c = _split(c, (40, 90, 95), (255, 200, 140), .16, .12)
            return _curva(_sat(c, .9), preto=.04, branco=.97, contraste=1.08, ombro=.18)
        if nome == "teal_laranja":
            c = _split(c, (20, 110, 130), (255, 170, 100), .22, .14)
            return _curva(_sat(c, 1.08), preto=.02, contraste=1.12, ombro=.2)
        if nome == "kodak_dourado":
            c = _split(c, (90, 70, 50), (255, 210, 120), .1, .16)
            return _curva(_sat(c, 1.1), preto=.03, branco=.98, contraste=1.06, ombro=.15)
        if nome == "pastel_editorial":  # suave, claro, baixa saturacao, ideal moda e beleza
            c = _split(c, (150, 130, 140), (255, 240, 230), .1, .06)
            return _curva(_sat(c, .78), preto=.08, branco=.99, contraste=.92, ombro=.25)
        if nome == "clinico_limpo":  # branco limpo e frio leve, pele preservada (saude, pilates)
            c = _split(c, (90, 110, 130), (245, 250, 255), .08, .05)
            return _curva(_sat(c, .95), preto=.02, branco=1.0, contraste=1.05, ombro=.3)
        if nome == "noir":
            l = _lum(c)[..., None]
            return _curva(np.repeat(l, 3, axis=-1), preto=.0, contraste=1.25, ombro=.12)
        if nome == "marca":  # split toning com a paleta do cliente: sombras no tom escuro, altas no destaque
            c = _split(c, rgb(pal["dark"]), rgb(pal.get("destaque") or pal["claro"]), .2, .12)
            return _curva(_sat(c, .92), preto=.03, branco=.98, contraste=1.06, ombro=.2)
        return c
    return f


LOOKS = ["natural", "filme_quente", "teal_laranja", "kodak_dourado", "pastel_editorial", "clinico_limpo", "noir", "marca"]


def gerar_lut(nome, pal, pasta, n=33):
    arq = Path(pasta) / f"look_{nome}.cube"
    g = np.linspace(0, 1, n)
    b, gg, r = np.meshgrid(g, g, g, indexing="ij")
    c = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = np.clip(look_fn(nome, pal)(c), 0, 1)
    with open(arq, "w") as fh:
        fh.write(f"LUT_3D_SIZE {n}\n")
        np.savetxt(fh, out, fmt="%.5f")
    return arq


# ------------------------------------------------------------------ batidas
def _batidas_np(x, min_gap):
    sr, hop, win = 22050, 512, 2048
    if len(x) < win:
        return []
    n = 1 + (len(x) - win) // hop
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    S = np.abs(np.fft.rfft(x[idx] * np.hanning(win), axis=1))
    S = np.log1p(S[:, :300])  # ate ~3 kHz: bumbo, caixa, baixo
    flux = np.maximum(np.diff(S, axis=0), 0).sum(1)
    flux = np.convolve(flux, np.ones(3) / 3, "same")
    loc = np.convolve(flux, np.ones(43) / 43, "same")
    picos, ult = [], -1e9
    for i in range(1, len(flux) - 1):
        if flux[i] > flux[i - 1] and flux[i] >= flux[i + 1] and flux[i] > loc[i] * 1.35:
            t = (i + 1) * hop / sr + win / 2 / sr
            if t - ult >= min_gap:
                picos.append((round(t, 3), float(flux[i])))
                ult = t
            elif picos and flux[i] > picos[-1][1]:
                picos[-1] = (round(t, 3), float(flux[i]))
                ult = t
    if not picos:
        return []
    m = max(p[1] for p in picos)
    return [(t, round(f / m, 3)) for t, f in picos]


# ------------------------------------------------------------------ segmentos
def mov_expr(mov, d, W, H, intens=1.0):
    """Retorna filtro de movimento de camera sobre [in] ja no tamanho WxH."""
    d = max(d, .1)
    p = f"(t/{d:.3f})"
    e = f"(3*{p}*{p}-2*{p}*{p}*{p})"  # ease in-out
    k = intens
    if mov == "push_in":
        Z = f"(1.0+{.12 * k:.3f}*{e})"
    elif mov == "push_out":
        Z = f"({1 + .12 * k:.3f}-{.12 * k:.3f}*{e})"
    elif mov in ("pan_e", "pan_d", "tilt", "parallax"):
        Z = f"{1 + .1 * k:.3f}"
    elif mov in ("tremor", "respira"):
        Z = "1.06"
    else:
        Z = "1.0"
    sc = f"scale=w='trunc({W}*{Z}/2)*2':h='trunc({H}*{Z}/2)*2':eval=frame"
    if mov == "pan_e":
        x, y = f"(iw-{W})*(1-{e})", f"(ih-{H})/2"
    elif mov == "pan_d":
        x, y = f"(iw-{W})*{e}", f"(ih-{H})/2"
    elif mov == "tilt":
        x, y = f"(iw-{W})/2", f"(ih-{H})*(1-{e})"
    elif mov == "parallax":
        x, y = f"(iw-{W})*(0.15+0.7*{e})", f"(ih-{H})*(0.5-0.2*{e})"
    elif mov == "tremor":
        x = f"(iw-{W})/2+{14 * k:.1f}*sin(t*2.1)+{7 * k:.1f}*sin(t*5.7+1)"
        y = f"(ih-{H})/2+{12 * k:.1f}*sin(t*1.7+2)+{6 * k:.1f}*sin(t*6.3)"
    elif mov == "respira":
        x = f"(iw-{W})/2+4*sin(t*0.9)"
        y = f"(ih-{H})/2+5*sin(t*0.7+1)"
    else:
        x, y = f"(iw-{W})/2", f"(ih-{H})/2"
    return f"{sc},crop={W}:{H}:x='{x}':y='{y}'"


def enquadrar(W, H, modo):
    if modo == "caber":
        return (f"split[s1][s2];[s1]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},gblur=sigma=40,"
                f"eq=brightness=-0.12[bgb];[s2]scale={W}:{H}:force_original_aspect_ratio=decrease[fgb];"
                f"[bgb][fgb]overlay=(W-w)/2:(H-h)/2")
    return f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}"


def render_cena(c, i, cfg, tmp):
    W, H, pal = cfg["W"], cfg["H"], cfg["pal"]
    out = tmp / f"seg{i:03d}.mkv"
    base = cfg["base"]
    mov = c.get("movimento", cfg["mov_padrao"])
    intens = {"sutil": .6, "normal": 1.0, "forte": 1.6}.get(c.get("intensidade", "normal"), 1.0)
    lut = c.get("look", cfg["look"])
    lutf = cfg["luts"].setdefault(lut, gerar_lut(lut, pal, tmp))
    grade = f"lut3d=file='{lutf}'"

    if "cartela" in c:
        d = float(c.get("dur", 2.2))
        fundo = c.get("fundo", pal["bg"])
        ass = tmp / f"cart{i:03d}.ass"
        escrever_ass(ass, [dict(texto=c["cartela"], sub=c.get("sub"), em=.15, dur=d - .2, estilo=c.get("animacao", "tracking"),
                                pos="centro", cor=c.get("cor_texto", pal["fg"]), tamanho="cartela")], cfg)
        ff("-f", "lavfi", "-i", f"color=c={fundo}:s={W}x{H}:r={FPS}", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
           "-filter_complex", f"[0:v]noise=alls=4:allf=t,ass='{ass}':fontsdir='{FONTES}',format=yuv420p[v]",
           "-map", "[v]", "-map", "1:a", "-t", f"{d:.3f}", *ENC, out)
        return out, d

    if "imagem" in c:
        d = float(c.get("dur", 2.5))
        mov = c.get("movimento", "parallax")
        src = base / c["imagem"]
        fv = (f"[0:v]scale={W * 2}:{H * 2}:force_original_aspect_ratio=increase,crop={W * 2}:{H * 2},"
              f"scale={W}:{H},setsar=1,{mov_expr(mov, d, W, H, intens)},{grade},fps={FPS},format=yuv420p[v]")
        ff("-loop", "1", "-framerate", FPS, "-t", f"{d:.3f}", "-i", src, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
           "-filter_complex", fv, "-map", "[v]", "-map", "1:a", "-t", f"{d:.3f}", *ENC, out)
        return out, d

    src = base / c["arquivo"]
    info = probe(src)
    a = float(c.get("ini", 0))
    b = float(c.get("fim", info["dur"]))
    b = min(b, info["dur"])
    rampa = c.get("rampa")
    vel = float(c.get("velocidade", 1))
    enq = enquadrar(W, H, c.get("enquadre", "preencher"))
    usa_audio = c.get("audio", cfg["audio_padrao"]) and info["audio"] and not rampa

    if rampa:  # rampa de velocidade: [[pos_normalizada, velocidade], ...] interpolada em pedacos
        pts = sorted((float(p), float(v)) for p, v in rampa)
        n = 10
        chain, labels, d = [], [], 0.0
        for k in range(n):
            p0, p1 = k / n, (k + 1) / n
            pm = (p0 + p1) / 2
            v = float(np.interp(pm, [p[0] for p in pts], [p[1] for p in pts]))
            s0, s1 = a + (b - a) * p0, a + (b - a) * p1
            chain.append(f"[0:v]trim=start={s0:.4f}:end={s1:.4f},setpts=(PTS-STARTPTS)/{v:.4f}[r{k}]")
            labels.append(f"[r{k}]")
            d += (s1 - s0) / v
        pre = ";".join(chain) + f";{''.join(labels)}concat=n={n}:v=1:a=0,{enq}[base]"
        ins = ["-i", src]
    else:
        d = (b - a) / vel
        pre = f"[0:v]setpts=(PTS-STARTPTS)/{vel},{enq}[base]" if vel != 1 else f"[0:v]{enq}[base]"
        ins = ["-ss", f"{a:.4f}", "-t", f"{b - a:.4f}", "-i", src]
    fv = f"{pre};[base]{mov_expr(mov, d, W, H, intens)},{grade},fps={FPS},format=yuv420p,setsar=1[v]"
    if usa_audio:
        af = (f"[0:a]{'atempo=' + str(vel) + ',' if vel != 1 else ''}highpass=f=80,afftdn=nr=8:nf=-35,"
              f"acompressor=threshold=0.12:ratio=2.5:attack=8:release=120:makeup=1.6,"
              f"aresample=48000,aformat=sample_fmts=s16:channel_layouts=stereo,apad=whole_dur={d:.3f}[a]")
        ff(*ins, "-filter_complex", f"{fv};{af}", "-map", "[v]", "-map", "[a]", "-t", f"{d:.3f}", *ENC, out)
    else:
        ff(*ins, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-filter_complex", fv,
           "-map", "[v]", "-map", "1:a", "-t", f"{d:.3f}", *ENC, out)
    return out, d


# ------------------------------------------------------------------ transicoes
def _ease(q):
    return f"(({q})*({q})*(3-2*({q})))"


def render_transicao(tipo, A, durA, B, d, out, cfg):
    W, H, pal = cfg["W"], cfg["H"], cfg["pal"]
    h = d / 2
    w5, h5 = W // 5 // 2 * 2, H // 5 // 2 * 2
    ins = ["-ss", f"{durA - d:.4f}", "-t", f"{d:.4f}", "-i", A, "-t", f"{d:.4f}", "-i", B]
    fa = f"[0:a][1:a]acrossfade=d={d:.4f}:c1=qsin:c2=qsin,apad=whole_dur={d:.4f}[a]"
    corte_meio = f"[0:v][1:v]xfade=transition=fade:duration=0.06:offset={h - .03:.4f}"
    env = f"pow(sin(PI*T/{d:.4f}),1.3)"

    if tipo == "fade":
        v = f"[0:v][1:v]xfade=transition=fade:duration={d:.4f}:offset=0,format=yuv420p[v]"
    elif tipo == "respiro":
        v = f"[0:v][1:v]xfade=transition=fadeblack:duration={d:.4f}:offset=0,format=yuv420p[v]"
    elif tipo == "flash":
        v = (f"[0:v][1:v]xfade=transition=fadewhite:duration={d:.4f}:offset=0,"
             f"eq=brightness=0.1:enable='between(t,{.4 * d:.3f},{.6 * d:.3f})',format=yuv420p[v]")
    elif tipo in ("luz", "queima"):
        r, g, b = rgb(pal.get("luz", "#FF9A4D"))
        if tipo == "luz":
            blob = (f"(1.1*exp(-(pow(X-W*(0.1+0.8*T/{d:.3f}),2)+pow(Y-H*0.32,2))/(2*pow(W*0.42,2)))"
                    f"+0.9*exp(-(pow(X-W*(0.95-0.6*T/{d:.3f}),2)+pow(Y-H*0.78,2))/(2*pow(W*0.36,2))))*{env}")
            rr, gg, bb = (f"255*min(1,1.5*{blob}*{r / 255 + .2:.3f})", f"255*min(1,1.3*{blob}*{g / 255:.3f})",
                          f"255*min(1,1.1*{blob}*{b / 255 * .8:.3f})")
            base = f"[0:v][1:v]xfade=transition=fade:duration={d * .7:.4f}:offset={d * .15:.4f}"
            sig = 18
        else:
            rad = f"(0.05+1.6*{env})"
            noise = f"(0.75+0.25*sin(X/5+T*9)*sin(Y/7-T*6))"
            blob = f"(exp(-hypot(X-W*0.62,Y-H*0.4)/(W*{rad}))*{noise}*1.8*{env})"
            rr, gg, bb = (f"255*min(1,1.7*{blob})", f"255*min(1,1.15*pow({blob},1.4)*{g / 255 + .3:.3f})",
                          f"255*min(1,0.9*pow({blob},2.6))")
            base = corte_meio
            sig = 10
        v = (f"{base},format=gbrp[bx];"
             f"color=c=black:s={w5}x{h5}:r={FPS}:d={d:.4f},format=gbrp,geq=r='{rr}':g='{gg}':b='{bb}',"
             f"scale={W}:{H}:flags=bicubic,gblur=sigma={sig}[lk];"
             f"[bx][lk]blend=all_mode=screen,format=yuv420p[v]")
    elif tipo == "tinta":
        mask = (f"color=c=gray:s={w5}x{h5}:r={FPS}:d={d:.4f},noise=alls=100:allf=0,gblur=sigma=7,normalize,format=gray,"
                f"geq=lum='255*clip((T/{d:.4f}*1.35-0.15-(1-p(X,Y)/255)*0.8)*7,0,1)',"
                f"scale={W}:{H}:flags=bicubic,gblur=sigma=3,format=gbrp[m]")
        v = f"[0:v]format=gbrp[a0];[1:v]format=gbrp[b0];{mask};[a0][b0][m]maskedmerge,format=yuv420p[v]"
    elif tipo == "zoom":
        za = f"(1+0.9*pow(clip(t/{h:.4f},0,1),2.2))"
        zb = f"(1.9-0.9*{_ease(f'clip(t/{h:.4f},0,1)')})"
        v = (f"[0:v]scale=w='trunc({W}*{za}/2)*2':h='trunc({H}*{za}/2)*2':eval=frame,crop={W}:{H},tmix=frames=4[za];"
             f"[1:v]scale=w='trunc({W}*{zb}/2)*2':h='trunc({H}*{zb}/2)*2':eval=frame,crop={W}:{H},tmix=frames=4[zb];"
             f"[za][zb]xfade=transition=fade:duration=0.1:offset={h - .05:.4f},"
             f"eq=brightness=0.06:enable='between(t,{h - .08:.3f},{h + .08:.3f})',format=yuv420p[v]")
    elif tipo in ("chicote", "chicote_d"):
        x = "smoothleft" if tipo == "chicote" else "smoothright"
        v = (f"[0:v][1:v]xfade=transition={x}:duration={d:.4f}:offset=0,tmix=frames=3,"
             f"avgblur=sizeX={W // 30}:sizeY=1:enable='between(t,{.15 * d:.3f},{.85 * d:.3f})',"
             f"avgblur=sizeX={W // 12}:sizeY=1:enable='between(t,{.35 * d:.3f},{.65 * d:.3f})',format=yuv420p[v]")
    elif tipo == "giro":
        ang_a = f"(PI/5)*pow(clip(t/{h:.4f},0,1),2)"
        ang_b = f"-(PI/5)*pow(1-clip(t/{h:.4f},0,1),2)"
        v = (f"[0:v]scale={int(W * 1.5) // 2 * 2}:{int(H * 1.5) // 2 * 2},rotate='{ang_a}':ow={W}:oh={H}:c=black,tmix=frames=4[ga];"
             f"[1:v]scale={int(W * 1.5) // 2 * 2}:{int(H * 1.5) // 2 * 2},rotate='{ang_b}':ow={W}:oh={H}:c=black,tmix=frames=4[gb];"
             f"[ga][gb]xfade=transition=fade:duration=0.12:offset={h - .06:.4f},"
             f"gblur=sigma=6:enable='between(t,{h - .12:.3f},{h + .12:.3f})',format=yuv420p[v]")
    elif tipo == "prisma":
        v = (f"[0:v][1:v]xfade=transition=fade:duration={d * .6:.4f}:offset={d * .2:.4f},"
             f"rgbashift=rh=-6:bh=6:enable='between(t,{.1 * d:.3f},{.3 * d:.3f})+between(t,{.7 * d:.3f},{.9 * d:.3f})',"
             f"rgbashift=rh=-18:bh=18:rv=4:bv=-4:enable='between(t,{.3 * d:.3f},{.7 * d:.3f})',"
             f"gblur=sigma=3:enable='between(t,{.35 * d:.3f},{.65 * d:.3f})',format=yuv420p[v]")
    elif tipo == "glitch":
        v = (f"[0:v][1:v]xfade=transition=hrslice:duration={d:.4f}:offset=0,"
             f"rgbashift=rh=-18:bh=18:gv=6:enable='between(t,{.1 * d:.3f},{.32 * d:.3f})+between(t,{.55 * d:.3f},{.72 * d:.3f})',"
             f"noise=alls=40:allf=t:enable='between(t,{.28 * d:.3f},{.6 * d:.3f})',"
             f"eq=contrast=1.5:brightness=0.08:enable='between(t,{.45 * d:.3f},{.5 * d:.3f})',format=yuv420p[v]")
    elif tipo == "cor":
        ins += ["-f", "lavfi", "-t", f"{d:.4f}", "-i", f"color=c={pal['acc']}:s={W}x{H}:r={FPS}"]
        v = (f"{corte_meio}[bx];[2:v]format=yuva420p,fade=t=in:st=0:d={h * .8:.4f}:alpha=1,"
             f"fade=t=out:st={h * 1.05:.4f}:d={h * .9:.4f}:alpha=1[cc];[bx][cc]overlay=format=auto,format=yuv420p[v]")
    else:
        raise SystemExit(f"transicao desconhecida: {tipo}. Opcoes: {', '.join(TRANSICOES)}")
    ff(*ins, "-filter_complex", f"{v};{fa}", "-map", "[v]", "-map", "[a]", "-t", f"{d:.4f}", *ENC, out)


# ------------------------------------------------------------------ texto (ASS animado)
def _ca(hexc, alpha=0):
    r, g, b = rgb(hexc)
    return f"&H{alpha:02X}{b:02X}{g:02X}{r:02X}"


def _tc(t):
    cs = max(0, round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _limpa(t):
    return re.sub(r"\s+", " ", re.sub(r"\s*[—–]\s*", ", ", t)).strip(" ,")


def escrever_ass(arq, textos, cfg):
    W, H, pal, fx = cfg["W"], cfg["H"], cfg["pal"], cfg["fontes"]
    S = min(W, H)
    estilos = [
        ("Tit", fx["titulo"], int(S * .092), pal["claro"], 600),
        ("Cart", fx["titulo"], int(S * .11), pal["fg"], 600),
        ("Sub", fx["corpo"], int(S * .03), pal["claro"], 500),
        ("CartSub", fx["corpo"], int(S * .028), pal["acc"], 500),
    ]
    linhas = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}", "WrapStyle: 0", "",
              "[V4+ Styles]",
              "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
              "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"]
    for n, f, t, c, peso in estilos:
        linhas.append(f"Style: {n},{f},{t},{_ca(c)},&H000000FF,&H00000000,{_ca('#000000', 150)},{peso},0,0,0,100,100,0,0,1,0,"
                      f"{0 if n.startswith('Cart') else 2},5,60,60,0,1")
    linhas += ["", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    for t in textos:
        cart = t.get("tamanho") == "cartela"
        est, est_sub = ("Cart", "CartSub") if cart else ("Tit", "Sub")
        y = {"centro": .5, "topo": .2, "baixo": .78, "terco": .66}.get(t.get("pos", "centro"), .5)
        cx, cy = W // 2, int(H * y)
        a, b = t["em"], t["em"] + t["dur"]
        txt = _limpa(t["texto"]).replace("\n", "\\N")
        cor = "{\\1c" + _ca(t["cor"]) + "}" if t.get("cor") else ""
        anim = t.get("estilo", "revelar")
        ms = int(t["dur"] * 1000)
        if anim == "revelar":  # mascara sobe revelando o texto
            alt = int(S * .13)
            tag = (f"{{\\an5\\move({cx},{cy + alt // 2},{cx},{cy},0,520)\\clip(0,{cy + alt // 2},{W},{cy + alt // 2 + 1})"
                   f"\\t(0,520,0.6,\\clip(0,{cy - alt},{W},{cy + alt // 2 + 1}))\\fad(0,350)}}")
            linhas.append(f"Dialogue: 1,{_tc(a)},{_tc(b)},{est},,0,0,0,,{tag}{cor}{txt}")
        elif anim == "tracking":  # letras se aproximam devagar, padrao trailer
            tag = f"{{\\an5\\pos({cx},{cy})\\fsp{int(S * .03)}\\t(0,{ms},0.5,\\fsp{int(S * .004)})\\fad(450,400)}}"
            linhas.append(f"Dialogue: 1,{_tc(a)},{_tc(b)},{est},,0,0,0,,{tag}{cor}{txt}")
        elif anim == "foco":  # entra desfocado e ganha foco
            tag = f"{{\\an5\\pos({cx},{cy})\\blur18\\t(0,700,0.7,\\blur0)\\fscx108\\fscy108\\t(0,900,\\fscx100\\fscy100)\\fad(380,350)}}"
            linhas.append(f"Dialogue: 1,{_tc(a)},{_tc(b)},{est},,0,0,0,,{tag}{cor}{txt}")
        elif anim == "palavras":  # cada palavra entra no tempo, com encaixe
            ws = txt.split(" ")
            passo = min(.32, t["dur"] * .5 / max(len(ws), 1))
            acum = ""
            for k, w in enumerate(ws):
                ini = a + k * passo
                fim = a + (k + 1) * passo if k < len(ws) - 1 else b
                nova = "{\\alpha&H00&\\fscx118\\fscy118\\t(0,140,\\fscx100\\fscy100)}" + w
                linha = (acum + " " if acum else "") + nova + " {\\alpha&HFF&}" + " ".join(ws[k + 1:])
                linhas.append(f"Dialogue: 1,{_tc(ini)},{_tc(fim)},{est},,0,0,0,,{{\\an5\\pos({cx},{cy})}}{cor}{linha}")
                acum = (acum + " " if acum else "") + "{\\alpha&H00&}" + w
        elif anim == "maquina":
            for k in range(1, len(txt) + 1):
                ini = a + k * min(.06, t["dur"] * .5 / len(txt))
                fim = b if k == len(txt) else a + (k + 1) * min(.06, t["dur"] * .5 / len(txt))
                linhas.append(f"Dialogue: 1,{_tc(ini)},{_tc(fim)},{est},,0,0,0,,{{\\an5\\pos({cx},{cy})}}{cor}{txt[:k]}"
                              f"{{\\alpha&HFF&}}{txt[k:]}")
        else:
            linhas.append(f"Dialogue: 1,{_tc(a)},{_tc(b)},{est},,0,0,0,,{{\\an5\\pos({cx},{cy})\\fad(300,300)}}{cor}{txt}")
        if t.get("sub"):
            sy = cy + int(S * (.1 if cart else .085))
            tag = f"{{\\an5\\pos({cx},{sy})\\fsp{int(S * .006)}\\alpha&HFF&\\t(350,900,\\alpha&H00&)\\fad(0,350)}}"
            linhas.append(f"Dialogue: 1,{_tc(a)},{_tc(b)},{est_sub},,0,0,0,,{tag}{_limpa(t['sub']).upper()}")
    Path(arq).write_text("\n".join(linhas) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ som
def gerar_sfx(tipo, out, d=.7):
    if tipo == "whoosh":
        fc = ("anoisesrc=color=pink:d={d}:a=0.9,highpass=f=300,lowpass=f=1400,afade=t=in:d={a},afade=t=out:st={a}:d={b}[n1];"
              "anoisesrc=color=white:d={d}:a=0.6,highpass=f=2200,lowpass=f=6500,afade=t=in:st={c}:d={a},afade=t=out:st={e}:d={f}[n2];"
              "[n1][n2]amix=inputs=2:normalize=0,volume=1.4").format(d=d, a=d * .55, b=d * .45, c=d * .2, e=d * .6, f=d * .4)
    elif tipo == "brilho":
        fc = (f"anoisesrc=color=white:d={d * 1.4}:a=0.5,highpass=f=5500,lowpass=f=11000,afade=t=in:d={d * .6},"
              f"afade=t=out:st={d * .6}:d={d * .8},aecho=0.6:0.5:60|120:0.4|0.25,volume=0.9")
    elif tipo == "impacto":
        fc = (f"aevalsrc='0.95*sin(2*PI*(48+90*exp(-t*16))*t)*exp(-t*4.5)':d=1.4:s=48000[s];"
              f"anoisesrc=color=brown:d=0.25:a=0.8,lowpass=f=900,afade=t=out:d=0.25[n];[s][n]amix=inputs=2:normalize=0,"
              f"aecho=0.7:0.6:90:0.3")
    elif tipo == "glitch":
        fc = (f"anoisesrc=color=white:d={d}:a=0.5,acrusher=bits=4:mode=log:aa=0,"
              f"volume='if(lt(mod(t,0.09),0.045),1,0.1)':eval=frame,afade=t=out:st={d * .6}:d={d * .4}")
    elif tipo == "sopro":
        fc = f"anoisesrc=color=pink:d={d * 1.2}:a=0.6,lowpass=f=900,afade=t=in:d={d * .6},afade=t=out:st={d * .6}:d={d * .6}"
    elif tipo == "subida":
        fc = (f"aevalsrc='0.25*sin(2*PI*(180*t+260*t*t/{d}))*(t/{d})':d={d}:s=48000[s];"
              f"anoisesrc=color=white:d={d}:a=0.4,highpass=f=3000,afade=t=in:d={d}[n];[s][n]amix=inputs=2:normalize=0")
    else:
        return None
    ff("-f", "lavfi", "-i", f"{fc},aresample=48000,aformat=channel_layouts=stereo", "-t", f"{d * 1.6:.3f}", out)
    return out


# ------------------------------------------------------------------ projeto
def montar(proj_path):
    proj_path = Path(proj_path).resolve()
    proj = json.loads(proj_path.read_text())
    pf = perfil(proj.get("cliente"))
    vis, vid = pf.get("visual", {}), pf.get("video", {})
    pal = {**PAL_NEUTRA, **(vis.get("paleta") or {}), **(proj.get("paleta") or {})}
    fx = {"titulo": "Cormorant Garamond", "corpo": "Montserrat", **(vis.get("fontes") or {}), **(proj.get("fontes") or {})}
    W, H = FORMATOS[proj.get("formato", "9:16")]
    tmp = proj_path.parent / ".cinema_tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    for f in {fx["titulo"], fx["corpo"]}:
        baixar_fonte(f)
    musica = proj.get("musica")
    cfg = dict(W=W, H=H, pal=pal, fontes=fx, base=proj_path.parent, luts={},
               look=proj.get("look", vid.get("look", "filme_quente")),
               mov_padrao=proj.get("movimento", vid.get("movimento", "push_in")),
               audio_padrao=bool(proj.get("audio_cenas", not musica)))
    cenas = proj["cenas"]
    trans_pref = proj.get("transicoes", vid.get("transicoes", ["luz", "tinta", "zoom", "chicote", "fade"]))
    dur_t = float(proj.get("dur_transicao", vid.get("dur_transicao", .6)))

    # 1) sincronia com a musica: ajusta o fim das cenas para cair nas batidas
    beats = []
    if musica and musica.get("sincronizar", True):
        mpath = proj_path.parent / musica["arquivo"]
        beats = [t for t, f in _batidas_np(np.frombuffer(subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(mpath), "-ss", str(musica.get("inicio", 0)), "-ac", "1", "-ar", "22050",
             "-f", "f32le", "-"], capture_output=True).stdout, dtype=np.float32), .28) if f >= musica.get("forca_minima", .35)]

    # 2) render das cenas
    segs = []
    tl = 0.0
    for i, c in enumerate(cenas):
        c = dict(c)
        if beats and "arquivo" in c and not c.get("rampa"):
            info = probe(proj_path.parent / c["arquivo"])
            a = float(c.get("ini", 0))
            vel = float(c.get("velocidade", 1))
            fim_desejado = float(c.get("fim", min(info["dur"], a + 3.0 * vel)))
            alvo = tl + (fim_desejado - a) / vel
            perto = min(beats, key=lambda t: abs(t - alvo))
            if abs(perto - alvo) < .45 and perto > tl + .6:
                novo_fim = a + (perto - tl) * vel
                if novo_fim <= info["dur"]:
                    c["fim"] = novo_fim
        if "imagem" in c and beats and "dur" not in c:
            prox = [t for t in beats if t > tl + 1.6]
            if prox:
                c["dur"] = prox[0] - tl
        arq, d = render_cena(c, i, cfg, tmp)
        tr = c.get("transicao")
        segs.append(dict(arq=arq, d=d, c=c))
        print(f"cena {i + 1}/{len(cenas)}: {d:.2f}s")
        tl += d - (dur_t if i < len(cenas) - 1 and tr != "corte" else 0)

    # 3) escolhe transicoes (nunca repete a mesma em sequencia; a cada 3, um corte seco no ritmo)
    escolhidas, k = [], 0
    for i in range(len(segs) - 1):
        tr = segs[i]["c"].get("transicao")
        if not tr or tr == "auto":
            if (i + 1) % 3 == 0 and proj.get("cortes_secos", True):
                tr = "corte"
            else:
                tr = trans_pref[k % len(trans_pref)]
                if escolhidas and tr == escolhidas[-1]:
                    k += 1
                    tr = trans_pref[k % len(trans_pref)]
                k += 1
        escolhidas.append(tr)

    # 4) monta a linha do tempo: corpo de cada cena + peca de transicao entre elas
    pecas, inicio_cena, t = [], [], 0.0
    sfx_eventos = []
    for i, s in enumerate(segs):
        d_in = float(segs[i - 1]["c"].get("dur_transicao", dur_t)) if i > 0 and escolhidas[i - 1] != "corte" else 0
        d_out = float(s["c"].get("dur_transicao", dur_t)) if i < len(segs) - 1 and escolhidas[i] != "corte" else 0
        d_in, d_out = min(d_in, s["d"] * .45), min(d_out, s["d"] * .45)
        inicio_cena.append(t - d_in)
        corpo = tmp / f"corpo{i:03d}.mkv"
        ff("-ss", f"{d_in:.4f}", "-t", f"{s['d'] - d_in - d_out:.4f}", "-i", s["arq"], *ENC, corpo)
        pecas.append(corpo)
        t += s["d"] - d_in - d_out
        if d_out:
            tp = tmp / f"trans{i:03d}.mkv"
            nxt = segs[i + 1]
            d_t = min(d_out, nxt["d"] * .45)
            render_transicao(escolhidas[i], s["arq"], s["d"], nxt["arq"], d_t, tp, cfg)
            pecas.append(tp)
            if SFX_DE.get(escolhidas[i]):
                sfx_eventos.append((SFX_DE[escolhidas[i]], t - .25 if SFX_DE[escolhidas[i]] == "whoosh" else t))
            t += d_t
        elif i < len(segs) - 1 and proj.get("sfx_corte"):
            sfx_eventos.append(("impacto", t))
        if "cartela" in s["c"] and i > 0:
            sfx_eventos.append(("impacto", inicio_cena[i] + .1))
    total = t

    lista = tmp / "lista.txt"
    lista.write_text("".join(f"file '{p}'\n" for p in pecas))
    bruto = tmp / "bruto.mkv"
    ff("-f", "concat", "-safe", 0, "-i", lista, "-c", "copy", bruto)

    # 5) textos sobre as cenas (tempo global)
    textos = []
    for i, s in enumerate(segs):
        for tx in ([s["c"]["texto"]] if isinstance(s["c"].get("texto"), dict) else s["c"].get("textos", [])):
            textos.append(dict(tx, texto=tx["conteudo"], em=inicio_cena[i] + float(tx.get("em", .3)),
                               dur=float(tx.get("dur", min(2.4, s["d"] - .3)))))
    ass = None
    if textos:
        ass = tmp / "textos.ass"
        escrever_ass(ass, textos, cfg)

    saida = proj_path.parent / proj.get("saida", "saida/final.mp4")
    saida.parent.mkdir(parents=True, exist_ok=True)
    tex = {**{"grao": .5, "halation": .4, "vinheta": .3, "barras": False, "aberracao": .2}, **(vid.get("textura") or {}),
           **(proj.get("textura") or {})}
    acabamento(bruto, saida, cfg, tex, ass=ass, musica=musica, sfx=sfx_eventos if proj.get("sfx", vid.get("sfx", True)) else [],
               total=total, voz=cfg["audio_padrao"] or any(s["c"].get("audio") for s in segs), base=proj_path.parent, tmp=tmp)
    rel = relatorio(saida, escolhidas, inicio_cena, tmp)
    print(json.dumps(rel, ensure_ascii=False, indent=1))
    if not proj.get("manter_tmp"):
        shutil.rmtree(tmp, ignore_errors=True)


def textura_filtro(tex, W, H, pal):
    f = []
    if tex.get("halation"):
        k = float(tex["halation"])
        f.append(f"format=gbrp,split[o][hl];[hl]curves=all='0/0 0.7/0 1/1',gblur=sigma={int(W * .018)},"
                 f"colorchannelmixer=rr=1:gg=.42:bb=.18[hb];[o][hb]blend=all_mode=screen:all_opacity={min(k, 1) * .6:.2f}")
    if tex.get("aberracao"):
        px = max(1, int(float(tex["aberracao"]) * 6))
        f.append(f"rgbashift=rh=-{px}:bh={px}")
    if tex.get("vinheta"):
        f.append(f"vignette=angle={.25 + float(tex['vinheta']) * .5:.2f}:mode=forward")
    if tex.get("grao"):
        f.append(f"noise=c0s={int(4 + float(tex['grao']) * 14)}:c0f=t+u")
    if tex.get("respiro_exposicao"):
        f.append("eq=brightness='0.012*sin(t*7.3)*sin(t*3.1)':eval=frame")
    if tex.get("barras"):
        bh = int((H - W / 2.39) / 2) if W > H else int(H * .085)
        f.append(f"drawbox=x=0:y=0:w=iw:h={bh}:color=black:t=fill,drawbox=x=0:y=ih-{bh}:w=iw:h={bh}:color=black:t=fill")
    return ",".join(f) if f else "null"


def acabamento(entrada, saida, cfg, tex, ass=None, musica=None, sfx=(), total=None, voz=True, base=Path("."), tmp=None, lut=None):
    W, H, pal = cfg["W"], cfg["H"], cfg["pal"]
    tmp = Path(tmp or Path(saida).parent / ".cinema_tmp")
    tmp.mkdir(exist_ok=True)
    total = total or dur_de(entrada)
    v = "[0:v]" + (f"lut3d=file='{lut}'," if lut else "") + textura_filtro(tex, W, H, pal)
    if ass:
        v += f",ass='{ass}':fontsdir='{FONTES}'"
    v += ",format=yuv420p[v]"
    ins = ["-i", entrada]
    a_parts, mix = [], []
    a_parts.append(f"[0:a]aformat=sample_fmts=fltp:channel_layouts=stereo,volume={1.0 if voz else 0}[voz]")
    mix.append("[voz]")
    n = 1
    if musica:
        ins += ["-ss", str(musica.get("inicio", 0)), "-i", base / musica["arquivo"]]
        vol = float(musica.get("volume", .9 if not voz else .16))
        a_parts.append(f"[{n}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=0:{total:.3f},volume={vol},"
                       f"afade=t=in:d=0.3,afade=t=out:st={max(total - 1.6, 0):.3f}:d=1.6[mus]")
        if voz:
            a_parts.append("[voz]asplit[voz1][vozsc]")
            mix[-1] = "[voz1]"
            a_parts.append("[mus][vozsc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[musd]")
            mix.append("[musd]")
        else:
            mix.append("[mus]")
        n += 1
    for k, (tipo, em) in enumerate(sfx):
        arq = gerar_sfx(tipo, tmp / f"sfx{k:02d}.wav")
        if not arq:
            continue
        ins += ["-i", arq]
        ms = max(0, int(em * 1000))
        a_parts.append(f"[{n}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.5,adelay={ms}|{ms}[s{k}]")
        mix.append(f"[s{k}]")
        n += 1
    a = ";".join(a_parts) + f";{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=first," \
        f"loudnorm=I=-14:TP=-1.2:LRA=9,aresample=48000[a]"
    ff(*ins, "-filter_complex", f"{v};{a}", "-map", "[v]", "-map", "[a]", "-t", f"{total:.3f}",
       "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", FPS,
       "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", saida)


def relatorio(saida, trans, inicios, tmp):
    info = probe(saida)
    r = sh(["ffmpeg", "-hide_banner", "-i", str(saida), "-af", "ebur128", "-f", "null", "-"], check=False).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", r)
    bk = sh(["ffmpeg", "-hide_banner", "-i", str(saida), "-vf", "blackdetect=d=0.15:pix_th=0.06", "-an", "-f", "null", "-"],
            check=False).stderr
    pretos = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bk)
    contato = Path(saida).with_name(Path(saida).stem + "_contato.jpg")
    n = 12
    passo = info["dur"] / (n + 1)
    ff("-i", saida, "-vf", f"fps=1/{passo:.3f},scale=270:-2,tile=6x2:padding=6:color=white", "-frames:v", 1, contato)
    return dict(saida=str(saida), duracao=round(info["dur"], 2), resolucao=f"{info['w']}x{info['h']}",
                lufs=float(m[-1]) if m else None, quadros_pretos=pretos, transicoes=trans,
                cortes_em=[round(x, 2) for x in inicios[1:]], contato=str(contato))


def quadros(video, t0, t1, n, out):
    t0, t1, n = float(t0), float(t1), int(n)
    passo = max((t1 - t0) / max(n - 1, 1), 1 / FPS)
    ff("-ss", t0, "-i", video, "-vf", f"fps=1/{passo:.4f},scale=240:-2,tile={n}x1:padding=4:color=white", "-frames:v", 1, out)
    print(out)


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"):
        print(__doc__)
    elif a[0] == "--setup":
        setup(a[1] if len(a) > 1 else None)
    elif a[0] == "--looks":
        print("LOOKS:", ", ".join(LOOKS))
        for k, v in TRANSICOES.items():
            print(f"  {k:10s} {v}")
    elif a[0] == "--batidas":
        bs = _batidas_np(np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", a[1], "-ac", "1", "-ar", "22050", "-f", "f32le", "-"],
                                                      capture_output=True).stdout, dtype=np.float32), .28)
        print(json.dumps(bs))
    elif a[0] == "--quadros":
        quadros(*a[1:6])
    elif a[0] == "--acabamento":
        ent, sai = Path(a[1]).resolve(), Path(a[2]).resolve()
        opts = dict(zip(a[3::2], a[4::2]))
        pf = perfil(opts.get("--cliente"))
        pal = {**PAL_NEUTRA, **(pf.get("visual", {}).get("paleta") or {})}
        info = probe(ent)
        tmp = sai.parent / ".cinema_tmp"
        tmp.mkdir(parents=True, exist_ok=True)
        look = opts.get("--look", pf.get("video", {}).get("look", "filme_quente"))
        tex = {**{"grao": .4, "halation": .3, "vinheta": .25, "aberracao": .1}, **(pf.get("video", {}).get("textura") or {})}
        cfg = dict(W=info["w"], H=info["h"], pal=pal)
        acabamento(ent, sai, cfg, tex, voz=True, tmp=tmp, lut=gerar_lut(look, pal, tmp))
        print(json.dumps(relatorio(sai, [], [0], tmp), ensure_ascii=False, indent=1))
        shutil.rmtree(tmp, ignore_errors=True)
    else:
        montar(a[0])


if __name__ == "__main__":
    main()
