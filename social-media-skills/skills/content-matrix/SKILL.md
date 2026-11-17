---
name: content-matrix
description: >
  Gera de 24 a 40 ideias de posts de LinkedIn em uma única tabela, combinando os pilares de conteúdo da pessoa com 8 formatos de conteúdo comprovados. Baseada na matriz de conteúdo de Justin Welsh. Use esta skill sempre que a pessoa disser "me dê ideias de post", "matriz de conteúdo", "sobre o que eu devo postar", "gere ideias de post", "ideação de conteúdo" ou "planeje meu conteúdo do mês". Usa about-me.md e voice.md se existirem; caso contrário, pergunta os pilares e o contexto.
---

# Matriz de Conteúdo

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Comece a coletar as informações imediatamente.

## Passo 1. Colete as informações

Procure o about-me.md no projeto. Se existir, leia e preencha a descrição de quem é a pessoa. Pule essa pergunta e diga o que você aproveitou.

Se o about-me.md não existir, peça:

> Me dê pelo menos dois parágrafos descrevendo quem você é, o que você faz e sobre o que gosta de falar. Quanto mais específico, mais relevantes as ideias.

Espere a resposta.

Depois chame o AskUserQuestion:

```json
[
  {
    "question": "Quais são os seus pilares de conteúdo?",
    "header": "Pilares",
    "multiSelect": false,
    "options": [
      {"label": "Vou digitar", "description": "Tenho 3 a 4 pilares de conteúdo para usar"},
      {"label": "Puxar do voice.md", "description": "Use os temas já definidos nos meus arquivos de voz"},
      {"label": "Sugira para mim", "description": "Com base no meu about-me.md, recomende 4 pilares"}
    ]
  }
]
```

Se a pessoa digitar os próprios pilares, aceite de 3 a 5. Se forem menos de 3, peça mais.

Se a pessoa escolher "Sugira para mim", leia o about-me.md, proponha 4 pilares que cubram o posicionamento dela e peça que confirme ou edite antes de continuar.

## Passo 2. Monte a matriz

Gere uma tabela em markdown com:

- Eixo X (colunas): 8 formatos de conteúdo, sempre nesta ordem:
  1. Prático
  2. Motivacional
  3. Analítico
  4. Contrário
  5. Observação
  6. X vs Y
  7. Presente vs Futuro
  8. Lista
- Eixo Y (linhas): os 3 a 5 pilares da pessoa

Cada célula contém uma ideia de post específica e concreta, feita sob medida para o pilar e o formato. Nada genérico. Nada que sirva para outros pilares.

Definições dos formatos para preencher cada célula:

- **Prático**: tutorial ultraespecífico. Ensina o leitor a fazer uma coisa.
- **Motivacional**: história inspiradora sobre alguém que fez algo extraordinário no nicho.
- **Analítico**: destrinchar por que algo funciona do jeito que funciona.
- **Contrário**: ir contra o conselho comum do nicho e sustentar a posição.
- **Observação**: uma tendência escondida, silenciosa ou pouco discutida que a pessoa percebeu.
- **X vs Y**: comparar duas coisas (ferramentas, estilos, frameworks, empresas).
- **Presente vs Futuro**: situação atual contra uma previsão específica, com o porquê.
- **Lista**: uma lista de recursos, dicas, erros, lições ou passos.

A ideia de cada célula deve ser um título específico, não um tema. Bom: "Uma fórmula de gancho em 3 linhas para lançamentos de produto". Ruim: "Ganchos".

## Passo 3. Entrega (de acordo com a interface)

Escolha o modo de entrega conforme a interface em que você está rodando. Não entregue a tabela dentro de um bloco de código markdown: isso aparece como texto simples monoespaçado e torna uma grade 5×8 difícil de escanear.

- **Uma interface de gráfico ou tabela interativa disponível:** apresente a matriz como um gráfico interativo ou widget de tabela interativa. Pilares nas linhas, formatos nas colunas, cada célula com um título específico. A pessoa deve poder clicar em uma célula para ver o título completo e eventuais notas. Não despeje a tabela também em markdown: o gráfico é a entrega.
- **Um assistente com acesso a arquivos, como Codex ou Claude Code:** salve a matriz em `content-matrix-AAAA-MM-DD.md` no diretório de trabalho atual e mostre a mesma tabela na resposta como tabela markdown simples (sem envolver em três crases). Confirme o caminho do arquivo para a pessoa abrir.
- **Alternativa (sem gráfico interativo, sem ferramentas de arquivo):** entregue uma tabela markdown simples na própria resposta. Também sem bloco de código.

Abaixo da tabela ou do gráfico, acrescente uma frase indicando a ideia mais forte de toda a matriz e por quê.

## Passo 4. Ofereça o próximo passo

Pergunte:

> Tem alguma célula que você quer que eu transforme em post completo? Indique a célula pelo pilar + formato (por exemplo "Ganchos × Contrário") e eu passo para a skill post-writer ou post-formatter.

Quando houver ferramentas de arquivo, ofereça também acrescentar o post redigido no mesmo arquivo `content-matrix-AAAA-MM-DD.md`, abaixo da referência da célula.

## Regras

- Mínimo de 3 pilares, máximo de 5. Mais de 5 dilui a matriz.
- Cada ideia de célula deve ser específica para aquele pilar E aquele formato. Não repita a mesma ideia entre pilares.
- Ajuste a linguagem à voz da pessoa se o voice.md existir.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Nunca use travessões.
