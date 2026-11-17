---
name: niche-research
description: >
  Levanta as 20 histórias mais relevantes de um nicho nos últimos 7 dias usando as ferramentas de pesquisa ao vivo disponíveis. Datas verificadas, links reais, ângulos compartilháveis. Usa as ferramentas de navegador ou busca na web disponíveis para inspecionar fontes datadas. Use esta skill sempre que a pessoa disser "pesquise meu nicho", "o que está em alta", "encontre histórias", "notícias da semana", "pesquisa de conteúdo", ou indicar um nicho e perguntar o que está acontecendo nele. Exige acesso a fontes ao vivo para pesquisa atual.
---

# Pesquisa de Nicho

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma o método de pesquisa.

## Pré-requisitos

Use as capacidades de busca na web e de navegador realmente disponíveis no Codex ou no Claude. Nenhuma extensão ou fornecedor de assistente específico é exigido. Leia a documentação das ferramentas e confira o acesso antes de escolher um caminho. Use as sessões autorizadas que a pessoa já tem para feeds personalizados; nunca altere as conexões dela.

Acesso a feeds pelo navegador e busca indexada na web são superfícies de evidência diferentes. Se os feeds não estiverem disponíveis, siga com resultados públicos indexados e sinalize a cobertura de feed que faltou. Se não houver nenhum acesso a fontes ao vivo, a pesquisa atual fica pendente; fontes datadas fornecidas podem sustentar um briefing limitado, claramente sinalizado.

Nunca colete comentários ou respostas em nenhuma plataforma. Leia apenas o texto original dos posts e dos artigos. Contagens agregadas de engajamento podem ser registradas quando estiverem visíveis. Não ative a coleta de comentários por meio de uma opção de actor.

## Passo 1. Defina o nicho

Chame o AskUserQuestion:

```json
[
  {
    "question": "Qual nicho você quer pesquisar?",
    "header": "Nicho",
    "multiSelect": false,
    "options": [
      {"label": "Vou digitar meu nicho", "description": "Digite a expressão exata do nicho em seguida"},
      {"label": "Puxar do about-me.md", "description": "Use o nicho e o público que já estão nos meus arquivos de voz"}
    ]
  }
]
```

Se a pessoa escolher "Puxar do about-me.md", leia o arquivo na raiz do projeto. Se o arquivo não existir ou não indicar um nicho claro, peça para a pessoa digitar.

## Passo 2. Navegue como um pesquisador humano

Use o caminho disponível para as fontes a seguir; pule feeds inacessíveis com uma nota explícita de cobertura. Verifique a data de publicação de cada item. Exclua tudo que tiver mais de 7 dias a partir de hoje, sem exceção.

### 2a. Varredura do feed do Reddit

1. Acesse https://www.reddit.com/ (feed inicial).
2. Role o feed. Carregue mais posts.
3. Abra os posts relevantes para o nicho. Em cada um, confira a marcação "postado há X dias".
4. Descarte posts com mais de 7 dias.
5. Repita com https://www.reddit.com/r/popular/.
6. Pesquise também os subreddits específicos do nicho que aparecerem durante a rolagem.

### 2b. Varredura do feed do X (Twitter)

1. Acesse https://x.com/home (feed Para você).
2. Role várias telas.
3. Abra os posts originais relevantes para o nicho. Continuações escritas pelo próprio autor podem dar contexto; não colete a conversa de respostas e comentários.
4. Confira a data de cada post.
5. Descarte posts com mais de 7 dias, mesmo com engajamento alto.

### 2c. Busca no Google

Faça estas buscas uma por uma, abra os primeiros resultados e verifique as datas de publicação.

- `[nicho] notícias` (em Ferramentas → Qualquer data → Última semana)
- `[nicho] lançamento` (última semana)
- `[nicho] polêmica` (última semana)
- `[nicho] pesquisa` (última semana)
- `[nicho] regulamentação` (última semana)

Para cada resultado promissor:

1. Abra a página.
2. Localize a data de publicação visível.
3. Confirme que está dentro dos últimos 7 dias.
4. Se a data estiver ausente, confusa ou tiver mais de 7 dias, exclua.

## Passo 3. Sintetize em temas

Reúna um conjunto amplo de itens verificados e dentro do período. Agrupe itens relacionados em temas. Cada tema pode combinar discussão nas redes e cobertura jornalística.

Escolha temas que mostrem pelo menos dois destes sinais:

- Atenção ou discussão forte
- Discordância ou debate claros
- Percepção nova ou informação inédita
- Implicações reais para o nicho

Meta de 20 temas. Menos é aceitável se o material for de fato limitado.

## Passo 4. Entrega

Primeira linha antes da tabela:

```
Atualizado em [DD/MM/AAAA]
```

Depois uma tabela markdown com exatamente estas colunas:

```
| Tema / História emergente | Plataformas (Reddit, X, Notícias) | Comunidades / Contas / Fontes principais | Links representativos | Sinais de atenção | O que está acontecendo ou em debate | Por que importa para [NICHO] | Ângulo compartilhável |
```

Inclua uma nota curta de cobertura dizendo quais feeds ou buscas indexadas foram realmente usados, o período de datas e quais fontes estavam inacessíveis.

## Passo 5. Ofereça o próximo passo

Depois da tabela, pergunte:

> Tem alguma linha que você quer transformar em post de LinkedIn? Chame a skill post-writer com o número da linha, ou a skill post-formatter para aplicar um framework.

## Regras

- Nunca invente links, métricas ou datas.
- Exclua tudo com mais de 7 dias, sem exceção.
- Verifique a data de publicação de cada item antes de incluir. Sem atalhos.
- Mantenha a tabela compacta, com a nota de cobertura fora dela.
- Se menos de 20 temas passarem no filtro, diga isso. Não complete com itens fracos.
- Resultados indexados não comprovam uma varredura completa de feed. A falta de acesso a feeds é uma limitação, não prova de que não há histórias relevantes.
- Português do Brasil em tudo. Datas no formato DD/MM/AAAA.
- Nunca use travessões.
