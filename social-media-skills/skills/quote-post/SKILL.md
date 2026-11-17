---
name: quote-post
description: >
  Fluxo em duas etapas para criar posts de frase no LinkedIn. O assistente redige frases curtas e originais para acompanhar uma legenda e depois produz um prompt do Gemini que recria uma imagem de referência com a frase escolhida aplicada. Use esta skill sempre que a pessoa disser "post de frase", "arte de frase", "post motivacional", "monte uma frase", ou quiser uma arte de LinkedIn de baixo esforço e alto engajamento. Otimizada para o público de profissionais e de início de carreira do LinkedIn, que tende a preferir conteúdo motivacional.
---

# Post de Frase

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Estado de conclusão visual

Os prompts de imagem desta skill ficam **prontos para uso como prompt**, não são imagens geradas nem revisadas visualmente. Mantenha o fluxo com o Gemini, a menos que a pessoa peça outro gerador. A falta de um serviço de imagem não impede escrever o prompt. Quando houver imagens fornecidas ou geradas, abra e inspecione cada exportação em tamanho real e em tamanho de feed (cerca de 360px de largura, 320px para thumbnails). Confira o texto exato, as dimensões, cortes, legibilidade, cores da marca, aparência das fontes, logos e fidelidade à referência. Corrija e inspecione de novo as exportações com problema. Registre como pendente qualquer exportação ou inspeção que não foi possível fazer. Um prompt de imagem ou uma exportação rasterizada não é um arquivo de design editável.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma.

## Passo 1. Receba a legenda

Peça:

> Cole a legenda que esta frase vai acompanhar. A frase deve reforçar a mensagem da legenda.

Espere a legenda.

## Passo 2. Gere opções de frase

Entregue 9 opções de frases motivacionais originais, agrupadas em 3 categorias de 3 frases cada:

- **Categoria 1: Crescimento e transformação** (ex.: "Você não encontra tempo. Você cria.")
- **Categoria 2: Resiliência e garra** (ex.: "O seu tropeço é o ponto de partida de alguém.")
- **Categoria 3: Contrária / ousada** (ex.: "Pare de pedir permissão para começar.")

Toda frase deve:

- Ter menos de 15 palavras
- Soar humana e autêntica, não corporativa
- Evitar jargão ou linguagem técnica demais
- Funcionar sozinha, sem contexto
- Bater forte nas 3 primeiras palavras

Formato de entrega:

```
OPÇÕES DE FRASE para a sua legenda

1. Crescimento e transformação
   a. [frase]
   b. [frase]
   c. [frase]

2. Resiliência e garra
   a. [frase]
   b. [frase]
   c. [frase]

3. Contrária / ousada
   a. [frase]
   b. [frase]
   c. [frase]
```

Depois pergunte:

> Qual funciona melhor para o seu público? Responda com o número e a letra (ex.: 2b) ou cole sua própria frase se nenhuma acertou.

## Passo 3. Receba a imagem de referência

Depois que a pessoa escolher a frase, peça:

> Cole ou descreva a imagem de referência que você quer recriar. Pinterest, LinkedIn ou Google Imagens, tudo funciona. Se não tiver uma, eu sugiro um estilo.

Se a pessoa descrever um estilo em vez de enviar uma imagem, recomende:

- Estilo **caderno / desenhado à mão** (rascunho simples, fundo creme, traços de caneta)
- **Editorial minimalista** (tipografia serifada grande, muito espaço em branco, uma cor de destaque)
- **Pôster ousado** (sem serifa pesada, fundo em bloco de cor sólida, alto contraste)
- **Polaroid ou foto analógica** com texto sobreposto

## Passo 4. Entregue o prompt do Gemini

Entregue o prompt a seguir em um bloco de código, com a frase preenchida:

```
Recrie a imagem de referência em anexo com a seguinte frase:

"[FRASE ESCOLHIDA]"

Restrições essenciais:
- Saída com exatamente 1080 x 1350 pixels (vertical 4:5)
- Siga o estilo, a tipografia e a paleta de cores da imagem de referência
- Mantenha a frase como ponto focal, centralizada e legível
- Para uma frase original, não use atribuição inventada. Para uma frase com fonte, mantenha a atribuição verificada aprovada no briefing.
- Mantenha o tom visual do original, mas com o texto novo

A frase deve estar com ortografia e pontuação perfeitas, exatamente como escrita acima.
```

Diga à pessoa:

> Cole isto em uma conversa nova do Gemini com a imagem de referência anexada. Modo Criar imagem, modelo Nano Banana, saída em 1080x1350.

## Passo 5. Expectativa honesta

Depois do prompt, acrescente:

> O prompt está pronto. O desempenho com o seu público só se confirma depois de testar nos seus próprios posts.

## Regras

- Sempre gere em 1080x1350. Artes de frase na horizontal se perdem no feed do LinkedIn.
- Nunca permita mais de 15 palavras na frase final. Frases mais longas perdem legibilidade.
- Nunca invente atribuição. As frases são escritas do zero, não tiradas de pessoas reais, a menos que a pessoa peça.
- Nunca use travessões em nada que você entregar.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Ajuste as opções de frase à voz da pessoa se o voice.md existir.
- Se a voz da pessoa for explicitamente não motivacional (analítica, só contrária, seca), sinalize o desencontro e pergunte se posts de frase combinam com o posicionamento dela antes de gerar.
