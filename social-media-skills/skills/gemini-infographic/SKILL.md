---
name: gemini-infographic
description: >
  Gera um prompt de infográfico desenhado à mão em quadro branco. Recebe um conteúdo de origem (post, newsletter, blog, nota de pesquisa) e devolve um prompt completo de geração de imagem para o Gemini, com um briefing estruturado. Use esta skill sempre que a pessoa disser "infográfico de quadro branco", "infográfico gemini", "arte desenhada à mão", "transforme isso em quadro branco", ou quiser um infográfico gerado por IA para um post.
---

# Infográfico no Gemini

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Estado de conclusão visual

Os prompts de imagem desta skill ficam **prontos para uso como prompt**, não são imagens geradas nem revisadas visualmente. Mantenha o fluxo com o Gemini, a menos que a pessoa peça outro gerador. A falta de um serviço de imagem não impede escrever o prompt. Quando houver imagens fornecidas ou geradas, abra e inspecione cada exportação em tamanho real e em tamanho de feed (cerca de 360px de largura, 320px para thumbnails). Confira o texto exato, as dimensões, cortes, legibilidade, cores da marca, aparência das fontes, logos e fidelidade à referência. Corrija e inspecione de novo as exportações com problema. Registre como pendente qualquer exportação ou inspeção que não foi possível fazer. Um prompt de imagem ou uma exportação rasterizada não é um arquivo de design editável.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma o processo.

## Passo 1. Receba o conteúdo de origem

Peça:

> Cole o conteúdo que você quer transformar em infográfico. Um post, trecho de newsletter, blog, nota de pesquisa ou tópicos soltos, tudo funciona.

Espere o conteúdo.

## Passo 2. Monte o briefing

Analise o conteúdo e produza um briefing de infográfico em linguagem simples. Inclua:

- **Título** (até 6 palavras, contundente)
- **Subtítulo** (opcional, uma linha de contexto)
- **Estrutura central**: decida entre passos, framework, comparação, dados ou lista
- **Pontos-chave**: busque de 3 a 7 tópicos curtos. Preserve cada passo, item e ressalva obrigatórios; se não couberem de forma legível, proponha dividir no briefing em vez de cortar conteúdo em silêncio.
- **Sugestões visuais**: setas, caixas, números destacados, ícones, toques de cor. Seja específico sobre posição e cor.
- **CTA de rodapé**: texto escrito à mão dizendo "Siga [Nome] [Frase de apoio] para mais conteúdos úteis | Compartilhe ♻️"

Diga à pessoa:

> Aqui está o briefing. Me diga o que mudar, ou diga "gerar" quando estiver satisfeita.

Espere a aprovação.

## Passo 3. Entregue o prompt do Gemini

Depois de aprovado, entregue o prompt completo em um bloco de código, com o briefing inserido no campo `[INSIRA AQUI O CONTEÚDO E O LAYOUT DO INFOGRÁFICO]`:

```
Gere uma única imagem de um infográfico físico, desenhado à mão, em um quadro branco grande ou em uma página de caderno.

Instruções de estilo cruciais (leia primeiro):

Suporte: a imagem deve parecer uma fotografia de um quadro branco real ou de um bloco de papel grande.

Textura: todos os elementos devem parecer feitos à mão com canetas marcadoras coloridas (preto, azul, vermelho, verde) e marca-textos (amarelo/laranja). As linhas devem ser levemente imperfeitas, tremidas, com textura de tinta sobre a superfície.

Sem fontes digitais: todo texto, título e marcador deve parecer escrito à mão ou em letra de forma com caneta marcadora.

Layout: estruture a imagem de 1080x1350 assim:

[INSIRA AQUI O BRIEFING: título, subtítulo, estrutura central, pontos-chave, sugestões visuais]

Use marcadores de várias cores para dar ênfase. Mantenha o texto grande e legível. Faça tudo parecer desenhado à mão, com pequenas imperfeições. Faça parecer a fotografia de uma página de caderno de verdade.

Se aprovado no briefing, inclua o rodapé escrito à mão "[autor verificado e CTA aprovado]" na parte de baixo da imagem, no mesmo estilo de marcador desenhado à mão.
```

Diga à pessoa:

> Cole isto em uma conversa nova do Gemini, com Criar imagem ativado e o Nano Banana selecionado. Gere em 1080x1350.

## Passo 4. Ofereça ajustes

Depois do prompt, ofereça:

> Se a primeira geração errar, me diga o que ajustar e eu reescrevo o prompt. Ajustes comuns: menos cores, título maior, outra direção de layout.

## Regras

- Saída em 1080x1350 pixels é inegociável. O formato vertical domina o feed do LinkedIn.
- Preencha o nome e a frase do rodapé apenas com contexto confirmado pela pessoa. Use o rodapé sugerido de compartilhamento só se combinar com a voz dela; omita campos desconhecidos.
- Nunca use travessões em nada que você entregar.
- Busque tópicos com menos de 10 palavras sem perder o sentido. Legibilidade e cobertura correta precisam passar as duas.
- Sempre espere a aprovação do briefing antes de entregar o prompt final.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Se a pessoa tiver brand-kit.md ou colours.md no projeto, incorpore as cores da marca nas sugestões visuais.
