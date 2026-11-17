---
name: gemini-carousel
description: >
  Gera um carrossel de LinkedIn com a identidade da marca, slide por slide, usando o Gemini. Recebe o conteúdo de origem, monta um briefing de design, espera a aprovação e depois entrega um prompt de geração de imagem por slide. Formato vertical 1080x1350. Use esta skill sempre que a pessoa disser "carrossel", "monte um carrossel", "transforme isso em carrossel", "carrossel gemini", ou quiser conteúdo de LinkedIn com vários slides. Sempre inclui uma etapa de aprovação entre o briefing e a geração das imagens.
---

# Carrossel no Gemini

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

## Passo 1. Colete as informações

Peça:

> Cole o conteúdo que você quer no carrossel. Um post, trecho de newsletter, notas de pesquisa ou um framework, tudo funciona.

Espere o conteúdo e depois chame o AskUserQuestion:

```json
[
  {
    "question": "Estilo da marca?",
    "header": "Estilo",
    "multiSelect": false,
    "options": [
      {"label": "Puxar do brand-kit.md", "description": "Use as cores e a tipografia do arquivo de marca do meu projeto"},
      {"label": "Vou digitar as cores", "description": "Vou colar os códigos hex e as preferências de fonte"},
      {"label": "Sugira para mim", "description": "Escolha paleta e tipografia com base no conteúdo"}
    ]
  },
  {
    "question": "Quantos slides?",
    "header": "Slides",
    "multiSelect": false,
    "options": [
      {"label": "6 slides", "description": "Enxuto, leitura rápida"},
      {"label": "8 slides", "description": "Tamanho padrão de carrossel"},
      {"label": "10 slides", "description": "Carrossel aprofundado"}
    ]
  }
]
```

## Passo 2. Monte o briefing de design

Analise o conteúdo e produza um briefing slide por slide com:

- **Slide 1 (Capa)**: gancho, texto grande em negrito, direção visual
- **Slides 2 a N-1 (Corpo)**: uma ideia por slide, texto enxuto e uma ilustração ou diagrama específico que a explique. Preserve todos os itens obrigatórios e as ressalvas da fonte; proponha mais slides se precisar.
- **Slide N (Final)**: conclusão útil ou próximo passo, com CTA apenas para uma oferta ou link real aprovado pela pessoa

Para cada slide inclua:

- Número do slide
- Título (no máximo 8 palavras)
- Texto (no máximo 15 palavras)
- Sugestão visual (ícone, bloco de cor, ilustração, diagrama)

Diga à pessoa:

> Aqui está o briefing de design. Me diga o que mudar, ou diga "gerar" quando estiver satisfeita.

Espere a aprovação. Não siga até a pessoa aprovar explicitamente.

## Passo 3. Entregue os prompts por slide

Depois de aprovado, entregue um prompt de geração de imagem do Gemini por slide, cada um em seu próprio bloco de código, numerado com clareza.

Todo prompt segue esta estrutura:

```
Atue como um designer gráfico especialista. Crie um slide de carrossel de LinkedIn em 1080x1350 pixels (proporção 4:5).

Estilo da marca:
- Cor primária: [HEX]
- Cor secundária: [HEX]
- Cor de destaque: [HEX]
- Tipografia: [fonte de título forte e industrial, fonte de texto geométrica e limpa]
- Estética: moderna, com autoridade, alto contraste

Slide [N de M]: [função do slide]

Conteúdo:
- Título: "[texto do título]"
- Texto: "[texto do corpo]"
- Elemento visual: [sugestão visual específica]

Instruções de layout:
- [Posição e tamanho do título]
- [Posição e tamanho do texto]
- [Posição do visual]
- [Tratamento do fundo]

Restrições:
- Proporção vertical 4:5 com exatamente 1080x1350 pixels
- Sem marcas d'água, sem logos, a menos que especificado acima
- Manter a consistência visual com os outros slides do conjunto
```

Diga à pessoa:

> Cole cada prompt em uma conversa nova do Gemini, com Criar imagem ativado e o Nano Banana selecionado. Gere um slide de cada vez para ter o máximo de controle sobre a consistência.

## Passo 4. Ofereça a alternativa em um único prompt

Depois dos prompts por slide, ofereça:

> Quer um único prompt combinado que gera o carrossel inteiro de uma vez? Mais rápido, mas com menos consistência visual. Diga "combinar" e eu reescrevo.

## Regras

- Sempre espere a aprovação do briefing antes de entregar os prompts de imagem.
- 1080x1350 pixels por slide. Nenhuma outra proporção.
- Meta de 15 palavras de texto por slide, mas nunca corte um fato obrigatório para bater a meta. Divida o conteúdo no briefing quando precisar de mais espaço.
- Mantenha o estilo da marca idêntico em todos os prompts para o conjunto parecer um único carrossel.
- O slide de capa (1) e o slide de CTA (último) devem ser visualmente diferentes dos slides de corpo.
- Nunca use travessões.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Se houver brand-kit.md no projeto, leia e use exatamente os códigos hex e as escolhas de tipografia dele.
