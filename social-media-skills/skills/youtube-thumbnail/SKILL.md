---
name: youtube-thumbnail
description: >
  Gera uma thumbnail de YouTube com a identidade da marca a partir do título do vídeo. Usa uma foto de referência do criador, princípios de thumbnails com alta taxa de clique e as cores da marca para produzir um prompt de imagem pronto para o Gemini. Use esta skill sempre que a pessoa disser "thumbnail", "thumbnail do youtube", "monte uma thumbnail", ou quiser uma capa de vídeo antes de escrever o roteiro. O fluxo que começa pela thumbnail espelha a abordagem que começa pela arte no LinkedIn: vende o vídeo antes de alguém ouvir uma palavra do roteiro.
---

# Thumbnail de YouTube

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Estado de conclusão visual

Os prompts de imagem desta skill ficam **prontos para uso como prompt**, não são imagens geradas nem revisadas visualmente. Mantenha o fluxo com o Gemini, a menos que a pessoa peça outro gerador. A falta de um serviço de imagem não impede escrever o prompt. Quando houver imagens fornecidas ou geradas, abra e inspecione cada exportação em tamanho real e em tamanho de feed (cerca de 360px de largura, 320px para thumbnails). Confira o texto exato, as dimensões, cortes, legibilidade, cores da marca, aparência das fontes, logos e fidelidade à referência. Corrija e inspecione de novo as exportações com problema. Registre como pendente qualquer exportação ou inspeção que não foi possível fazer. Um prompt de imagem ou uma exportação rasterizada não é um arquivo de design editável.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1.

## Passo 1. Colete as informações

Procure no projeto uma configuração de foto de referência. Procure nesta ordem:

1. `thumbnail-config.md` na raiz do projeto
2. `brand-kit.md`: procure o caminho de uma imagem de referência e as cores da marca
3. `about-me.md`: para o nome e o posicionamento do criador

Se houver um caminho de foto de referência salvo, preencha com ele. Caso contrário, pergunte:

> Envie ou informe o caminho da foto de referência sua que deve ser usada na thumbnail. O ideal é uma foto de rosto nítida, com iluminação e expressão marcantes que você pretende repetir nos vídeos para manter a consistência da marca.

Depois chame o AskUserQuestion:

```json
[
  {
    "question": "Qual é o título do vídeo?",
    "header": "Título",
    "multiSelect": false,
    "options": [
      {"label": "Vou digitar o título", "description": "Digite o título provisório completo"},
      {"label": "Sugira um", "description": "A partir do tema, proponha primeiro 3 títulos que geram clique"}
    ]
  },
  {
    "question": "Tom emocional?",
    "header": "Tom",
    "multiSelect": false,
    "options": [
      {"label": "Choque / surpresa", "description": "Olhos arregalados, boca aberta, reação forte"},
      {"label": "Curioso / pensativo", "description": "Meio sorriso, sobrancelha levantada, olhar para fora do quadro"},
      {"label": "Confiante / direto", "description": "Olho no olho, calma, firmeza"},
      {"label": "Frustrado / opinião forte", "description": "Olhar intenso, gesto com a mão, tensão"}
    ]
  }
]
```

Confirme o título e a promessa em relação ao conteúdo fornecido do vídeo. Não invente resultado, não sugira que existe uma demonstração, nem use rosto ou marca que não foram fornecidos. Sem foto de referência, a geração baseada em foto fica pendente, mas o briefing de composição ainda pode ser redigido.

## Passo 2. Aplique as boas práticas de thumbnail

Toda thumbnail deve seguir estas regras:

- **O rosto ocupa de 30 a 50 por cento** do quadro. Legível em tamanhos pequenos.
- **No máximo 3 a 5 palavras** de texto grande. 6 se for absolutamente necessário.
- **Duas cores dominam**. A primária da marca + um destaque de alto contraste (amarelo, vermelho e ciano funcionam bem).
- **Um elemento focal claro** além do rosto. Logo de ferramenta, número grande, seta ou objeto.
- **Alto contraste** entre rosto, texto e fundo. Teste apertando os olhos.
- **O texto não é uma frase**. É uma expressão de gancho. Exemplos: "Demiti meu time", "O Claude agora...", "Não faça isso".
- **Sem texto pequeno, sem logos no canto inferior direito** (é onde fica a duração do vídeo).

## Passo 3. Monte o briefing da thumbnail

Entregue um briefing conciso para a pessoa revisar:

```
BRIEFING DA THUMBNAIL: [título do vídeo]

Composição: [posição do rosto, % do quadro, direção do olhar]
Texto: "[expressão de gancho, 3 a 5 palavras]"
Posição do texto: [esquerda, direita, topo, contornando o rosto]
Paleta de cores: [hex primário], [hex de destaque], [hex do fundo]
Elemento de apoio: [logo / objeto / seta / número]
Tom emocional: [tom do Passo 1]
```

Depois pergunte:

> Aqui está o briefing. Diga "gerar" para eu entregar o prompt de imagem ou me diga o que mudar.

## Passo 4. Entregue o prompt do Gemini

Depois de aprovado, entregue o prompt de geração de imagem em um bloco de código:

```
Usando a foto de referência minha em anexo, gere uma thumbnail de YouTube em 1280 x 720 pixels (16:9).

Composição:
- Me posicione à [esquerda / direita / no centro] ocupando [30 a 50]% do quadro
- Minha expressão: [detalhes do tom, por exemplo, chocado com olhos arregalados e boca aberta]
- Meu olhar: [direção, por exemplo, olhando direto para a câmera / olhando para fora do quadro na direção do texto]

Texto:
- Mostre "[expressão de gancho]" em tipografia sem serifa grande e em negrito
- Cor do texto: [hex]
- Contorno do texto: [cor, espessura para legibilidade]
- Posição do texto: [área específica]

Paleta de cores:
- Primária: [hex]
- Destaque: [hex]
- Fundo: [hex], [descreva o tratamento: chapado, degradê, cena desfocada etc.]

Elemento de apoio: [descrição específica do visual de apoio]

Restrições:
- O rosto deve estar nítido e definido
- O texto deve ser legível com 320px de largura (tamanho do YouTube no celular)
- Sem marcas d'água, sem elementos da interface do YouTube, sem texto no canto inferior direito
- Alto contraste entre rosto, texto e fundo
```

Diga à pessoa:

> Cole isto em uma conversa nova do Gemini, anexe sua foto de referência, ative Criar imagem e selecione o Nano Banana. Gere em 1280x720.

## Passo 5. Ofereça o próximo passo

> Quer que eu estruture o vídeo agora? Gancho, meio e CTA a partir da thumbnail.

## Regras

- 1280x720 pixels (16:9). Tamanho nativo de thumbnail do YouTube.
- Nunca inclua o caminho da foto de referência no prompt; a pessoa anexa a foto separadamente.
- Nunca permita mais de 6 palavras de texto; 5 é o ideal, 3 é o melhor.
- O rosto deve ser sempre um ponto focal visível. Nada de composições com o rosto escondido.
- Nunca use travessões.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Se houver brand-kit.md no projeto, leia e use as cores exatas da marca.
- Recomende que a pessoa mantenha um estilo de thumbnail consistente entre os vídeos para o canal ser reconhecido.
