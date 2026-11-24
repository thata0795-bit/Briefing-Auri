# Reel 10 s: Movimento também é prevenção (take gerado no CapCut)

Take 720×1254 do CapCut, recortado (sem "CapCut AI") e reenquadrado para 1080×1920:
`ffmpeg -i take.mov -vf "crop=672:1194:24:60,scale=1080:1920,unsharp=5:5:0.6:5:5:0" -q:v 2 quadros/f_%04d.jpg`
Três frases, uma por terço do vídeo, no topo (teto claro): Fraunces 600 #3D2050 com palavra-chave em itálico #7B5B8E,
véu claro #F5F0F8 no alto para leitura, assinatura "DRA. FLAVIANE SÁ · FISIOTERAPIA E PILATES" pequena no topo.
Entrada por máscara subindo, saída com desfoque. Trilha ambiente original (../pilates-homens/trilha.wav), -16 LUFS.

## Versão 2 (qualidade)
- Take tratado fora do navegador: `ffmpeg -i take.mov -vf "crop=672:1194:24:60,nlmeans=s=1.8:p=5:r=11,scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,cas=0.6,eq=contrast=1.03:saturation=1.06" -crf 10 tratado.mp4`
- Textos em camada transparente: `node .claude/skills/estudio-criativo/scripts/anima.mjs overlay.html --dur 10 --saida overlay.mov --alfa`
- Composição: overlay sobre o vídeo tratado (zoom lento 3%), x264 crf 15, trilha -16 LUFS.
- Última frase embaixo, em #F5F0F8 com itálico #C9B3D6 sobre degradê roxo da marca, e botão "LINK NA BIO".

## Versão 3 (vídeo real do estúdio, aprovada para envio)
Vídeo real enviado pela Thauana (senhor na chair, 23 s, 1080×1920): usados os primeiros 15 s, tratados com
`fps=30,nlmeans=s=1.4:p=5:r=9,cas=0.5,eq=contrast=1.04:saturation=1.03`. Camada de texto overlay15.html (tempos de 15 s):
frases do topo alinhadas à esquerda (88 px) para não cobrir a cabeça do aluno; "caminham / juntos." em duas linhas.
