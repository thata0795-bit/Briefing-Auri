---
name: newsletter-voice
description: >
  Cria instruções de escrita para newsletter dentro de um projeto Codex ou Claude. Roda depois do voice-builder. Gera o newsletter-voice.md, um arquivo único que o assistente consulta ao redigir newsletters na voz da pessoa. Funciona com ou sem amostras de newsletter: se a pessoa tiver edições anteriores, a skill as analisa; se não tiver, a skill oferece 6 arquétipos ajustados à voz dela. Use esta skill sempre que a pessoa disser "construa minha voz de newsletter", "aprenda meu estilo de newsletter", "monte meu sistema de newsletter", "treine com minhas newsletters", "onboarding de newsletter", ou colar amostras de newsletter pedindo uma análise. Exige que o voice-builder já tenha rodado: a skill precisa do voice.md e do about-me.md no projeto para funcionar.
---

# Voz de Newsletter

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Verificação de pré-requisitos

Assim que esta skill for acionada, procure voice.md e about-me.md na raiz do projeto.

Se algum dos dois estiver faltando, diga:

> A voz de newsletter fica em cima do seu perfil de voz geral. Rode primeiro o voice-builder (suba a skill ou diga "construa minha voz") e volte aqui quando about-me.md e voice.md estiverem no projeto.

Então pare. Não continue até os dois arquivos existirem.

Se os dois existirem, leia ambos por inteiro e vá direto para o Passo 1.

## Passo 1. Verifique se há amostras

Pergunte no chat:

> Você tem 2 ou 3 edições anteriores de newsletter com as quais eu possa aprender?
>
> Sim: cole aqui (uma por mensagem ou todas de uma vez)
> Não: digite "arquétipo" e eu monto a partir de um modelo ajustado à sua voz

Espere a resposta.

Se a pessoa colar 2 ou mais newsletters, vá para o Passo 2a.
Se digitar "arquétipo", vá para o Passo 2b.
Se colar só 1 newsletter, peça pelo menos mais uma. Se ela só tiver uma, ofereça: "Uma amostra não basta para detectar padrões. Quer que eu mude para o modo arquétipo e use sua newsletter como referência?"

## Passo 2a. Análise baseada em amostras

Leia cada newsletter por inteiro. Procure padrões entre as edições, não manias isoladas. Extraia:

**Fórmula de abertura**
- O que as 3 primeiras frases fazem (resultado específico, observação cultural, afirmação, cena, pergunta)
- Tamanho da seção de abertura antes da primeira quebra estrutural
- Movimento de credibilidade (como o autor estabelece autoridade logo no início)
- Promessa de valor (o que o leitor ouve que vai receber)

**Estrutura das seções**
- Montagem do problema ou do contraste
- Framework nomeado ou prosa livre
- Passos numerados, métodos ou argumento contínuo
- Padrões de exemplos e evidências
- Seção bônus ou de extensão
- Fórmula de fechamento e assinatura

**Filosofia de dados**
- Números específicos por edição (conte)
- Estilo de atribuição de fontes (com link, nomeada, sem crédito)
- Proporção entre exemplos e abstração
- Reconhecimento de limitações ou fracassos

**Formatação**
- Uso de títulos (frequência, hierarquia)
- Uso de listas (numeradas, com marcadores, com setas)
- Uso de negrito e itálico
- Formatação de prompts, blocos de código ou citações
- Marcadores visuais (setas, checks, emojis, se houver)

**Tamanho**
- Faixa de contagem de palavras entre as amostras
- Contagem de palavras por seção

**Marcas de voz próprias do formato newsletter**
- Dicas ou destaques (frequência, formato)
- Fechamentos que olham para frente
- Frase de assinatura, se for consistente entre as amostras
- Metatransparência (o autor reflete sobre o processo ou pede feedback?)

**Sinais de ausência**
- Palavras, construções ou estruturas ausentes em todas as amostras
- Fechamentos que o autor nunca usa
- Temas que o autor nunca toca

Depois vá para o Passo 3.

## Passo 2b. Escolha do arquétipo

Chame a ferramenta AskUserQuestion com uma única pergunta:

```json
[
  {
    "question": "Qual arquétipo de newsletter combina com o que você quer escrever?",
    "header": "Arquétipo",
    "multiSelect": false,
    "options": [
      {"label": "Tutorial com dados", "description": "Números, frameworks, métodos passo a passo com prompts"},
      {"label": "Ensaio contrário", "description": "Tome uma posição, defenda e nomeie o lado oposto"},
      {"label": "Estudo de caso", "description": "Um assunto por edição, destrinchado a fundo"},
      {"label": "Curadoria", "description": "5 a 7 links com o seu comentário toda semana"},
      {"label": "Ensaio pessoal", "description": "Reflexão sobre um tema, a história vem primeiro"},
      {"label": "Entrevista ou perfil", "description": "Uma pessoa por edição, pergunta e resposta ou narrativa"}
    ]
  }
]
```

Depois que a pessoa escolher um arquétipo, carregue os padrões correspondentes de `references/archetypes.md` dentro da pasta desta skill. Ajuste cada campo usando voice.md e about-me.md antes de escrever o newsletter-voice.md. Sinalize no arquivo gerado que foram usados padrões de arquétipo e que o arquivo deve ser revisto depois de 5 edições publicadas.

## Passo 3. Escreva o newsletter-voice.md

Crie o newsletter-voice.md na raiz do projeto. Arquivo único, meta de 800 a 1.200 palavras. Use esta estrutura:

```
# Voz de newsletter

## Fonte
[Baseado em amostras: X edições analisadas] OU [Baseado em arquétipo: [nome do arquétipo] ajustado ao voice.md. Revisar depois de 5 edições publicadas.]

## Público e propósito
[Quem lê esta newsletter e o que ganha com ela. Escrito a partir do about-me.md e do voice.md. 2 a 3 frases.]

## Princípios de voz
[3 a 5 princípios que o texto sempre respeita. Cada um em uma frase declarativa curta. Ajustados ao voice.md desta pessoa.]

## Fórmula de abertura
[Como as edições começam. Inclua 2 modelos concretos com campos entre colchetes, por exemplo "[Resultado específico com número]. [Marca de credibilidade]. [Promessa de valor desta edição]." Meta de palavras da seção de abertura.]

## Fluxo das seções
[Estrutura padrão de uma edição, seção por seção, no máximo 5 a 8 seções. Notas breves sobre o que cada seção faz e o tamanho dela.]

## Dados e evidências
[Como números e exemplos são usados. Regras específicas, por exemplo "toda afirmação precisa de um número", "fontes com link no texto", "proporção entre exemplo e abstração de cerca de 3:1".]

## Regras de formatação
[Títulos, listas, negrito, itálico, blocos de código, marcadores visuais. O que usar e o que evitar. Tirado das amostras ou dos padrões do arquétipo.]

## Fechamento e assinatura
[Como as edições terminam. Afirmação que olha para frente ou resumo. Frase de assinatura se existir uma consistente entre as amostras (não invente).]

## O que esta newsletter nunca faz
[1 parágrafo curto ou 3 a 5 itens. Tirado dos padrões de ausência das amostras ou dos padrões do arquétipo. Só comportamentos, não uma lista de palavras proibidas.]

## Tamanho
[Meta de palavras para edições padrão. Meta separada para guias longos e completos, se a pessoa escrever os dois formatos.]
```

Preencha cada seção a partir das amostras (ou dos padrões de arquétipo ajustados). Nada de enchimento genérico. Se as amostras não cobrem algo, escreva "nenhum padrão claro entre as amostras" em vez de chutar.

## Passo 4. Confirme e passe adiante

Diga à pessoa:

> Sua voz de newsletter está pronta. O newsletter-voice.md está na raiz do projeto, junto com about-me.md e voice.md. Quando quiser redigir uma edição, diga "escreva uma newsletter" e eu uso os três arquivos juntos.
>
> [Se modo arquétipo: lembre que este arquivo foi montado a partir de padrões de arquétipo. Depois de umas 5 edições publicadas, rode esta skill de novo com suas amostras reais para um perfil mais preciso.]

## O que esta skill entrega

Um arquivo na raiz do projeto:

- newsletter-voice.md: instruções de escrita específicas para newsletter, cobrindo público, princípios de voz, fórmula de abertura, fluxo das seções, filosofia de dados, formatação, fechamento, padrões de ausência e metas de tamanho

## Regras

- Exija voice.md e about-me.md na raiz do projeto antes de rodar. Pare e redirecione para o voice-builder se algum estiver faltando.
- Mínimo de 2 amostras de newsletter se a pessoa escolher o modo baseado em amostras. Ofereça o modo arquétipo se houver menos.
- Mantenha o newsletter-voice.md abaixo de 1.200 palavras. Enxuto vale mais que exaustivo.
- Não invente sinais de voz. Trabalhe apenas com amostras ou com padrões de arquétipo ajustados ao voice.md.
- Não repita conteúdo do voice.md. Faça referência quando for relevante. O newsletter-voice.md só acrescenta regras específicas de newsletter.
- Não fixe nomes, URLs ou frases de assinatura específicos da pessoa, a menos que apareçam de forma consistente em 2 ou mais amostras.
- Não gere um arquivo separado de voz ou de palavras proibidas. Os padrões de ausência ficam dentro do newsletter-voice.md como uma única seção.
- Português do Brasil em tudo, a menos que as amostras estejam claramente em outra língua ou variante.
- Nunca use travessões em nenhum arquivo gerado nem em nenhum rascunho.
