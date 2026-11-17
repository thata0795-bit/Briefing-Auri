---
name: graphic-designer
description: >
  Cria artes para posts de LinkedIn. Decide entre uma arte estruturada em HTML/CSS ou um infográfico gerado por IA conforme o conteúdo do post. Use esta skill sempre que a pessoa disser "crie uma arte", "crie um visual", "faça uma imagem", "arte para o meu post", "imagem para o LinkedIn", ou quiser qualquer conteúdo visual para acompanhar um post de LinkedIn. Acione também quando a pessoa terminar de escrever um post e quiser uma arte combinando.
---

# Designer de Artes

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Estado de conclusão visual

Os prompts de imagem desta skill ficam **prontos para uso como prompt**, não são imagens geradas nem revisadas visualmente. Mantenha o fluxo com o Gemini, a menos que a pessoa peça outro gerador. A falta de um serviço de imagem não impede escrever o prompt. Quando houver imagens fornecidas ou geradas, abra e inspecione cada exportação em tamanho real e em tamanho de feed (cerca de 360px de largura, 320px para thumbnails). Confira o texto exato, as dimensões, cortes, legibilidade, cores da marca, aparência das fontes, logos e fidelidade à referência. Corrija e inspecione de novo as exportações com problema. Registre como pendente qualquer exportação ou inspeção que não foi possível fazer. Um prompt de imagem ou uma exportação rasterizada não é um arquivo de design editável.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Não explique as opções. Comece imediatamente.

## Passo 1. Leia o post

Use o post fornecido ou o arquivo exato indicado pela pessoa. Se só houver rascunhos no projeto, confirme qual é o pretendido antes de usar. Caso contrário, diga:

> Cole o post para o qual você quer uma arte.

Espere o post e chame o AskUserQuestion:

```json
[
  {
    "question": "Que tipo de arte combina melhor com este post?",
    "header": "Estilo",
    "multiSelect": false,
    "options": [
      {"label": "Arte em HTML/CSS", "description": "Layout limpo e estruturado. Framework, comparação, passos, dados. Totalmente editável, exporta por screenshot."},
      {"label": "Infográfico de quadro branco", "description": "Estilo desenhado à mão com marcador em quadro branco ou caderno. Resume o post visualmente. Gerado no Gemini."},
      {"label": "Infográfico com a marca", "description": "Infográfico profissional com as cores da sua marca. Resume o post visualmente. Gerado no Gemini."},
      {"label": "Você decide", "description": "Analise o post e escolha o melhor formato automaticamente"}
    ]
  }
]
```

Se "Você decide": analise o post. Se ele tiver passos numerados, frameworks, comparações ou tabelas de dados, vá pelo Caminho A (HTML/CSS). Se ele resume um fluxo, compartilha dicas, ensina um conceito ou conta uma história, vá pelo Caminho B (prompt de imagem) e escolha o estilo que combinar melhor.

## Caminho A: arte estruturada em HTML/CSS

Restrições de design:
- 1200 x 1400 pixels por padrão neste caminho em HTML; siga um tamanho explícito pedido pela pessoa
- Fundo escuro (#1a1a2e ou a cor da marca da pessoa) com texto de alto contraste
- Fonte sem serifa limpa (Inter, system-ui)
- Texto branco ou claro sobre fundo escuro
- Uma cor de destaque para realces e divisores
- Margem interna mínima de 40px em todos os lados
- Sem fotos de banco de imagem no fundo
- Deixe o conteúdo do post definir quantas seções a arte tem. 3 passos = 3 blocos. 10 dicas = 10 blocos. A restrição é a legibilidade, não um número fixo. Todo elemento precisa ser grande o bastante para ler na tela do celular.

Um único arquivo HTML autossuficiente com CSS embutido. Inclua a meta tag de viewport.

Extraia o framework ou os passos centrais do post. Não copie o post inteiro. Condense em:
- Um título curto (5 a 8 palavras)
- Pontos-chave como blocos visuais (ícones Unicode servem)
- Rodapé com o nome do autor tirado do about-me.md, se houver

Salve o HTML e exporte um PNG usando o screenshot de navegador disponível ou um renderizador local existente. Espere as fontes e imagens carregarem. Abra o PNG real em resolução cheia e com 360px de largura de feed; inspecione título, cada item, cortes, contraste, fontes e crédito. Corrija o HTML e exporte de novo até essas verificações passarem. Mantenha o HTML editável junto com o PNG inspecionado. Se não houver acesso a navegador ou renderização, entregue o HTML como **renderização pendente**, diga qual capacidade falta e passe à pessoa o passo de screenshot no navegador. Nunca chame de verificado visualmente um HTML que não foi renderizado.

## Caminho B: prompt de geração de imagem

A arte precisa resumir visualmente o conteúdo do post. Não é uma ilustração abstrata nem foto de banco de imagem. Ela sintetiza as informações principais do post em um formato visual que o leitor consegue escanear.

Primeiro, extraia do post o conteúdo do infográfico:
- O título ou gancho principal (encurtado para 5 a 10 palavras)
- Todos os pontos, passos ou aprendizados obrigatórios, na ordem pedida. Busque linhas concisas; proponha dividir se o conteúdo correto não couber.
- Números, estatísticas ou dados que valham destaque
- Uma linha de rodapé (nome do autor e CTA, se fizer sentido)

Depois monte o prompt conforme o estilo escolhido.

### Estilo 1: infográfico de quadro branco

Use este modelo de prompt. Preencha as seções de conteúdo a partir do post.

```
Gere uma única imagem de um infográfico físico, desenhado à mão, em um quadro branco grande ou em uma página de caderno.

Instruções de estilo cruciais (leia primeiro):
Suporte: a imagem deve parecer uma fotografia de um quadro branco real ou de um bloco de papel grande.
Textura: todos os elementos devem parecer feitos à mão com canetas marcadoras coloridas (preto, azul, vermelho, verde) e marca-textos (amarelo/laranja). As linhas devem ser levemente imperfeitas, tremidas, com textura de tinta sobre a superfície.
Sem fontes digitais: todo texto, título e marcador deve parecer escrito à mão ou em letra de forma com caneta marcadora.

Layout: estruture a imagem de 1080x1350 assim:

TÍTULO (grande, marcador em negrito, topo da página):
[Insira o título do post]

CONTEÚDO (seções desenhadas à mão com caneta marcadora):
[Insira 3 a 6 pontos-chave, cada um como uma linha curta escrita à mão com um marcador, número ou pequeno ícone desenhado ao lado]

[Se houver estatísticas ou números, desenhe-os grandes com um círculo ou caixa em volta]

Use marcadores de várias cores para dar ênfase. Mantenha o texto grande e legível. Faça tudo parecer desenhado à mão, com pequenas imperfeições. Faça parecer a fotografia de uma página de caderno de verdade.

Se estiver confirmado no briefing, inclua o texto escrito à mão "[autor verificado e CTA aprovado]" na parte de baixo da imagem, no mesmo estilo de marcador desenhado à mão.
```

### Estilo 2: infográfico com a marca

Peça as cores da marca se ainda não forem conhecidas. Se o about-me.md existir, confira lá primeiro.

```
Gere uma imagem de infográfico profissional em 1080x1350 pixels.

Estilo: limpo, moderno, editorial. Design flat com bordas retas e tipografia forte. Sem efeitos 3D, sem degradês, sem fotos de banco de imagem.

Paleta de cores:
- Fundo: [cor primária da marca ou neutro escuro]
- Texto: [branco ou cor de alto contraste]
- Destaque: [cor secundária da marca]

Layout:
TÍTULO (topo, texto grande em negrito):
[Insira o título do post]

CORPO (seções estruturadas, cada uma com um ícone ou número):
[Insira 3 a 6 pontos-chave como linhas curtas, cada uma com um marcador visual: círculo numerado, check ou ícone simples]

[Se houver estatísticas, mostre-as como números grandes em destaque com uma legenda embaixo]

RODAPÉ:
[Nome do autor do about-me.md] | [CTA ou frase de apoio, se fizer sentido]

Mantenha o texto grande e fácil de escanear. Busque 40 palavras na imagem; preserve o conteúdo obrigatório e divida o briefing se necessário. Sem bordas decorativas. Sem marcas d'água. Sem logos, a menos que a pessoa forneça um.
```

Entregue o prompt completo em um bloco de código. Diga à pessoa:

> Cole isto no Gemini ou no seu gerador de imagens. O prompt está pronto.

## Depois de qualquer caminho

Informe o estado real: **renderização do HTML pendente**, **HTML + PNG inspecionado** ou **prompt do Gemini pronto**. Coloque link para os arquivos que de fato existem. Liste qualquer defeito visual não resolvido. A avaliação de post revisa o texto e não substitui a inspeção da imagem.

## Regras

- Sempre leia o post antes de desenhar. A arte precisa resumir o conteúdo do post, não ilustrar um conceito abstrato.
- Artes estruturadas (Caminho A) devem ser um único arquivo HTML com CSS embutido.
- Prompts de imagem (Caminho B) devem ser completos por si só. A pessoa cola direto no Gemini e recebe a arte.
- Extraia e condense o conteúdo do post na arte. Não copie o texto inteiro do post.
- Estilo quadro branco: sempre visual de marcador desenhado à mão, linhas imperfeitas, canetas coloridas, textura de caderno ou quadro branco.
- Estilo com a marca: sempre limpo, flat, moderno, com as cores da marca da pessoa.
- Nunca use travessões em nada que você entregar.
- Português do Brasil em tudo.
