#!/usr/bin/env python3
"""Tom de voz: aprende com textos reais do projeto e revisa copy contra o perfil.

  python3 voz.py analisar <slug> <amostras.txt> [--gravar]
        Amostras: legendas antigas aprovadas, textos do site, transcricao de audio do cliente.
        Separe cada texto com uma linha contendo apenas ---.
        Mede ritmo (palavras por frase), pessoa gramatical, emoji, exclamacao, perguntas, hashtags,
        aberturas e fechamentos tipicos e o vocabulario proprio. Com --gravar salva em voz.metricas do perfil.
  python3 voz.py checar <slug> <texto.txt | -> [--tipo legenda|carrossel|roteiro|story|anuncio]
        Revisa a copy: travessoes, cliches, isca de engajamento, palavras proibidas do cliente,
        pessoa gramatical errada, excesso de emoji/hashtag, primeira linha longa e desvio do ritmo medido.
        Sai com codigo 1 se houver erro bloqueante.
"""
import json, re, sys, unicodedata
from collections import Counter
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[3] if (AQUI.parents[3] / "estudio").exists() else Path.cwd()
CLIENTES = RAIZ / "estudio" / "clientes"

CLICHES = ["no mundo digital", "transforme seu negocio", "transforme sua", "descubra o poder", "mergulhe nesse", "mergulhe no", "mergulhe na", "potencializ",
           "alavanc", "jornada", "revolucion", "game changer", "o futuro e agora",
           "escale seu negocio", "eleve seu", "eleve sua", "desbloqueie", "nao perca tempo", "imperdivel",
           "venha conferir", "voce nao vai acreditar", "sem mais delongas", "em um mundo cada vez", "nos dias de hoje",
           "e mais do que", "muito mais que", "faca parte", "o segredo para", "a chave para", "experiencia unica",
           "qualidade e excelencia", "solucoes inovadoras", "seu sucesso", "nao e so", "sinta a diferenca"]
ISCAS = ["comente eu quero", "marque 3", "marque tres", "marque uma amiga", "marque aquela", "de dois toques", "deixe seu like",
         "curte e compartilha", "comenta ai", "arrasta pra cima e", "salva esse post agora"]
SINCERIDADE = ["vou ser sincera", "vou ser sincero", "sem filtro", "papo reto", "vou ser honesta", "vou ser honesto"]
STOP = set("a o e de da do das dos em um uma uns umas que para por com sem no na nos nas se ao aos as os mais mas como "
           "eu voce voces ele ela isso isto esse essa este esta ja so nao sim muito pra pro seu sua seus suas meu minha "
           "nosso nossa ter tem foi ser sao era vai vou quando onde porque tambem ate bem aqui la ou entao".split())
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF❤✨]")


def sem_acento(t):
    return "".join(c for c in unicodedata.normalize("NFKD", t.lower()) if not unicodedata.combining(c))


def frases(t):
    return [f.strip() for f in re.split(r"(?<=[.!?])\s+|\n+", t) if len(f.strip().split()) >= 2]


def pessoa(t):
    s = " " + sem_acento(t) + " "
    c = dict(voce=len(re.findall(r"\b(voce|seu|sua|seus|suas|te)\b", s)), voces=len(re.findall(r"\bvoces\b", s)),
             tu=len(re.findall(r"\b(tu|teu|tua)\b", s)), nos=len(re.findall(r"\b(nos|nosso|nossa|a gente)\b", s)),
             eu=len(re.findall(r"\b(eu|meu|minha|comigo)\b", s)))
    return c


def medir(textos):
    tudo = "\n".join(textos)
    fr = [f for t in textos for f in frases(t)]
    pal = [len(f.split()) for f in fr] or [0]
    words = [w for w in re.findall(r"[a-zà-ú]+", tudo.lower()) if sem_acento(w) not in STOP and len(w) > 3]
    ab = Counter(" ".join(t.strip().split()[:2]).lower() for t in textos if t.strip())
    fe = Counter((frases(t) or [""])[-1][-40:] for t in textos)
    p = pessoa(tudo)
    tot = sum(p.values()) or 1
    return dict(
        textos=len(textos), palavras_por_frase=round(sum(pal) / len(pal), 1),
        frases_curtas_pct=round(sum(1 for x in pal if x <= 6) / len(pal), 2),
        caracteres_por_texto=round(sum(len(t) for t in textos) / max(len(textos), 1)),
        emoji_por_texto=round(len(EMOJI.findall(tudo)) / max(len(textos), 1), 1),
        exclamacao_por_texto=round(tudo.count("!") / max(len(textos), 1), 1),
        pergunta_por_texto=round(tudo.count("?") / max(len(textos), 1), 1),
        hashtags_por_texto=round(len(re.findall(r"#\w+", tudo)) / max(len(textos), 1), 1),
        pessoa={k: round(v / tot, 2) for k, v in p.items()},
        caixa_alta_pct=round(sum(1 for w in re.findall(r"\b[A-ZÀ-Ú]{3,}\b", tudo)) / max(len(tudo.split()), 1), 3),
        vocabulario_proprio=[w for w, _ in Counter(words).most_common(25)],
        aberturas=[a for a, n in ab.most_common(5)], fechamentos=[f for f, n in fe.most_common(3)],
        usa_travessao=bool(re.search(r"[—–]", tudo)))


def perfil(slug):
    return json.loads((CLIENTES / slug / "perfil.json").read_text())


def analisar(slug, arq, gravar):
    txt = Path(arq).read_text()
    textos = [t.strip() for t in re.split(r"^\s*---\s*$", txt, flags=re.M) if t.strip()]
    m = medir(textos)
    print(json.dumps(m, ensure_ascii=False, indent=1))
    if m["textos"] < 5:
        print("AVISO: menos de 5 textos. A leitura de voz fica fraca; peça mais amostras.")
    if gravar:
        p = CLIENTES / slug / "perfil.json"
        pf = json.loads(p.read_text())
        pf["voz"]["metricas"] = m
        p.write_text(json.dumps(pf, ensure_ascii=False, indent=2) + "\n")
        print(f"metricas gravadas em {p}")


def checar(slug, texto, tipo="legenda"):
    pf = perfil(slug)
    v = pf.get("voz", {})
    erros, avisos = [], []
    s = sem_acento(texto)
    if re.search(r"[—–]", texto) or " -- " in texto or re.search(r"\s-\s", texto):
        linhas = [l.strip()[:60] for l in texto.splitlines() if re.search(r"[—–]|\s-\s| -- ", l)]
        erros.append("travessão ou traço entre frases (proibido): " + " | ".join(linhas))
    for c in CLICHES:
        if c in s:
            erros.append(f"clichê de marketing: '{c}'")
    for c in ISCAS:
        if c in s:
            erros.append(f"isca de engajamento: '{c}'")
    for c in SINCERIDADE:
        if c in s:
            erros.append(f"anúncio de sinceridade: '{c}'")
    if re.search(r"\bnao e (so )?(sobre )?[^.,\n]{1,40}[,.]? e\b", s):
        avisos.append("estrutura 'não é X, é Y' (evitar)")
    if re.search(r"e o resultado\?|aqui esta o segredo|o segredo\?", s):
        erros.append("revelação dramática ('E o resultado?', 'o segredo')")
    for w in v.get("palavras_proibidas", []):
        if sem_acento(w) in s:
            erros.append(f"palavra proibida para {pf['nome']}: '{w}'")
    p = pessoa(texto)
    alvo = v.get("pessoa", "voce")
    if alvo == "voce" and (p["voces"] > p["voce"] and p["voces"] > 1):
        avisos.append("o perfil fala com 'você' (singular), o texto usa 'vocês'")
    if alvo == "voce" and p["tu"] > 0:
        avisos.append("uso de 'tu/teu/tua', perfil pede 'você'")
    if alvo == "voces" and p["voce"] > p["voces"] + 1:
        avisos.append("o perfil fala com 'vocês', o texto está no singular")
    if pf.get("tipo") == "cliente" and p["eu"] > 2 and alvo != "eu":
        avisos.append("muita primeira pessoa do singular num perfil de marca (confirme se é a dona falando)")
    emo = len(EMOJI.findall(texto))
    if emo > v.get("emoji_max", 3):
        erros.append(f"{emo} emojis (máximo do perfil: {v.get('emoji_max', 3)})")
    hs = len(re.findall(r"#\w+", texto))
    lo, hi = (v.get("hashtags") or [0, 30])
    if tipo == "legenda" and hs and not lo <= hs <= hi:
        avisos.append(f"{hs} hashtags (perfil: {lo} a {hi})")
    prim = texto.strip().splitlines()[0] if texto.strip() else ""
    if tipo == "legenda" and len(prim) > 125:
        avisos.append(f"primeira linha com {len(prim)} caracteres: o Instagram corta em ~125, o gancho some")
    if tipo == "legenda" and re.search(r"o que voce acha\??\s*$", s.strip().splitlines()[-1] if s.strip() else ""):
        avisos.append("fechamento genérico 'o que você acha?': troque por pergunta específica ou motivo para salvar/enviar")
    if texto.count("!") > 3:
        avisos.append(f"{texto.count('!')} exclamações: soa vendedor")
    m = v.get("metricas") or {}
    if m.get("palavras_por_frase"):
        fr = frases(texto)
        if fr:
            ppf = sum(len(f.split()) for f in fr) / len(fr)
            ref = m["palavras_por_frase"]
            if abs(ppf - ref) > max(4, ref * .45):
                avisos.append(f"ritmo: {ppf:.1f} palavras por frase, a voz real do projeto usa {ref} ({'encurte' if ppf > ref else 'pode alongar'})")
        if m.get("emoji_por_texto", 0) < .3 and emo >= 2:
            avisos.append("o projeto quase não usa emoji nas amostras reais")
        if m.get("exclamacao_por_texto", 0) < .3 and texto.count("!") >= 2:
            avisos.append("o projeto quase não usa exclamação nas amostras reais")
    r = dict(perfil=slug, tipo=tipo, aprovado=not erros, erros=erros, avisos=avisos)
    print(json.dumps(r, ensure_ascii=False, indent=1))
    return r


def main():
    a = sys.argv[1:]
    if len(a) < 3 or a[0] not in ("analisar", "checar"):
        print(__doc__)
        return
    if a[0] == "analisar":
        analisar(a[1], a[2], "--gravar" in a)
    else:
        tipo = a[a.index("--tipo") + 1] if "--tipo" in a else "legenda"
        texto = sys.stdin.read() if a[2] == "-" else Path(a[2]).read_text()
        r = checar(a[1], texto, tipo)
        sys.exit(0 if r["aprovado"] else 1)


if __name__ == "__main__":
    main()
