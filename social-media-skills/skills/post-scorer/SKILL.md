---
name: post-scorer
description: >
  Avalia um post de LinkedIn com dados reais de desempenho. Puxa o histórico de posts da própria pessoa via Apify (ou usa dados em cache) para identificar o que realmente performa e depois avalia o rascunho com base nesses padrões. Use esta skill sempre que a pessoa disser "avalie meu post", "revise meu post", "dê uma nota para este post", "me dê feedback", "esse post está bom?", ou colar um post de LinkedIn pedindo crítica. Separa as comparações com o histórico de uma avaliação apenas editorial, sinalizada explicitamente como tal. Feita para avaliação ao vivo em eventos e para revisão de posts no dia a dia.
---

# Avaliador de Posts

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Não explique o método de avaliação. Comece imediatamente.

## Passo 1. Receba o post

Se a pessoa já colou um post na mesma mensagem, use esse. Caso contrário, diga:

> Cole o post de LinkedIn que você quer avaliar.

Espere o post.

## Passo 2. Carregue os dados de avaliação

O avaliador precisa de duas coisas: o sistema de voz da pessoa e dados reais de desempenho.

### Sistema de voz

Leia about-me.md e voice.md do projeto, se existirem. Se faltarem, registre isso e avalie sem comparar com a voz.

### Dados de desempenho

Procure exportações fornecidas pela pessoa ou dados de posts em cache no projeto escolhido. Confirme autor, data de coleta e cobertura antes de usar. Nunca vasculhe pastas de outra pessoa nem recorra aos benchmarks do mantenedor.

Se não houver dados, ofereça:

1. Usar uma exportação enviada dos posts da pessoa com as contagens agregadas de engajamento.
2. Buscar os textos dos posts e as contagens agregadas com a conexão Apify autorizada da pessoa. Confirme a conta, o escopo e o custo atual antes de uma execução paga. Confira o esquema de entrada documentado atual do actor antes de chamá-lo; não chute entradas de actors alternativos.
3. Fazer agora uma revisão editorial, com a comparação de desempenho marcada como indisponível.

Para uma execução no Apify, `apimaestro/linkedin-profile-posts` é o caminho existente. Use um lote pequeno pedido (até 100 posts). Peça **apenas os textos dos posts e as contagens agregadas**. Nunca colete comentários ou respostas, nem por meio de `deepScrape` ou `numComments`. Se o actor não conseguir excluir o texto dos comentários, use outro caminho verificado só de posts ou peça uma exportação. Não rode uma coleta de comentários para descartar depois.

Salve os dados de posts permitidos em `outputs/post-scorer/` no projeto, com o autor e a data de coleta. Se o Apify não estiver disponível, preserve o rascunho e ofereça os caminhos de exportação ou revisão editorial. Não diga que o histórico foi buscado.

## Passo 3. Analise os posts de melhor desempenho

Quando houver dados de desempenho, faça esta análise antes de avaliar:

1. Calcule a pontuação de engajamento de cada post: total_reações + (contagem_agregada_de_comentários x 3), uma ponderação editorial e não uma análise privada de alcance
2. Identifique os 10% de posts com maior pontuação de engajamento
3. Desses posts, extraia:
   - Tipos de gancho mais frequentes (contrário, com número, afirmação ousada, história pessoal, pergunta, notícia)
   - Tamanho médio do post (contagem de palavras)
   - Distribuição de formatos (só texto, imagem, carrossel, vídeo)
   - Padrões de CTA (menção à newsletter, palavra-chave nos comentários, pedido de compartilhamento, pergunta, nenhum)
   - Grupos de temas com engajamento acima da média
   - Ritmo das frases (tamanho médio, quebras de parágrafo por post)
4. Registre também os padrões dos 10% piores para identificar o que não funciona

Registre a fonte, a data, o tamanho da amostra e os padrões nesta revisão. Não grave memória persistente sem pedido. Contagens desconhecidas estão faltando, não são zero; diga quando a amostra é pequena ou selecionada demais para sustentar uma comparação de desempenho.

## Passo 4. Avalie o post

Avalie em 5 critérios, cada um de 1 a 10. Separe o julgamento editorial das comparações medidas com o histórico. Se não houver perfil de voz nem amostras confirmadas do autor, marque Aderência à voz como indisponível e informe o total sobre 40; caso contrário, use 50. Nenhum total numérico implica previsão de desempenho.

### Força do gancho (1 a 10)

Compare a primeira linha do rascunho com os tipos de gancho dos 10% melhores.
- Usa um tipo de gancho que historicamente funciona para este autor?
- É específico, com número, nome ou detalhe concreto?
- Faria alguém parar de rolar o feed, com base no que de fato faz as pessoas pararem nos dados dele?
- Com histórico, cite o padrão relevante; sem histórico, marque a nota do gancho como editorial e deixe a aderência ao histórico como indisponível

### Aderência à voz (1 a 10)

Se o voice.md existir:
- O post segue o tom, o ritmo e o tamanho de frase do voice.md?
- Viola alguma regra da seção de padrões de ausência do voice.md (o que a voz nunca faz)?
- O tamanho das frases bate com a média dos posts de melhor desempenho?
Se não houver arquivos de voz: use amostras confirmadas do autor tiradas dos dados de posts. Se nenhum dos dois existir, marque este critério como indisponível.

### Densidade de valor (1 a 10)

Compare com os posts de melhor desempenho da pessoa:
- Os melhores posts dela ensinam, dão passos, trazem dados ou contam histórias?
- Este rascunho segue esse padrão de valor?
- O aprendizado é específico o bastante para alguém salvar ou compartilhar?
- Compare a contagem de palavras com a média dos 10% melhores. Sinalize se estiver muito acima ou abaixo.

### Estrutura e formato (1 a 10)

Com base nos dados dela:
- Qual formato (texto, imagem, carrossel) gera mais engajamento para ela?
- A estrutura do rascunho segue o ritmo de quebras de linha e parágrafos dos melhores posts?
- O post é fácil de escanear no celular?
- O CTA segue os padrões dos posts de melhor desempenho?

### Prontidão para publicar (1 a 10)

- Todas as afirmações têm sustentação, os itens obrigatórios estão cobertos e as edições estão completas? Não deduza autoria pelo estilo.
- O post se encaixaria naturalmente no feed dela, considerando o histórico de publicações?
- Há algum sinal de alerta: palavras proibidas listadas nos padrões de ausência do voice.md, frases genéricas, tom corporativo?
- O tamanho está certo em comparação com os melhores posts?

## Passo 5. Entregue o boletim

Entregue em um bloco de código:

```
AVALIAÇÃO DO POST NO LINKEDIN

Fonte dos dados: [exportação verificada do autor / resultados verificados do Apify / apenas editorial]
Posts analisados: [número ou indisponível]
Engajamento médio dos 10% melhores: [número medido ou indisponível]

Força do gancho:          [X] / 10  [tipo de gancho detectado]
Aderência à voz:          [X] / 10
Densidade de valor:       [X] / 10
Estrutura e formato:      [X] / 10  [formato: texto/imagem/carrossel]
Prontidão para publicar:  [X] / 10
----------------------------------------
TOTAL:                    [XX] / [50 ou 40, excluindo voz indisponível]

VEREDITO: [Uma frase citando dados específicos]

COMPARAÇÃO COM OS MELHORES POSTS:
Seus melhores posts têm em média [X] palavras, usam ganchos do tipo [tipo de gancho]
e incluem [padrão de CTA]. Este rascunho [segue/difere] porque [motivo específico].

AJUSTES:
1. [Ajuste específico sustentado por dados, por exemplo "Seus 10% melhores posts abrem com números. Este abre com uma pergunta. Troque por um dado."]
2. [Segundo ajuste sustentado por dados]
3. [Terceiro ajuste, se necessário]
```

Cite evidências reais nas comparações com o histórico. Na revisão apenas editorial, omita a comparação com os melhores posts e dê ajustes específicos de texto e estrutura marcados como editoriais. Nunca preencha o modelo com métricas inventadas. Confira cada item obrigatório da lista ou passo contra o rascunho exato antes de avaliar.

## Passo 6. Ofereça os próximos passos

Depois do boletim:

> Quer que eu reescreva a parte mais fraca usando os padrões dos seus melhores posts, ou pode publicar?

Se pedir a reescrita, aplique os ajustes e entregue o post revisado em um bloco de código.

## Regras

- Sempre tente usar dados reais antes de recorrer a conselhos genéricos.
- Marque cada constatação como baseada em fonte/histórico ou como julgamento editorial.
- Uma nota editorial alta não comprova aderência ao histórico nem prevê alcance.
- Seja honesto. Um avaliador generoso não serve para nada.
- Se os dados estiverem desatualizados (14 dias ou mais), sugira atualizar antes de avaliar.
- Avise a pessoa antes de rodar uma coleta no Apify (tem custo).
- Nunca use travessões em nada que você entregar.
- Português do Brasil em tudo.
- Mantenha o boletim compacto. Ele precisa ficar bom em um telão de evento.
