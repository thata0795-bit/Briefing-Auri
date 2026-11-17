---
name: post-formatter
description: >
  Transforma um tema em um post de LinkedIn pronto para publicar usando os frameworks PAS, AIDA, BAB, STAR ou SLAY. Até 20 linhas preenchidas, formatado para celular com linha em branco entre as frases. Use esta skill sempre que a pessoa disser "formate isso como post", "transforme isso em post de LinkedIn", "escreva em PAS" ou qualquer framework nomeado, ou quiser um post bem estruturado a partir de um tema. Diferente do post-writer: o post-formatter aplica um framework rígido. O post-writer redige na voz da pessoa sem as restrições de um framework.
---

# Formatador de Posts

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Comece a coletar as informações imediatamente.

## Passo 1. Colete as informações

Chame o AskUserQuestion:

```json
[
  {
    "question": "Sobre qual tema você quer postar?",
    "header": "Tema",
    "multiSelect": false,
    "options": [
      {"label": "Vou digitar o tema", "description": "Uma frase descrevendo o assunto"},
      {"label": "Colar um despejo de contexto", "description": "Anotações, dados, transcrições para virar post"}
    ]
  },
  {
    "question": "Qual framework?",
    "header": "Framework",
    "multiSelect": false,
    "options": [
      {"label": "PAS", "description": "Problema, Agitação, Solução"},
      {"label": "AIDA", "description": "Atenção, Interesse, Desejo, Ação"},
      {"label": "BAB", "description": "Antes, Depois, Ponte"},
      {"label": "STAR", "description": "Situação, Tarefa, Ação, Resultado"},
      {"label": "SLAY", "description": "História, Lição, Conselho prático, Você"},
      {"label": "Escolha para mim", "description": "Recomende o melhor framework com base no tema"}
    ]
  }
]
```

Faça uma pergunta de acompanhamento:

> Mais alguma coisa que eu deva saber? Fatos, dados, observações de tom ou para quem é o post.

Espere a resposta.

## Passo 2. Escreva o post

Aplique estas regras gerais a toda entrega:

- No máximo 20 linhas preenchidas. Meta de 150 a 200 palavras quando os limites de linha permitirem; não encha para atingir um mínimo de palavras. Texto fornecido pela pessoa e fatos obrigatórios têm prioridade sobre a meta.
- Linha em branco depois de cada linha
- A maioria das linhas: uma frase, até 55 caracteres
- Até 4 linhas podem ser miniparágrafos (2 a 3 frases, até 110 caracteres)
- Vocabulário simples, de leitura fácil. Zero advérbios, zero jargão, zero enchimento
- Sem travessões
- Sem perguntas, a menos que o próprio gancho seja uma pergunta
- Sem emojis, exceto checks para listas numeradas (1. 2. 3.) e o símbolo de reciclar no CTA
- Regra de três: no máximo duas tríades por post
- Varie o início das frases. Não abuse do "Eu"

## Passo 3. Estrutura

- **Linha 1 (Gancho)**: texto simples para colar no LinkedIn. Até 50 caracteres.
- **Linha 2 (Virada / Contraste)**: até 50 caracteres. Contrapõe ou surpreende em relação ao gancho.
- **Linhas 3 a 18 (Núcleo)**: o framework escolhido, dividido em 3 a 5 linhas por etapa. Mantenha o número e a ordem reais dos passos ou itens obrigatórios; não force uma tríade. Use setas para mostrar fluxo quando ajudar.

Mapas dos frameworks:

- **PAS**: Problema -> Agitação -> Solução
- **AIDA**: Atenção -> Interesse -> Desejo -> Ação
- **BAB**: Antes -> Depois -> Ponte
- **STAR**: Situação -> Tarefa -> Ação -> Resultado
- **SLAY**: História -> Lição -> Conselho prático -> Você

- **1 a 2 linhas finais (Fechamento e CTA)**: feche a lição dentro do total de 20 linhas preenchidas. Use o estilo de fechamento do autor. Um CTA de compartilhamento é opcional, quando fizer sentido.

## Passo 4. Entrega

Entregue o post pronto dentro de um bloco de código. Deixe qualquer pergunta de próximo passo fora do texto pronto para colar.

## Passo 5. Ofereça o próximo passo

Depois do post, pergunte:

> Quer uma arte combinando (skill graphic-designer) ou quer que eu avalie o post com base no seu histórico (skill post-scorer)?

## Regras

- O bloco de código contém só o post pronto.
- Faça valer os limites de tamanho de linha, contagem de palavras e número de linhas. Conte.
- Nunca use travessões.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Se a pessoa tiver voice.md no projeto, ajuste o tom e o ritmo para seguir esse arquivo.
- Preserve a cobertura dos itens obrigatórios. Conte as linhas preenchidas e os caracteres no texto final exato.
