---
name: reels-scripting
description: >
  Transforma um Reel de referência do Instagram em roteiro para o seu próprio Reel, ajustado à sua voz e reaproveitando conteúdo da sua newsletter. Recebe a URL de um Reel ou um link de referência do Notion, usa o Apify para coletar o vídeo, envia ao Gemini 2.5 Flash para transcrição completa e análise de gancho e estrutura, e depois escreve um roteiro novo aplicando os mesmos padrões ao tema da sua newsletter. Use esta skill sempre que a pessoa disser "roteirize um reel", "roteiro de reels", "transforme isso em reel", colar a URL de um Reel do Instagram, ou mencionar sua base de reels fora da curva no Notion. O caminho de URL até análise de vídeo precisa de APIFY_API_TOKEN e GOOGLE_AI_API_KEY; material fornecido pode pular as etapas correspondentes.
---

# Roteiro de Reels

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma.

## Pré-requisitos

O caminho completo de análise de vídeo com Apify + Gemini precisa de:

- Variável de ambiente `APIFY_API_TOKEN` (coleta no Instagram)
- Variável de ambiente `GOOGLE_AI_API_KEY` (análise de vídeo com Gemini 2.5 Flash)
- Node.js 18+ e os pacotes `apify-client` e `@google/generative-ai`

Verifique só as capacidades necessárias para o caminho escolhido. Para extração por URL e análise de vídeo no Gemini, confirme que as credenciais da pessoa estão presentes sem exibi-las, depois confirme que o provedor e o modelo estão disponíveis. Credenciais ou pacotes ausentes, vídeo privado ou modelo indisponível deixam aquela etapa pendente. Explique o que falta; não altere a configuração da conta nem troque de provedor em silêncio.

Um vídeo fornecido pode pular o Apify. Uma transcrição ou análise fornecida pode pular os Passos 3 e 4 e sustentar, no Passo 5, um roteiro marcado como baseado em transcrição, mas isso não é um resultado de análise de vídeo do Gemini. Reaproveite pacotes instalados; consulte a documentação oficial atual dos SDKs e do actor antes de gerar um script auxiliar, e peça a aprovação da pessoa antes de gerar custos com provedores.

## Passo 1. Receba a referência

Pergunte:

> Cole a URL do Reel de referência ou o link do Notion. É o Reel fora da curva cujo formato você quer destrinchar.

Espere a URL.

Se a pessoa colar um link do Notion, leia por um conector do Notion autorizado e disponível, localize a URL do Reel do Instagram na página e extraia. Se não houver URL de Reel na página do Notion, peça para a pessoa colar a URL do Reel diretamente.

## Passo 2. Receba o tema da newsletter

Pergunte:

> Qual tema da sua newsletter você quer reaproveitar neste Reel? Cole o trecho da newsletter ou escreva a ideia central em uma frase.

Espere o tema. Leia newsletter-voice.md, voice.md e about-me.md do projeto, se existirem, para que o roteiro siga a voz da pessoa.

## Passo 3. Colete e baixe o Reel

Use uma pasta nova `outputs/reels/<slug>/` no projeto escolhido. Reaproveite um script auxiliar adequado se já existir; caso contrário, escreva ali um pequeno script Node.js específico para a tarefa que:

1. Use o `apify-client` e o caminho existente `apify/instagram-reel-scraper`, depois de conferir o esquema documentado atual, para o único Reel pedido. Nunca colete comentários, respostas ou conversas de comentários, nem por meio de `deepScrape` ou `numComments`. Confirme que o provedor permite coletar só post e vídeo antes de chamá-lo; caso contrário, peça o envio do vídeo. Não chute entradas alternativas de actor.
2. Extraia o `videoUrl` do item retornado.
3. Baixe o vídeo para `outputs/reels/<slug>/downloads/{username}_{shortCode}.mp4`.
4. Salve os dados brutos da coleta em `outputs/reels/<slug>/reel_data_{shortCode}.json`.

Rode o script. Confirme o tamanho do arquivo e os metadados (visualizações, curtidas, contagem agregada de comentários se houver, primeiros 200 caracteres da legenda) antes de continuar.

Um único Reel é uma referência, não um caso fora da curva comprovado. Chame de fora da curva apenas quando dados de comparação fornecidos ou pedidos explicitamente comprovarem o desempenho dele em relação aos posts recentes do mesmo criador; cite a amostra, o período e o múltiplo. Não invente essa base de comparação.

## Passo 4. Analise com o Gemini 2.5 Flash

Amplie o script Node (ou rode uma segunda etapa) que:

1. Lê o `.mp4` baixado em base64.
2. Chama `genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })`.
3. Envia o vídeo com exatamente este prompt:

```
Estou estudando este Reel para escrever meu próprio roteiro em um estilo parecido para o meu público de [PÚBLICO DO about-me.md].

## Transcrição completa
- Transcreva CADA palavra com marcações de tempo

## Gancho
- Primeiras palavras exatas faladas
- Número de palavras do gancho
- O que faz a pessoa parar de rolar o feed?

## Padrões de linguagem
- Tamanho médio das frases
- Proporção de você/seu contra eu/meu
- Transições entre os pontos
- Onde estão os minimizadores do tipo "é só"?

## Estrutura
- Duração total
- Divisão em seções com tempos
- Qual é o momento de antes e depois?
- Qual é o CTA?

## Um aprendizado-chave
- A técnica mais importante para aprender com este Reel
```

Salve a análise em `outputs/reels/<slug>/analysis_reference_{shortCode}.md`.

## Passo 5. Escreva o roteiro do novo Reel

Usando a análise do Passo 4, o tema da newsletter do Passo 2 e os arquivos de voz da pessoa, escreva um roteiro novo de Reel em `outputs/reels/<slug>/reel-[slug].md`.

Aplique estas regras (inegociáveis):

### Gancho
- Nunca abra com "Eu". Use "isto", "você", um fato ou um nome conhecido.
- Formatos comprovados: "Isto mudou... para sempre" / inversão negativa ("X é inútil a menos que...") / afirmação de capacidade.
- O gancho cria curiosidade ou quebra de padrão em até 3 segundos.
- Espelhe o número de palavras e a estrutura do gancho da análise de referência.

### Corpo
- Português do Brasil. Frases curtas. Sem travessões, sem ponto e vírgula.
- Use "você" e "é só" de forma coloquial ("é só você colocar...").
- Nunca junte três ou mais fragmentos entrecortados. Combine em uma frase fluida.
- Nunca declare a conclusão. Deixe os fatos fazerem o trabalho.
- Use CTA de comentário só se a pessoa tiver uma entrega real e uma automação confirmada funcionando. Caso contrário, use um próximo passo relevante que não prometa entrega.

### Palavra-gatilho de comentário (só quando houver suporte)
- Uma única palavra em maiúsculas (ROTEIRO, WIKI, PROMPTS, VIDEO).
- Precisa ter relação direta com o que está sendo prometido.
- Sem aspas, sem "aqui embaixo", sem pontuação no final.

### CTA
- "Comenta [PALAVRA] que eu te mando [coisa específica]"
- Curto. Sem enchimento do tipo "o link para o meu guia completo".

### Duração e estrutura
- Meta de 30 a 45 segundos no total.
- No máximo 2 pontos-chave, não 3.
- A legenda espelha o roteiro. Atualize os dois juntos.

### Estrutura do arquivo de roteiro

```
# Reel: [título]

## Análise de referência
- URL: [url do reel]
- Visualizações: [número]
- Técnica-chave: [da análise do Gemini]

## Meta de duração
30 a 45 segundos

## Gancho (0-3s)
[Palavras exatas]

## Ponto 1 ([início]-[fim]s)
[Palavras exatas]

## Ponto 2 ([início]-[fim]s)
[Palavras exatas]

## CTA ([início]-[fim]s)
[Próximo passo exato, com promessa de comentário só quando a entrega estiver confirmada]

---

## Legenda
[Espelha o roteiro, formatada para o Instagram]

## Palavra-gatilho de comentário (só se estiver configurada)
[PALAVRA ou não se aplica]

## Entrega (só se prometida)
[O recurso real disponível ou não se aplica]

---

## Notas visuais
[Cortes, ideias de B-roll, textos na tela]
```

## Passo 6. Ciclo de controle de qualidade

Revise você mesmo: precisão em relação à fonte (30), voz da pessoa (25), gancho e estrutura (20), duração falada e clareza (15), coerência entre legenda e CTA (10). Cite evidências para cada nota. Corrija as violações reais e avalie de novo, até três rodadas. A nota de corte é 95/100; se não for atingida, entregue um rascunho com os bloqueios específicos em vez de inflar a nota ou dizer que está pronto. Cronometre uma leitura em voz alta quando possível; caso contrário, marque a duração como estimada. O Claude não é obrigatório para esta revisão no Codex.

Violações comuns para conferir:
- Abre com "Eu"
- Fragmentos entrecortados em sequência de três ou mais
- Declara a conclusão
- Palavra-gatilho com várias palavras ou estilizada
- Duração acima de 45 segundos lido em voz alta
- 3 pontos em vez de 2
- Legenda não espelha o roteiro

## Passo 7. Entregue o roteiro

Entregue no projeto o roteiro revisado e a legenda correspondente, com a fonte de referência, o método de análise e qualquer verificação não resolvida. A pessoa pode gravar ou pedir explicitamente o fluxo de produção que ela tiver disponível. Esta skill pública não inclui avatar, edição nem fluxo de publicação.

## Regras

- Nunca pule a nota de corte de 95/100.
- Sempre leia voice.md e about-me.md antes de escrever. A aderência à voz é inegociável.
- Nunca invente métricas do Reel de referência. Use só metadados verificados, fornecidos ou coletados, e marque como indisponíveis as métricas ausentes.
- Português do Brasil. Sem travessões. Sem ponto e vírgula.
- Todo roteiro inclui a legenda correspondente; inclua palavra-gatilho de comentário só quando a entrega prometida funcionar.
- Se o acesso à referência falhar, informe em qual etapa falhou e ofereça receber o vídeo ou a transcrição. Não invente análise de vídeo.
- O modelo é o Gemini 2.5 Flash. Não troque sem a aprovação da pessoa.
