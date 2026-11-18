#!/usr/bin/env python3
"""Perfis de projeto (clientes, estudio e perfil pessoal) do Estudio Criativo.

  python3 perfil.py listar                       todos os perfis, status e pendencias
  python3 perfil.py detectar "<pedido, nomes de arquivo, pasta, @>"
                                                 identifica de qual projeto e o pedido (por aliases, nome, segmento)
  python3 perfil.py mostrar <slug>               perfil completo
  python3 perfil.py resumo <slug>                ficha curta para colar no contexto antes de criar
  python3 perfil.py novo <slug> "Nome"           cria a pasta do cliente a partir do modelo
  python3 perfil.py do-briefing <slug> <briefing.txt>
                                                 preenche o perfil a partir do texto gerado pelo formulario
                                                 "Briefing do cliente" da Auri (botao Copiar)
  python3 perfil.py logo-cores <slug> <logo.png> amostra as cores do logo e sugere a paleta
"""
import json, re, shutil, sys, unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[3] if (AQUI.parents[3] / "estudio").exists() else Path.cwd()
CLIENTES = RAIZ / "estudio" / "clientes"


def norm(t):
    t = unicodedata.normalize("NFKD", str(t).lower())
    return re.sub(r"[^a-z0-9@ ]+", " ", "".join(c for c in t if not unicodedata.combining(c))).strip()


def todos():
    for p in sorted(CLIENTES.glob("*/perfil.json")):
        if p.parent.name.startswith("_"):
            continue
        yield p.parent.name, json.loads(p.read_text())


def detectar(texto):
    alvo = " " + norm(texto) + " "
    res = []
    for slug, pf in todos():
        pts, motivos = 0, []
        for a in set([slug.replace("-", " "), pf.get("nome", "")] + pf.get("aliases", [])):
            a = norm(a)
            if len(a) >= 3 and f" {a} " in alvo:
                pts += 10 + len(a) / 10
                motivos.append(a)
        genericas = {"studio", "estudio", "loja", "estetica", "clinica", "conta", "agencia", "store", "boutique", "pilates"}
        for palavra in set(norm(pf.get("nome", "")).split()):
            if len(palavra) >= 4 and palavra not in genericas and f" {palavra} " in alvo and palavra not in motivos:
                pts += 6
                motivos.append(palavra)
        for palavra in norm(pf.get("segmento", "") + " " + pf.get("oferta", "")).split():
            if len(palavra) >= 6 and f" {palavra} " in alvo:
                pts += 1.5
                motivos.append(palavra)
        if pts:
            res.append(dict(slug=slug, nome=pf.get("nome"), pontos=round(pts, 1), por=sorted(set(motivos))))
    res.sort(key=lambda r: -r["pontos"])
    if not res:
        print(json.dumps(dict(resultado="nenhum perfil reconhecido", acao="pergunte de qual cliente e ou crie com: perfil.py novo"),
                         ensure_ascii=False, indent=1))
    else:
        conf = "alta" if res[0]["pontos"] >= 10 and (len(res) == 1 or res[0]["pontos"] >= 2 * res[1]["pontos"]) else "baixa"
        print(json.dumps(dict(provavel=res[0]["slug"], confianca=conf, candidatos=res[:4]), ensure_ascii=False, indent=1))


def resumo(slug):
    pf = json.loads((CLIENTES / slug / "perfil.json").read_text())
    v, vis, vid = pf.get("voz", {}), pf.get("visual", {}), pf.get("video", {})
    pasta = CLIENTES / slug
    refs = [x.name for x in (pasta / "referencias").glob("*") if x.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")] \
        if (pasta / "referencias").exists() else []
    linhas = [
        f"# {pf['nome']} ({slug})  status: {pf.get('status')}",
        f"Segmento: {pf.get('segmento')} | Oferta: {pf.get('oferta')}",
        f"Público: {pf.get('publico')} | Objetivo: {pf.get('objetivo_redes')}",
        f"VOZ: pessoa={v.get('pessoa')} registro={v.get('registro')} tom={', '.join(v.get('tom', []))}",
        f"  faz: {'; '.join(v.get('faz', []))}",
        f"  evita: {'; '.join(v.get('evita', []))}",
        f"  proibidas: {', '.join(v.get('palavras_proibidas', []))} | emoji max {v.get('emoji_max')} | hashtags {v.get('hashtags')}",
        f"  CTA: {v.get('cta_preferido')}",
        f"VISUAL: paleta {vis.get('paleta')}",
        f"  fontes {vis.get('fontes')} | estilo {', '.join(vis.get('estilo', []))}",
        f"  regras: {'; '.join(vis.get('regras', []))}",
        f"  proibido: {'; '.join(vis.get('proibido', []) + vis.get('cores_proibidas', []))}",
        f"  referências na pasta: {len(refs)} imagem(ns)" + ("; ficha.json existe" if (pasta / 'referencias' / 'ficha.json').exists() else "; SEM ficha (rode referencias.py analisar)" if refs else ""),
        f"VÍDEO: estilo {vid.get('estilo')} look {vid.get('look')} movimento {vid.get('movimento')} transições {vid.get('transicoes')} evitar {vid.get('evitar_transicoes')}",
        f"  música: {vid.get('musica')} | ritmo: {vid.get('ritmo')}",
    ]
    if (pasta / "voz.md").exists():
        linhas.append(f"Guia de voz detalhado: {pasta / 'voz.md'}")
    if pf.get("pendencias"):
        linhas.append("PENDÊNCIAS: " + " | ".join(pf["pendencias"]))
    print("\n".join(linhas))


def novo(slug, nome):
    dst = CLIENTES / slug
    if dst.exists():
        raise SystemExit(f"ja existe: {dst}")
    dst.mkdir(parents=True)
    pf = json.loads((CLIENTES / "_modelo" / "perfil.json").read_text())
    pf.update(slug=slug, nome=nome, aliases=[nome.lower()], status="rascunho")
    (dst / "perfil.json").write_text(json.dumps(pf, ensure_ascii=False, indent=2) + "\n")
    shutil.copy(CLIENTES / "_modelo" / "voz.md", dst / "voz.md")
    for sub in ("referencias", "logo", "fontes", "aprovados"):
        (dst / sub).mkdir()
        (dst / sub / ".gitkeep").write_text("")
    print(f"criado: {dst}")


CORES_BRIEF = {
    "Neutros": ["#F2EEE6", "#2B2A28", "#B8AFA3"], "Terrosos": ["#EFE3D3", "#3B2A20", "#B5653A"],
    "Frios": ["#EEF2F4", "#1E2A33", "#5B7F95"], "Vibrantes": ["#FFF4EC", "#1F1A17", "#E8572A"],
    "Escuros": ["#1C1F1B", "#F2EEE6", "#6B1E2E"], "Pastéis": ["#F8F1F0", "#3A3333", "#E7B8C0"],
}
TOM_BRIEF = {
    "Formal e profissional": ("formal", ["profissional", "preciso"]), "Descontraído e próximo": ("proximo", ["descontraido", "acolhedor"]),
    "Empoderador e motivacional": ("proximo", ["encorajador", "firme"]), "Informativo e educativo": ("didatico", ["claro", "educativo"]),
    "Divertido e bem-humorado": ("proximo", ["bem-humorado", "leve"]),
}
ESTILO_VIDEO = {
    "Clean / Minimalista": ("clean", "natural", ["fade", "tinta", "zoom"]),
    "Orgânico / Natural": ("editorial", "filme_quente", ["tinta", "luz", "fade"]),
    "Editorial / Sofisticado": ("editorial", "pastel_editorial", ["luz", "tinta", "fade", "zoom"]),
    "Colorido / Expressivo": ("dinamico", "teal_laranja", ["chicote", "zoom", "glitch", "luz"]),
    "Retrô / Vintage": ("editorial", "kodak_dourado", ["queima", "luz", "fade"]),
    "Tech / Futurista": ("dinamico", "teal_laranja", ["glitch", "prisma", "zoom", "chicote"]),
}


def do_briefing(slug, arq):
    txt = Path(arq).read_text()
    kv = {}
    for l in txt.splitlines():
        if ":" in l and not l.strip().startswith("="):
            k, v = l.split(":", 1)
            v = v.strip()
            if v and v != "—":
                kv[k.strip()] = v
    if not (CLIENTES / slug).exists():
        novo(slug, kv.get("Nome da marca", slug))
    p = CLIENTES / slug / "perfil.json"
    pf = json.loads(p.read_text())
    lst = lambda k: [x.strip() for x in kv.get(k, "").split(",") if x.strip()]
    pf["nome"] = kv.get("Nome da marca", pf["nome"])
    pf["aliases"] = sorted(set(pf.get("aliases", []) + [pf["nome"].lower()]))
    pf["segmento"] = kv.get("Segmento", pf.get("segmento"))
    pf["oferta"] = kv.get("O que oferece", pf.get("oferta"))
    pf["publico"] = ", ".join(x for x in [kv.get("Sexo predominante"), kv.get("Faixa etária"), kv.get("Classe social")] if x)
    pf["objetivo_redes"] = kv.get("Objetivo principal", pf.get("objetivo_redes"))
    pf["fontes_da_verdade"] = sorted(set(pf.get("fontes_da_verdade", []) + [f"briefing ({Path(arq).name})"]))
    tons = lst("Tom de comunicação")
    if tons:
        reg, tt = TOM_BRIEF.get(tons[0], ("proximo", []))
        pf["voz"]["registro"] = reg
        pf["voz"]["tom"] = sorted(set(pf["voz"].get("tom", []) + tt + [t.lower() for t in lst("Personalidade")]))
    pf["visual"]["estilo"] = lst("Estilo visual") + [x.lower() for x in lst("Personalidade")]
    if kv.get("Cores proibidas"):
        pf["visual"]["cores_proibidas"] = [kv["Cores proibidas"]]
    cores = lst("Paleta de cores")
    if cores:
        nome = cores[0].split(" ")[0]
        if nome in CORES_BRIEF:
            bg, fg, acc = CORES_BRIEF[nome]
            pf["visual"]["paleta"].update(bg=bg, fg=fg, acc=acc)
            pf.setdefault("pendencias", []).append(f"Paleta provisória pela família '{nome}' do briefing: trocar pelos hex do logo ou manual")
    est = lst("Estilo visual")
    if est and est[0] in ESTILO_VIDEO:
        e, look, trs = ESTILO_VIDEO[est[0]]
        pf["video"].update(estilo=e, look=look, transicoes=trs)
    refs = [x for x in [kv.get("Referências de marca"), kv.get("Link de referência")] if x]
    if refs:
        pf.setdefault("pendencias", []).append("Baixar referências citadas no briefing para referencias/: " + " | ".join(refs))
    if kv.get("Concorrentes"):
        pf["visual"]["proibido"] = sorted(set(pf["visual"].get("proibido", []) + [f"semelhança visual com: {kv['Concorrentes']}"]))
    if kv.get("Observações"):
        pf.setdefault("pendencias", []).append(f"Observação do briefing: {kv['Observações']}")
    pf["pendencias"] = sorted(set(pf.get("pendencias", [])))
    p.write_text(json.dumps(pf, ensure_ascii=False, indent=2) + "\n")
    print(f"perfil atualizado a partir do briefing: {p}")
    resumo(slug)


def logo_cores(slug, logo):
    from PIL import Image
    im = Image.open(logo).convert("RGBA")
    px = [p[:3] for p in im.resize((200, int(200 * im.height / im.width) or 1)).getdata() if p[3] > 200]
    if not px:
        raise SystemExit("logo sem pixels opacos")
    q = Image.new("RGB", (len(px), 1))
    q.putdata(px)
    q = q.quantize(colors=5)
    pal = q.getpalette()[:15]
    cont = sorted(q.getcolors(), reverse=True)
    cores = ["#%02X%02X%02X" % tuple(pal[i * 3:i * 3 + 3]) for _, i in cont]
    lum = lambda h: sum(int(h[k:k + 2], 16) * w for k, w in ((1, .299), (3, .587), (5, .114)))
    escuras = sorted(cores, key=lum)
    print(json.dumps(dict(cores_do_logo=cores, sugestao=dict(dark=escuras[0], fg=escuras[0], acc=cores[0] if lum(cores[0]) < 200 else escuras[1],
                                                             claro=escuras[-1])), indent=1))
    print("Confira e grave em visual.paleta do perfil (bg costuma ser um claro neutro que combine).")


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"):
        print(__doc__)
    elif a[0] == "listar":
        for slug, pf in todos():
            print(f"{slug:28s} {pf.get('tipo', ''):9s} {pf.get('status', ''):11s} {pf.get('nome', '')}"
                  + (f"  [{len(pf.get('pendencias', []))} pendência(s)]" if pf.get("pendencias") else ""))
    elif a[0] == "detectar":
        detectar(" ".join(a[1:]))
    elif a[0] == "mostrar":
        print((CLIENTES / a[1] / "perfil.json").read_text())
    elif a[0] == "resumo":
        resumo(a[1])
    elif a[0] == "novo":
        novo(a[1], a[2] if len(a) > 2 else a[1])
    elif a[0] == "do-briefing":
        do_briefing(a[1], a[2])
    elif a[0] == "logo-cores":
        logo_cores(a[1], a[2])
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
