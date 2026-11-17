---
name: hook-generator
description: >
  Gera 6 variações de gancho de LinkedIn no estilo isca de clique para qualquer tema. Ganchos de duas linhas construídos com a fórmula: uma linha de abertura de até 40 caracteres e uma linha de contraste forte de até 40 caracteres. Usa números fornecidos e experiências reais em primeira pessoa quando houver. Use esta skill sempre que a pessoa disser "escreva ganchos", "ideias de gancho", "gere ganchos", "preciso de um gancho para um post sobre...", ou colar um tema pedindo aberturas. Entrega rápida, sem preâmbulo.
---

# Gerador de Ganchos

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Não explique o que faz um bom gancho.

## Passo 1. Receba o tema

Se a pessoa já colou um tema na mensagem, use-o e pule para o Passo 2.

Caso contrário, pergunte:

> Para qual tema você quer ganchos?

Espere a resposta.

## Passo 2. Escreva 6 variações de gancho

Todo gancho tem a mesma estrutura:

- **Linha 1 (Abertura)**: no máximo 40 caracteres. Sem perguntas. Afirma algo inesperado, específico ou contundente.
- **Linha 2 (Contraste)**: no máximo 40 caracteres. Contradiz, reenquadra ou desmonta a abertura.

Toda variação deve:

- Usar "Como eu" ou "Eu" apenas para uma experiência real informada pelo autor. Caso contrário, use um ângulo impessoal sustentado por evidências e sinalize que o ângulo pessoal está indisponível.
- Incluir um número ou métrica sempre que possível
- Seguir princípios de isca de clique: tensão, lacuna de curiosidade, algo em jogo

Produza 6 variações cobrindo ângulos diferentes:

1. **Com número**: comece com um número ou métrica específica
2. **Contrário**: afirme uma crença e depois inverta
3. **Transformação pessoal**: antes e depois com um número
4. **Referência de autoridade**: cite um nome, ferramenta ou marca
5. **Confissão**: admita um erro ou uma perda
6. **Choque de futuro**: uma previsão ou "X está prestes a mudar"

## Passo 3. Formato de entrega

```
GANCHOS para [tema]

1. [Com número]
[Linha 1]
[Linha 2]

2. [Contrário]
[Linha 1]
[Linha 2]

3. [Transformação pessoal]
[Linha 1]
[Linha 2]

4. [Referência de autoridade]
[Linha 1]
[Linha 2]

5. [Confissão]
[Linha 1]
[Linha 2]

6. [Choque de futuro]
[Linha 1]
[Linha 2]
```

## Passo 4. Ofereça o próximo passo

Pergunte:

> Quer que eu transforme um destes em post completo? Chame a skill post-formatter com o número do gancho.

## Regras

- No máximo 40 caracteres por linha. Conte.
- Sem perguntas na linha de abertura.
- Sem travessões.
- Sem palavras de enchimento. Cada palavra precisa se justificar.
- Prefira algarismos a números por extenso (3, não três).
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Preserve a incerteza da fonte. Nunca invente um resultado ou uma certeza para deixar o gancho mais forte. Conte os caracteres exatos com uma ferramenta de texto disponível antes de entregar.
