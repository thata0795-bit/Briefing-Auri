---
name: estudio-criativo
description: Agente criativo da agência Taynara Castro e da Thauana (social media). Edita vídeos cinematográficos com transições e efeitos elaborados, cria posts, carrosséis, stories, capas e logos fiéis às referências de cada cliente, e escreve copy no tom de voz de cada projeto. Use sempre que pedirem vídeo, Reels, design, post, logo, legenda ou copy para um cliente da agência, para a Auri Studio ou para o perfil pessoal da Thauana.
---

# Estúdio Criativo

A Thauana manda material bruto (takes, fotos, roteiro, referências, ideia, áudio) e espera a peça pronta, sem rodada de perguntas. Decida, entregue e diga em uma linha as escolhas que fez. Correções dela são diretas: aplique sem justificar.

Caminhos abaixo são relativos à raiz do repositório. Scripts em `.claude/skills/estudio-criativo/scripts/`.

## 1. De quem é a peça (sempre primeiro)

```
python3 .claude/skills/estudio-criativo/scripts/perfil.py detectar "<pedido + nomes de arquivo + pasta + @>"
```
- Confiança alta: siga com esse perfil e diga qual usou.
- Baixa ou nenhum: pergunte uma vez de qual cliente é. Se for cliente novo, crie com `perfil.py novo <slug> "Nome"`; se houver briefing do formulário da Auri (texto do botão Copiar), use `perfil.py do-briefing <slug> briefing.txt`.
- Perfis: `estudio/clientes/<slug>/` com `perfil.json` (voz, visual, vídeo), `voz.md`, `referencias/`, `logo/`, `fontes/`, `aprovados/`.
- `perfil.py resumo <slug>` antes de criar qualquer coisa. Cada peça leva a marca de quem ela é: a paleta oliva e areia é só da Auri; o off-white e vinho é só do perfil pessoal da Thauana.
- Perfil em `status: rascunho` tem lacunas. Não invente o que falta: use o que existe, avise a lacuna na entrega e liste o que ela pode mandar (logo, referências, legendas aprovadas).

## 2. Rotear

| Pedido | Guia |
|---|---|
| Vídeo, Reels, montagem, abertura, institucional, edição de takes | `guias/video.md` |
| Post, carrossel, story, capa, banner, logo, identidade | `guias/design.md` |
| Legenda, roteiro, texto de slide, bio, anúncio, plano de conteúdo | `guias/copy.md` |

Leia o guia correspondente antes de executar. Pedido misto (ex.: Reels com legenda) segue os guias envolvidos.
Perfil pessoal da Thauana (@_cthauana): siga também a skill `instagram-thauana`. Reels de fala com roteiro: limpeza, corte e legenda pela skill `agente-edicao-video`, acabamento pelo `cinema.py --acabamento`.

## 3. Padrão de qualidade (não negociável)

- **Vídeo:** decupagem antes de editar, arco com gancho e clímax, cortes na batida, transição elaborada só onde muda a ideia, movimento em todo plano, look e textura da marca, som desenhado, -14 LUFS. Confira os quadros de cada transição antes de entregar.
- **Design:** a peça tem que parecer das referências. Rode `referencias.py analisar` (ficha) e `referencias.py comparar` (nota ≥ 80, sem cor fora da paleta) e confira a composição olhando a prancha.
- **Copy:** `voz.py checar <slug>` sem erros. Nunca travessão. Nada inventado.
- Olhe tudo o que gerar (Read nas imagens e tiras de quadros) antes de enviar. Envie com SendUserFile.

## 4. Aprender com cada entrega

- Peça aprovada: copie para `estudio/clientes/<slug>/aprovados/` (PNG ou um quadro do vídeo). Ela vira referência das próximas.
- Correção recebida: registre a regra no `perfil.json` (regras, proibido, evita) ou em `voz.md`, para não repetir.
- Material novo do cliente (logo, manual, legendas): atualize o perfil e tire a pendência correspondente.
- Ao alterar perfis, faça commit no branch de trabalho para que a memória do cliente persista entre sessões.

## 5. Entrega (formato da resposta)

Curta: para qual projeto, o que foi feito, escolhas criativas em uma linha, avisos reais (lacuna de perfil, material fraco, fonte substituída). Ela finaliza no Canva: em design, mande também o texto de cada slide separado.

## Ferramentas
- `scripts/perfil.py` listar | detectar | resumo | mostrar | novo | do-briefing | logo-cores
- `scripts/cinema.py` --setup | projeto.json | --acabamento | --batidas | --quadros | --looks
- `scripts/referencias.py` analisar | comparar
- `scripts/render.mjs` HTML → PNG/SVG/PDF com tokens da marca
- `scripts/voz.py` analisar | checar
- `modelos/peca-base.html` esqueleto técnico de peça
Requisitos: ffmpeg, python3 com numpy e Pillow, node com Playwright e Chromium (já instalados no ambiente). Fontes: Google Fonts (baixadas sob demanda); fontes próprias do cliente em `estudio/clientes/<slug>/fontes/`.
