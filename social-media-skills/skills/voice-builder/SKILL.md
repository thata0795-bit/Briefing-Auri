---
name: voice-builder
description: >
  Cria um perfil de voz personalizado dentro de um projeto Codex ou Claude a partir de uma entrevista curta e de 3 a 5 textos de amostra. Funciona para qualquer formato de conteúdo: posts de LinkedIn, newsletters, ensaios, e-mails, posts de blog, tweets ou qualquer outro texto publicado. Use esta skill no início de qualquer projeto em que a pessoa queira que o assistente aprenda quem ela é e como escreve antes de redigir conteúdo novo. Acione sempre que a pessoa disser "construa minha voz", "aprenda minha voz", "monte meu sistema de conteúdo", "faça meu onboarding", "treine com meus textos", "treine com meus posts", "quero que o Claude soe como eu", ou quando colar um lote de textos de amostra no início de um projeto. Acione também para quem está começando e precisa de uma base de voz antes de escrever qualquer coisa. Sempre gera dois arquivos (about-me.md e voice.md) salvos na raiz do projeto.
---

# Construtor de Voz

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando a pessoa pedir este fluxo, comece o Passo 1. Ou seja, sua próxima mensagem para ela são as perguntas da entrevista. Nada mais.

NÃO:
- Resuma esta skill
- Descreva quais arquivos ela cria
- Explique como funciona
- Diga "veja o que esta skill contém"
- Pergunte se a pessoa quer rodar
- Confirme a instalação
- Ofereça opções como "quer que eu rode agora?"

FAÇA ISTO:
- Vá direto para o Passo 1
- Envie as perguntas da entrevista como sua primeira e única resposta

Isso vale quando a pessoa pede para construir a voz dela ou envia amostras com esse objetivo. Sem preâmbulo. Sem resumo. Entrevista primeiro.

## Passo 1. Faça a entrevista "Sobre mim"

Faça as perguntas seguindo as orientações de execução acima. Se houver uma ferramenta de perguntas, respeite o esquema e os limites de lote dela; caso contrário, faça as mesmas perguntas no chat.

O AskUserQuestion aceita no máximo 4 perguntas por chamada, então faça duas chamadas: primeiro o Lote 1, espere as respostas, depois o Lote 2.

### Lote 1 (sua primeira ação, sem nenhum texto antes)

Use estas perguntas, adaptando o esquema da ferramenta se necessário:

```json
[
  {
    "question": "Qual é o seu nome e o que você faz?",
    "header": "Sobre você",
    "multiSelect": false,
    "options": [
      {"label": "Fundador(a)", "description": "Tenho minha própria empresa ou consultoria"},
      {"label": "Líder de marketing", "description": "Lidero o marketing de uma empresa"},
      {"label": "Criador(a)", "description": "Criar conteúdo é minha atividade principal"},
      {"label": "Líder de vendas", "description": "Lidero um time de vendas ou desenvolvimento de negócios"}
    ]
  },
  {
    "question": "Para quem você escreve?",
    "header": "Público",
    "multiSelect": false,
    "options": [
      {"label": "Fundadores e CEOs", "description": "Quem toma decisões e comanda empresas"},
      {"label": "Profissionais de marketing", "description": "Profissionais de marketing de qualquer nível"},
      {"label": "Quem busca emprego", "description": "Pessoas procurando a próxima vaga"},
      {"label": "Outros profissionais", "description": "Um grupo completamente diferente"}
    ]
  },
  {
    "question": "Quais são os 3 a 5 temas pelos quais você quer ser conhecido(a)?",
    "header": "Temas",
    "multiSelect": true,
    "options": [
      {"label": "IA e automação", "description": "Como as ferramentas de IA mudam o trabalho"},
      {"label": "Marketing", "description": "Estratégia, conteúdo, crescimento"},
      {"label": "Liderança", "description": "Gestão, contratação, cultura"},
      {"label": "Marca pessoal", "description": "Construir audiência e reputação"}
    ]
  },
  {
    "question": "Qual é o seu ponto de vista sobre o seu mercado, aquilo em que você acredita e os outros não?",
    "header": "Opinião forte",
    "multiSelect": false,
    "options": [
      {"label": "A maioria dos conselhos está errada", "description": "O consenso do seu mercado está quebrado"},
      {"label": "As pessoas complicam demais", "description": "A resposta é mais simples do que parece"},
      {"label": "Vem uma grande mudança", "description": "Algo está prestes a mudar e a maioria não está pronta"}
    ]
  }
]
```

### Lote 2 (envie logo depois das respostas do Lote 1, sem comentários entre eles)

Chame o AskUserQuestion de novo com:

```json
[
  {
    "question": "O que você quer que as pessoas pensem quando veem o seu nome?",
    "header": "Promessa",
    "multiSelect": false,
    "options": [
      {"label": "Essa pessoa é prática", "description": "Me entrega coisas que eu uso na hora"},
      {"label": "Essa pessoa é honesta", "description": "Me diz o que os outros não dizem"},
      {"label": "Essa pessoa está à frente", "description": "Enxerga o que vem antes de todo mundo"}
    ]
  },
  {
    "question": "Sobre o que você se recusa a escrever?",
    "header": "Proibido",
    "multiSelect": false,
    "options": [
      {"label": "Política", "description": "Nenhuma opinião política, nunca"},
      {"label": "Vida pessoal", "description": "Só assuntos profissionais"},
      {"label": "Concorrentes", "description": "Não citar nem expor outras pessoas ou marcas"}
    ]
  }
]
```

Depois que os dois lotes forem respondidos, vá para o Passo 2. Se alguma resposta vier em branco ou for pulada, faça aquela pergunta específica mais uma vez no chat e siga em frente.

## Passo 2. Escreva o about-me.md

Crie o about-me.md na raiz do projeto. Use esta estrutura:

```
# Sobre mim

## Nome e função
[Da pergunta 1]

## Público
[Da pergunta 2, desenvolvida em 2 a 3 frases sobre quem é o leitor]

## Pilares de conteúdo
[3 a 5 temas da pergunta 3, uma linha cada]

## Ponto de vista
[Da pergunta 4, a crença contrária ou distintiva, escrita como uma afirmação clara]

## Promessa de marca
[Da pergunta 5, o único pensamento que o autor quer ocupar na cabeça do leitor]

## Proibido
[Da pergunta 6, temas ou ângulos sobre os quais nunca escrever]
```

Mantenha abaixo de 300 palavras. Cada linha deve ser algo que o assistente consultaria ao escrever.

## Passo 3. Peça as amostras

Diga isto:

> Agora cole de 3 a 5 textos com os quais você quer que eu aprenda. Podem ser posts de LinkedIn, edições de newsletter, ensaios, posts de blog, e-mails, tweets ou qualquer outro texto que você já publicou. Podem ser seus ou de alguém cuja voz você admira. Um texto por mensagem ou todos de uma vez. Se você não tiver amostras prontas, digite "usar amostras" e eu carrego um conjunto inicial que você pode trocar depois.

Espere a pessoa colar. Mínimo de 3 amostras antes de passar para a análise. Se ela colar menos de 3, peça mais.

Se a pessoa digitar "usar amostras", carregue os textos de `references/sample-content.md` dentro da pasta desta skill. Diga de qual autor são as amostras, para que ela saiba qual voz está tomando emprestada. Lembre que ela pode substituí-las pelos próprios textos depois.

## Passo 4. Analise as amostras

Leia todas as amostras. Procure padrões que se repetem em todas, não manias isoladas de um texto só. Extraia:

**Sinais de voz**
- Tamanho médio das frases
- Ritmo dos parágrafos (quebras simples, linhas em branco, entrecortado ou fluido)
- Estilo de gancho ou abertura (contrário, pergunta, dado, história, confissão, observação)
- Ponto de vista (primeira pessoa, segunda pessoa, observacional)
- Tom (seco, caloroso, direto, brincalhão, clínico)
- Expressões de assinatura ou palavras recorrentes
- Estilo de CTA ou de fechamento

**Sinais estruturais**
- Faixa de tamanho
- Listas ou prosa
- Como abre, como fecha
- Como faz as transições

**Sinais de tema**
- Assuntos que aparecem em várias amostras
- Quem parece ser o público
- O que o autor defende

**Sinais de ausência**
- Palavras e pontuação sempre ausentes (por exemplo, travessões em 0 de 5 amostras)
- Tipos de gancho que o autor nunca usa
- Tons que o autor nunca alcança
- Estruturas que o autor evita

## Passo 5. Escreva o voice.md

Crie o voice.md na raiz do projeto. É um perfil único e integrado que cobre como a voz escreve e o que ela evita. Sem arquivo de voz separado.

```
# Perfil de voz

## Com quem eu pareço
[2 a 3 frases descrevendo a voz geral em linguagem simples]

## Tom
[3 a 5 atributos que a voz sempre tem, seguidos de 1 a 2 tons que ela nunca usa, tirados das lacunas das amostras]

## Ritmo das frases
[Tamanho médio, cadência, estrutura dos parágrafos. Inclua padrões evitados: por exemplo, nunca fragmentos entrecortados, nunca tríades, nenhuma frase com mais de 25 palavras]

## Padrões de gancho
[3 a 5 tipos de gancho observados, com um exemplo de cada tirado das amostras. Anote tipos de gancho ausentes em todas as amostras, por exemplo, nunca perguntas retóricas, nunca "imagine um mundo onde"]

## Como eu abro
[1 a 2 frases. Anote aberturas que a voz evita se houver um padrão claro de ausência nas amostras]

## Como eu fecho
[1 a 2 frases, incluindo o estilo de CTA. Anote fechamentos que a voz evita, por exemplo, nunca resumos motivacionais, nunca "em conclusão"]

## Expressões de assinatura
[Palavras ou expressões recorrentes das amostras]

## Proibido
[Palavras, pontuação ou construções ausentes em todas as amostras. Liste apenas o que as amostras claramente evitam. Exemplos: sem travessões (0 de 5 amostras), sem hashtags, sem jargão corporativo citado nominalmente]

## O que esta voz nunca faz
[3 a 5 comportamentos específicos tirados das lacunas das amostras. Seja específico. Se as amostras nunca usam a construção "não é X, é Y", liste. Se evitam um vocabulário específico, nomeie as palavras]
```

Preencha cada seção a partir das amostras reais. Nada de enchimento genérico. Se um padrão não estiver presente, diga isso. Não repita público nem pilares de conteúdo do about-me.md.

Separe as proibições explícitas da pessoa dos padrões apenas ausentes nesta pequena amostra. Marque esses últimos como provisórios, com a contagem de amostras; a ausência sozinha não estabelece uma proibição permanente. Amostras iniciais descrevem um estilo emprestado, nunca as experiências ou a voz estabelecida da pessoa.

## Passo 6. Confirme e passe adiante

Diga à pessoa:

> Seu perfil de voz está pronto. Agora há dois arquivos no seu projeto: about-me.md e voice.md. As skills leem os dois arquivos quando são acionadas neste projeto; uma tarefa nova precisa encontrar as skills e usar o mesmo contexto de projeto. Você pode abrir e editar qualquer um deles quando quiser.
>
> Está tudo pronto. Veja o que você pode fazer agora:
>
> - Diga "construa minha voz de newsletter" para criar instruções de escrita específicas para newsletter
> - Diga "escreva um post" para redigir um post de LinkedIn na sua voz
> - Diga "crie uma arte" para criar um visual para um post
> - Diga "avalie meu post" para receber feedback sobre um rascunho
> - Diga "otimize meu perfil" para reconstruir seu perfil do LinkedIn
>
> Cada uma é uma skill separada. Escolha uma e vamos.

## O que esta skill entrega

Dois arquivos na raiz do projeto:

1. about-me.md: quem a pessoa é, o público, os pilares de conteúdo, o ponto de vista
2. voice.md: o perfil de voz integrado, com os sinais positivos (como a voz escreve) e os sinais de ausência (o que a voz evita) em um único documento

## Regras

- Quando esta skill for acionada, vá direto para o Passo 1. Sem resumo, sem explicação, sem preâmbulo.
- Sempre entregue conteúdo de amostra dentro de um bloco de código, para que a pessoa copie a formatação exata sem perder quebras de linha ou espaços. Use um bloco de código simples (três crases sem indicação de linguagem).
- Trabalhe com o que está nas amostras. Não invente padrões que não existem.
- Mínimo de 3 amostras para detectar padrões. Peça mais se houver menos de 3.
- Se as amostras se contradizem, registre a contradição no voice.md em vez de suavizá-la.
- Mantenha o about-me.md abaixo de 300 palavras.
- Mantenha o voice.md abaixo de 500 palavras.
- Português do Brasil em tudo, a menos que as amostras estejam claramente em outra língua ou variante.
- Nunca use travessões em nenhum arquivo gerado nem em nenhum rascunho.
- Não crie um perfil de ausência separado. Os sinais de ausência ficam dentro do voice.md.
