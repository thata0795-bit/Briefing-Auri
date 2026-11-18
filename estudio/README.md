# Estúdio Criativo

Agente de vídeo, design e copy da agência Taynara Castro, da Auri Studio e do perfil pessoal da Thauana.

## Como usar
No Claude Code, dentro deste repositório:
- `/estudio-criativo` + o pedido (ex.: "/estudio-criativo edita esses takes do provador num Reels cinematográfico para a Katiusce"), ou
- só peça normalmente: o agente `estudio-criativo` e a skill de mesmo nome são acionados quando o pedido é de vídeo, design ou copy.

Mande o material junto (takes, fotos, música, roteiro, referências). O agente identifica o cliente, carrega o perfil, produz, confere e entrega.

## Onde fica a memória de cada cliente
`estudio/clientes/<slug>/`
- `perfil.json`: voz, paleta, fontes, regras visuais, look e transições de vídeo, pendências.
- `voz.md`: guia de voz escrito com exemplos reais e correções.
- `referencias/`: imagens de referência aprovadas + `ficha.json`/`ficha.png` gerados pelo agente.
- `logo/`, `fontes/` (arquivos de fonte que não estão no Google Fonts), `aprovados/` (peças aprovadas que viram referência).

Perfis atuais:
| slug | status | o que falta |
|---|---|---|
| `thauana` | confirmado | hex exato do vinho, legendas antigas para medir a voz |
| `auri-studio` | confirmado | logo SVG, referências, arquivo da fonte Sloop |
| `katiusce` | rascunho | público, paleta, logo, referências, legendas aprovadas |
| `flaviane-sa` | rascunho | @, paleta, logo, referências, legendas aprovadas |
| `josimar-easycont` | rascunho | segmento (provável contabilidade), identidade, referências, legendas |
| `luana-personal-chef` | rascunho | identidade, referências, legendas |
| `libercar` | rascunho | segmento, identidade, referências, legendas |
| `lindas` | rascunho | segmento, identidade, referências, legendas |
| `vovo-formiga` | rascunho | confirmar confeitaria, identidade, referências, legendas |
| `auto-ja` | rascunho | confirmar repasse de veículos, identidade, referências, legendas |
| `encantarte` | rascunho | não está na lista de clientes da agência; mantido por constar na skill de edição |

Para completar um perfil, mande ao agente: logo, manual de marca (se houver), 6 a 12 referências visuais e 5 a 15 legendas que o cliente aprovou. Cliente novo com o formulário da Auri: cole o texto do botão "Copiar" e peça para cadastrar.

## Ferramentas (em `.claude/skills/estudio-criativo/scripts/`)
- `perfil.py`: identifica o cliente pelo pedido, cria perfil, importa o briefing do formulário, tira cores do logo.
- `cinema.py`: edição cinematográfica (14 transições, 8 looks de cor com LUT gerada da paleta da marca, rampa de velocidade, movimento de câmera, textura de película, tipografia animada com as fontes da marca, corte na batida, sound design gerado, -14 LUFS).
- `referencias.py`: mede as referências do cliente e dá nota de fidelidade para cada peça.
- `render.mjs`: HTML → PNG, SVG e PDF com as cores e fontes do cliente.
- `voz.py`: mede o tom de voz em textos reais e revisa a copy (travessão, clichê, isca, palavra proibida, ritmo).
