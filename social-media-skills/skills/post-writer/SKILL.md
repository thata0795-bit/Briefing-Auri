---
name: post-writer
description: >
  Escreve posts de LinkedIn que seguem o sistema de voz da pessoa (about-me.md e voice.md). Use esta skill sempre que a pessoa disser "escreva um post", "rascunhe um post", "post de LinkedIn", "post sobre [tema]", "ideia de conteúdo", ou quiser ajuda para escrever qualquer conteúdo de LinkedIn. Acione também quando a pessoa colar um despejo de contexto (anotações, transcrições, tópicos) e quiser transformá-lo em post. Sempre consulta os arquivos de voz do projeto antes de escrever. Sempre entrega o post final em um bloco de código.
---

# Redator de Posts

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Assim que esta skill for acionada, vá direto para o Passo 1. Não resuma a skill. Não explique o que ela faz. Não liste os arquivos que ela consulta. Comece a coletar as informações imediatamente.

## Passo 1. Colete as informações

Procure about-me.md e voice.md no projeto. Leia os dois. Se algum estiver faltando, diga à pessoa para rodar primeiro a skill Voice Builder ("diga construa minha voz") e pare.

Se os dois existirem, use estas perguntas (adapte o esquema da ferramenta se necessário):

```json
[
  {
    "question": "Sobre qual tema você quer postar?",
    "header": "Tema",
    "multiSelect": false,
    "options": [
      {"label": "Colar um despejo de contexto", "description": "Tenho anotações, transcrições ou ideias soltas para virar post"},
      {"label": "Já tenho um tema", "description": "Vou digitar o tema em seguida"},
      {"label": "Sugira temas para mim", "description": "Com base no meu sistema de voz, sugira 5 temas para eu postar"}
    ]
  },
  {
    "question": "Você tem posts de referência para eu usar como inspiração de estrutura?",
    "header": "Referências",
    "multiSelect": false,
    "options": [
      {"label": "Sem referências", "description": "Escreva do zero usando só meus arquivos de voz"},
      {"label": "Vou colar exemplos", "description": "Tenho posts de outros criadores para você estudar antes"},
      {"label": "Use meus posts de treino", "description": "Use como referência os posts que usei no Voice Builder"}
    ]
  }
]
```

Com base nas respostas:
- "Colar um despejo de contexto": espere a pessoa colar, extraia a ideia central e siga para o Passo 2
- "Já tenho um tema": espere a pessoa digitar e siga para o Passo 2
- "Sugira temas para mim": leia os pilares de conteúdo do about-me.md e o voice.md, sugira 5 temas específicos com um ângulo de uma linha para cada e use o AskUserQuestion para a pessoa escolher um
- "Vou colar exemplos": espere os posts de referência, anote os padrões de estrutura e siga
- "Use meus posts de treino": leia os posts de treino confirmados do autor pretendido, não rascunhos sem relação nem arquivos de outro cliente

## Passo 2. Pesquise e planeje

Primeiro leia as evidências fornecidas e a estrutura de referência pedida. Se elas sustentam a tarefa, use-as sem acrescentar pesquisa externa desnecessária. Verifique afirmações adicionais quando necessário; fontes indisponíveis deixam essas afirmações pendentes. Procure:
- Dados ou estatísticas que sustentem o ângulo
- Opiniões contrárias ou fatos surpreendentes
- Exemplos reais ou estudos de caso
- Equívocos comuns para contestar

Depois apresente um plano de post. Chame o AskUserQuestion:

```json
[
  {
    "question": "Qual ângulo funciona melhor para este post?",
    "header": "Ângulo",
    "multiSelect": false,
    "options": [
      {"label": "[Nome do ângulo 1]", "description": "[Uma frase descrevendo o ângulo e o gancho]"},
      {"label": "[Nome do ângulo 2]", "description": "[Uma frase descrevendo o ângulo e o gancho]"},
      {"label": "[Nome do ângulo 3]", "description": "[Uma frase descrevendo o ângulo e o gancho]"}
    ]
  },
  {
    "question": "Qual framework você quer?",
    "header": "Framework",
    "multiSelect": false,
    "options": [
      {"label": "PAS", "description": "Problema, Agitação, Solução"},
      {"label": "Lista de passos", "description": "Passos ou dicas numerados"},
      {"label": "Da história à lição", "description": "História pessoal com um aprendizado"},
      {"label": "Opinião contrária", "description": "Contestar uma crença comum"}
    ]
  }
]
```

Preencha as opções de ângulo reais com base na pesquisa do tema. Não use texto genérico nas descrições dos ângulos.

## Passo 3. Escreva o rascunho

Escreva o post seguindo estas regras:
- Leia o voice.md para tom, ritmo, estilo de gancho, estilo de CTA e a seção de padrões de ausência (o que a voz nunca faz)
- Leia o about-me.md para o contexto de público e tema
- Acompanhe o tamanho das frases e o ritmo dos parágrafos do voice.md
- Evite toda palavra, estrutura e padrão proibidos listados na seção de ausência do voice.md
- Use o padrão de gancho que combina com o ângulo escolhido
- Feche com o estilo de CTA do voice.md

Entregue o post dentro de um bloco de código simples:

```
[O post completo vai aqui, com todas as quebras de linha e formatação exatamente como devem aparecer no LinkedIn]
```

Depois do bloco de código, acrescente 2 a 3 frases sobre por que você escolheu esse gancho e essa estrutura, citando padrões específicos do voice.md.

Antes de apresentar o rascunho, revise-o você mesmo comparando com os fatos fornecidos, a voz e o formato pedido. Para uma legenda de lista ou de passos, associe cada item obrigatório ao trecho correspondente da legenda e confira ordem, duplicidades e omissões. Não troque a estrutura pedida por um framework genérico de post. Mantenha as notas de fonte separadas do texto pronto para colar. O Claude não é revisor obrigatório no Codex.

## Passo 4. Itere

Pergunte à pessoa:

> O que achou? Me diga o que mudar, ou diga "pode publicar" e eu salvo a versão final.

Se a pessoa der feedback, revise e entregue um novo bloco de código. No máximo 3 rodadas de revisão.

Se a pessoa disser "pode publicar" ou algo equivalente, salve o post final como arquivo markdown no projeto.

Depois diga:

> Post salvo. Diga "crie uma arte" para criar um visual, ou "avalie meu post" para receber feedback antes de publicar.

## Regras

- Sempre leia about-me.md e voice.md antes de escrever.
- Sempre entregue os posts em um bloco de código simples.
- Nunca use travessões em nenhum post.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Não acrescente hashtags, a menos que o voice.md as use explicitamente.
- Não acrescente CTAs de isca de engajamento, a menos que apareçam no voice.md.
- Mantenha os posts entre 150 e 300 palavras, a menos que a pessoa peça outra coisa.
- Planeje antes de escrever. Nunca pule o Passo 2.
