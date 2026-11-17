---
name: pinned-comment
description: Escreve comentários fixados de LinkedIn com humor seco E os prompts de geração de imagem correspondentes, na voz da pessoa. Use quando a pessoa pedir um comentário fixado, comentário para fixar ou primeiro comentário de um post de LinkedIn. SEMPRE produza o prompt de imagem PRIMEIRO e depois a legenda dele com o comentário de 4 linhas. Entregue os dois juntos, a menos que digam o contrário.
---

# Comentário Fixado de LinkedIn + Prompt de Imagem

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Estado de conclusão visual

Os prompts de imagem desta skill ficam **prontos para uso como prompt**, não são imagens geradas nem revisadas visualmente. Mantenha o fluxo com o Gemini, a menos que a pessoa peça outro gerador. A falta de um serviço de imagem não impede escrever o prompt. Quando houver imagens fornecidas ou geradas, abra e inspecione cada exportação em tamanho real e em tamanho de feed (cerca de 360px de largura, 320px para thumbnails). Confira o texto exato, as dimensões, cortes, legibilidade, cores da marca, aparência das fontes, logos e fidelidade à referência. Corrija e inspecione de novo as exportações com problema. Registre como pendente qualquer exportação ou inspeção que não foi possível fazer. Um prompt de imagem ou uma exportação rasterizada não é um arquivo de design editável.

## Por que esta skill existe

O post entrega valor. O comentário fixado constrói personalidade, confiança e vontade de voltar. Ele dá ao autor espaço para um aparte real e autodepreciativo.

Graça é subjetiva e fácil de errar. Esta skill existe para tornar REPETÍVEIS comentários fixados muito engraçados, a partir do contexto do próprio autor.

## A ideia central (leia primeiro)

A imagem carrega a piada. O comentário é a legenda da imagem.

Se o comentário faz sentido sem a imagem, ele está trabalhando demais. Se a imagem precisa do comentário para ter graça, ela está fraca demais.

Desenvolva primeiro o prompt de imagem. A geração de fato é separada e não pode ser declarada só a partir de um prompt.

---

## O PROCESSO (siga em ordem)

### Passo 1. Encontre a confissão

Leia o post fornecido e o contexto do autor. Os exemplos abaixo são padrões criativos fictícios, não fatos sobre a pessoa. Não invente uma confissão nem sugira patrocínio, dependência ou experiência pessoal que a pessoa não informou.

Todo post do autor esconde uma confissão silenciosa. Exemplos:
- "O Cowork faz a maior parte do meu trabalho agora"
- "Sou vergonhosamente dependente da Anthropic"
- "Dei de graça um produto que levou 9 meses"
- "Sou um criador patrocinado que perdeu a objetividade"

Escreva a confissão em uma frase antes de fazer qualquer outra coisa.
**Se você não consegue nomear a confissão em uma frase, pare. O post ainda não serve para comentário fixado.**

### Passo 2. Monte a imagem primeiro

Três regras para a imagem:

1. **Uma única piada visual clara.** O olho chega nela em menos de um segundo. Exemplos que funcionaram: gravata pendurada no teclado de um notebook, um altar para a Anthropic com uma rosa e velas, uma mesa de banquete em que todas as outras cadeiras são logos de empresas de tecnologia.
2. **Tudo levado totalmente a sério.** Nada de piscadinha. Nada de joinha. Nada de caras exageradas. O humor vem de tratar o absurdo como normal.
3. **O autor é a figura de menor status.** Sempre. O Claude ganha. O logo ganha. A mãe ganha. O autor perde com dignidade silenciosa.

Use o formato padrão:

> "Usando a pessoa da imagem de referência em anexo, crie uma imagem fotorrealista de [cena]. [Uma piada visual clara descrita em detalhe]. [Postura e expressão do autor, levadas a sério]. [Notas de iluminação e enquadramento]."

### Passo 3. Legende a imagem com o comentário de 4 linhas

O comentário nomeia o que a imagem mostra como quem dá uma notícia.

Estrutura fixa:

```
📌 [Linha 1: descreva o absurdo como fato normal]
[Linha 2: rebaixe o status do autor]
[Linha 3: um orgulho triste, a menor vitória possível]
[Linha 4: aceitação resignada, sem forçar a piada]
```

### Passo 4. Rode os 5 testes antes de enviar

1. **Teste da piada visual.** Dá para descrever a piada visual em 5 palavras? Se não, a imagem está carregada demais. Simplifique.
2. **Teste da legenda.** A linha 1 legenda a imagem como fato? Se a linha 1 monta uma piada separada, reescreva.
3. **Teste do perdedor.** O autor é a figura de menor status em todas as linhas? Se ele ganha em algum lugar, reescreva.
4. **Teste do esforço.** A linha 4 força demais uma piada? Se sim, deixe a linha menor e mais triste. Resignado vence espertinho.
5. **Teste do sem graça sozinho.** Leia as 4 linhas sem a imagem. O comentário é sem graça sozinho? Ótimo. Quer dizer que a imagem está fazendo o trabalho pesado.

Se algum teste falhar, corrija antes de enviar.

---

## AS REGRAS DAS 4 LINHAS (inegociáveis)

- Exatamente 4 linhas. Nem mais, nem menos.
- Cada linha é uma frase completa.
- Cada linha tem no máximo 40 caracteres.
- Comece a linha 1 com 📌.
- Sem P.S. (a linha 4 É a piada)
- Sem linha em branco entre as frases (elas ficam juntinhas)
- Português do Brasil em tudo
- Sem travessões, sem hashtags, sem ponto e vírgula
- Siga as proibições reais do voice.md do autor, não uma lista de palavras presumida.

---

## EXEMPLO PADRÃO OURO

Esta é a referência. Na dúvida, compare comentários novos com este.

**A imagem:** o autor sentado de pernas cruzadas no chão, de pijama listrado, comendo cereal de uma tigela e olhando para a própria cadeira de escritório, onde está um notebook aberto com uma gravata com nó pendurada sobre o teclado. Na parede, um certificado emoldurado de "Funcionário do Mês" com o logo do Claude e o nome "Claude (Anthropic)". Luz da manhã, tudo levado totalmente a sério.

**O comentário:**

```
📌 O Claude usa a gravata agora.
Eu fico de pijama.
Pelo menos o cereal foi ideia minha.
A gente comemora o que dá.
```

**Por que funciona:**
- A linha 1 legenda a imagem como fato (a gravata no teclado É a piada)
- A linha 2 é a virada seca que mostra a inversão de status
- A linha 3 é o orgulho mais triste possível
- A linha 4 fecha sem forçar, só aceitação resignada
- As 4 linhas passam no teste do perdedor (o autor perde em todas)
- Lido sozinho, o comentário é levemente engraçado. Com a imagem, ele brilha.

---

## OUTROS PADRÕES DE PIADA VISUAL (para referência)

- **Inversão de status na mesa:** notebook na cadeira usando gravata, o autor no chão de pijama
- **O altar:** velas, uma rosa, o logo da Anthropic emoldurado, uma carta escrita à mão "Para o Dario", o autor ajoelhado rezando
- **A mesa de banquete:** o autor na cabeceira com uma coroa de papel, todas as outras cadeiras ocupadas por logos de tecnologia (Stanford, Google, OpenAI, Anthropic, Microsoft)
- **O divã do terapeuta:** o autor recostado parecendo feliz, a terapeuta parecendo preocupada, o logo do Claude emoldurado na parede atrás dela
- **A sala de reunião:** o autor apontando para uma apresentação, todos os "executivos" da sala são logos de tecnologia
- **O bar e o home office:** o autor todo satisfeito na mesa de um bar enquanto o notebook dele trabalha visivelmente pela janela do outro lado da rua

---

## O QUE EVITAR

- Comentários que explicam a imagem em vez de legendá-la
- Comentários que funcionam sem a imagem (a imagem fica redundante)
- O autor ganhando, parecendo descolado ou soando inteligente em qualquer linha
- Forçar uma piada esperta na linha 4
- Piadas visuais que precisam de mais de 5 palavras para descrever
- Clima de piscadinha para a câmera na imagem ou no comentário
- Mais de uma piada por imagem (uma é mais afiada que três)
- Nomes de marcas patrocinadoras enfiados no comentário (o post já faz isso)

---

## FORMATO DE ENTREGA

Quando acionada, sempre entregue:

1. **A confissão** (uma frase, o que o post está confessando em silêncio)
2. **O prompt de imagem** (parágrafo completo no formato padrão)
3. **O comentário de 4 linhas** (com 📌)
4. **Uma nota de uma linha** registrando os cinco testes de texto e se uma imagem real foi inspecionada

Opcionalmente, ofereça 2 a 3 variações se a primeira tentativa estiver no limite.
