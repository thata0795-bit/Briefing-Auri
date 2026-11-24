# Vídeo cinematográfico

Motor: `scripts/cinema.py`. Para Reels de fala (talking head com roteiro) a limpeza de áudio, corte de silêncio, escolha do melhor take e legenda palavra a palavra continuam na skill `agente-edicao-video`; depois passe o resultado por `cinema.py --acabamento` para ganhar look, textura de película e loudness da marca. Montagens (produto, bastidor, evento, coleção, antes e depois, institucional, abertura) são feitas inteiras no `cinema.py`.

## O que separa cinematográfico de genérico

1. **Decupagem antes de editar.** Assista ao material pelos quadros (`--quadros` ou `ffmpeg ... tile`) e classifique cada plano: plano aberto (contexto), médio (ação), close (emoção), detalhe (textura, produto, mãos). Monte em escala: abre largo, aproxima, fecha em detalhe, respira largo de novo. Dois planos do mesmo tamanho em sequência só se houver ação diferente.
2. **Arco de três atos, mesmo em 15 segundos.** Gancho (0 a 2 s, a imagem mais forte ou mais estranha), desenvolvimento (ritmo crescente, cortes cada vez mais curtos), clímax (a peça, o resultado, a frase), resolução (cartela ou plano que respira, 1,5 a 2,5 s).
3. **Ritmo pela música.** Rode `--batidas musica.mp3`. Cortes caem nas batidas fortes; transições elaboradas ficam nas viradas de frase musical (a cada 4 ou 8 batidas), nunca em todos os cortes. O motor já encaixa o fim das cenas na batida mais próxima quando há `musica`.
4. **Transição tem motivo.** Use a elaborada quando muda o assunto, o tempo ou o lugar. Dentro da mesma ideia, corte seco ou match cut (movimento ou forma continuando de um plano para o outro). Regra do motor: nunca repete a mesma transição em sequência e a cada 3 passagens uma é corte seco.
5. **Movimento em tudo.** Nenhum plano parado: `push_in` lento em emoção, `push_out` para revelar, `pan_e`/`pan_d` em produto, `tilt` em look de corpo inteiro, `parallax` em foto, `tremor` em bastidor e energia, `respira` em fala. Varie entre planos vizinhos.
6. **Rampa de velocidade** no momento de impacto: `"rampa": [[0,1],[0.45,0.3],[0.7,0.3],[1,1.8]]` desacelera no gesto e acelera na saída. Ideal em giro de saia, cabelo, tecido, água, salto, mão no produto.
7. **Cor com intenção.** O look vem do perfil (`video.look`). `marca` faz split toning com a paleta do cliente (sombras no tom escuro, altas no destaque) e é o caminho mais fiel à identidade. Nunca misture looks dentro de um vídeo sem motivo narrativo (ex.: antes em `noir`, depois no look da marca).
8. **Textura de película** dá acabamento caro: grão, halation (brilho quente nas altas), vinheta, aberração cromática sutil, barras de cinema opcionais. Saúde e serviço clínico pedem textura quase zero; moda, beleza e lifestyle aceitam mais.
9. **Tipografia em movimento** com as fontes da marca: `revelar` (máscara sobe), `tracking` (letras se aproximam, padrão trailer), `foco` (entra desfocado), `palavras` (palavra por palavra no ritmo), `maquina` (letra a letra). Uma animação por vídeo, no máximo duas. Texto curto: 2 a 5 palavras por tela.
10. **Som desenhado.** O motor gera whoosh nas transições de movimento, brilho no vazamento de luz, impacto na cartela, glitch no glitch. A música abaixa sozinha quando há fala (sidechain) e o master sai em -14 LUFS. Silêncio de 0,3 s antes do clímax funciona melhor que qualquer efeito.

## Catálogo de transições (`python3 cinema.py --looks`)

| Transição | Quando usar | Combina com |
|---|---|---|
| `luz` | virada emocional, abertura, lifestyle, moda, beleza | editorial, filme_quente, marca |
| `queima` | passagem de tempo, nostalgia, bastidor | kodak_dourado, filme_quente |
| `tinta` | revelação delicada, beleza, saúde, marca orgânica | todos, principalmente clean e editorial |
| `zoom` | entrar no detalhe, energia, antes e depois | dinâmico, moda, produto |
| `chicote` / `chicote_d` | troca rápida de look, lugar ou produto | dinâmico, moda |
| `giro` | virada de bloco com energia, festa | dinâmico, infantil |
| `prisma` | tecnologia, sonho, transformação | tech, beleza |
| `glitch` | tech, humor, quebra de expectativa (nunca em saúde ou luxo) | tech |
| `cor` | mergulho na cor da marca antes de cartela ou CTA | qualquer marca com cor forte |
| `flash` | impacto, revelação de produto, batida forte | dinâmico |
| `fade` | respiro neutro | clean |
| `respiro` | fechamento, emoção, final de história | editorial |
| `corte` | dentro da mesma ideia, na batida | todos |

## Fluxo

1. `python3 scripts/perfil.py resumo <slug>` e leia o bloco VÍDEO e as regras visuais.
2. `python3 scripts/cinema.py --setup <slug>` (1x por sessão; baixa as fontes do perfil).
3. Decupe: duração e quadros de cada arquivo (`ffprobe`, `--quadros arquivo.mp4 0 <dur> 8 tira.jpg` e Read na tira).
4. Se houver música: `--batidas`, escolha o trecho (`musica.inicio`) onde a energia combina com o arco.
5. Escreva `projeto.json` e renderize. Confira `*_contato.jpg`, o relatório (LUFS perto de -14, sem quadros pretos) e cada transição com `--quadros final.mp4 <corte-0.1> <corte+0.8> 7 t.jpg`.
6. Corrija o que estiver feio, cortado, ilegível ou fora da paleta, re-renderize, e só então envie com SendUserFile.

## projeto.json

```json
{
  "cliente": "katiusce",
  "saida": "saida/colecao.mp4",
  "formato": "9:16",
  "look": "marca",
  "musica": {"arquivo": "trilha.mp3", "inicio": 12.0, "volume": 0.9, "sincronizar": true},
  "textura": {"grao": 0.5, "halation": 0.45, "vinheta": 0.3, "aberracao": 0.15, "barras": false},
  "cenas": [
    {"arquivo": "fachada.mov", "ini": 1.2, "fim": 3.0, "movimento": "push_in",
     "texto": {"conteudo": "Coleção Inverno", "estilo": "tracking", "pos": "centro"}},
    {"arquivo": "provador.mov", "ini": 0.5, "fim": 2.4, "movimento": "tilt", "transicao": "luz"},
    {"arquivo": "giro_saia.mov", "ini": 2.0, "fim": 4.5, "rampa": [[0,1],[0.45,0.3],[0.75,0.3],[1,1.8]], "transicao": "zoom"},
    {"imagem": "detalhe_tecido.jpg", "dur": 1.8, "movimento": "parallax", "transicao": "chicote"},
    {"arquivo": "cliente_espelho.mov", "fim": 2.5, "movimento": "respira", "audio": true, "transicao": "tinta",
     "texto": {"conteudo": "feita para você", "estilo": "revelar", "pos": "terco"}},
    {"cartela": "Katiusce", "sub": "condicional e crediário", "dur": 2.2, "animacao": "foco", "transicao": "cor"}
  ]
}
```

Campos de cena: `arquivo` (vídeo) ou `imagem` ou `cartela`; `ini`, `fim`, `velocidade`, `rampa`, `movimento` (push_in, push_out, pan_e, pan_d, tilt, parallax, tremor, respira, nenhum), `intensidade` (sutil, normal, forte), `enquadre` (preencher, caber), `look`, `audio` (true mantém a fala/ambiente do clipe), `transicao` (para a próxima cena; `auto` ou ausente escolhe da lista do perfil), `dur_transicao`, `texto` ou `textos` (lista) com `conteudo`, `estilo`, `pos` (topo, centro, terco, baixo), `em`, `dur`, `sub`, `cor`. Cartela: `cartela`, `sub`, `dur`, `fundo`, `cor_texto`, `animacao`.
Projeto: `cliente`, `formato` (9:16, 4:5, 1:1, 16:9, 2.39:1), `look`, `movimento`, `transicoes` (lista de preferência), `dur_transicao`, `cortes_secos` (true), `musica`, `audio_cenas`, `textura`, `sfx` (true), `sfx_corte`, `paleta`/`fontes` (sobrescrevem o perfil), `manter_tmp`.

## Motion design (chamadas, datas comemorativas, lançamentos)
Quando o material é foto, logo e texto (sem takes), monte cada cena como HTML/CSS animado e grave com
`node scripts/anima.mjs cena.html --hash <id> --dur <s> --saida cenas/<id>.mp4 --cliente <slug>` (quadro a quadro, sem perda).
Depois una as cenas no `cinema.py` (cada cena vira um `arquivo`, `movimento: nenhum`, `look: natural` para preservar a paleta).
Exemplo completo: `estudio/clientes/luana-personal-chef/projetos/natal-2026/`.
Ideias que funcionam: foto em arco ou janela com Ken Burns ou panorâmica, moldura dourada que se desenha, texto subindo por máscara,
rótulo em caixa alta com tracking, brilho percorrendo texto dourado, partículas de luz em canvas (`window.cena(t)`).

## Qualidade com take gerado por IA ou vídeo real
Nunca passe o vídeo pelo navegador (JPEG duas vezes perde qualidade). Trate o take no ffmpeg (nlmeans leve, scale lanczos,
cas 0.5 a 0.7) e grave só os textos com `anima.mjs --alfa` (camada transparente .mov), depois una com `overlay` e x264 crf 14 a 16.
Marca d'água do gerador (ex.: "CapCut AI"): recorte mínimo e reenquadre; avise para marcar "Informações de IA" ao publicar.

## Texto atrás da pessoa (efeito em camadas)
Recorte a pessoa quadro a quadro com rembg (`u2net_human_seg`, limpando para a maior silhueta; modelos BiRefNet estouram a memória),
grave o texto de trás e o da frente em duas camadas `--alfa` e monte com `scripts/compor_camadas.py` (fundo, texto de trás, pessoa, texto da frente).
Deixe a palavra-chave fora da área do corpo: a pessoa pode cobrir só a borda de uma linha, nunca a frase inteira.
Limite: em vídeo de celular com movimento, o recorte pisca e distorce bordas e aparelhos (reprovado pela Flaviane). Use só com fundo simples e pessoa bem destacada; na dúvida, texto por cima sem camadas.

## Figura humana realista
Para corpo humano (postura, saúde, fitness, anatomia) use o boneco 3D de `modelos/humano3d/` (homem realista com rosto, articulado,
licença CC0). Nunca desenhe humano com formas 2D: fica caricato. Postura, giro e marcações por articulação estão no LEIAME de lá.

## Narração
Voz neural offline (Kokoro): `pip install kokoro-onnx soundfile` e os arquivos `kokoro-v1.0.onnx` e `voices-v1.0.bin`
(releases do GitHub thewh1teagle/kokoro-onnx, model-files-v1.0) em /tmp/kokoro. Voz feminina pt-BR: `pf_dora` (masculinas: `pm_alex`, `pm_santa`), speed 0.92.
Gere uma fala por cena, apare o silêncio das pontas e posicione com adelay. Mix: voz com highpass e presença, trilha com sidechain, -14 LUFS.
O serviço de voz da Microsoft (edge-tts) é bloqueado pela rede deste ambiente. Revise as falas com `voz.py checar` antes de gerar.

## Regras de marca no vídeo
- Paleta, fontes, look e transições vêm sempre do perfil do projeto. A paleta oliva e areia é só da Auri.
- Texto na tela segue as regras de copy: nada de travessão, segunda pessoa quando é a marca falando com o público dela.
- Cliente de saúde: nada de glitch, prisma ou efeitos agressivos; textura mínima; legibilidade acima de tudo.
- Ao final, diga em uma linha: para qual projeto editou, look e transições usadas, e avisos reais (material com pouca luz, música sem batida clara, take tremido).
