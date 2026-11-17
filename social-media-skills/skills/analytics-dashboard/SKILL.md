---
name: analytics-dashboard
description: >
  Transforma uma exportação do LinkedIn Analytics em um dashboard React interativo com tema escuro, mais uma análise estratégica escrita com 5 recomendações de conteúdo sustentadas por dados. Lê todas as abas da exportação e monta gráficos de tendência de engajamento, crescimento de seguidores, dispersão de desempenho dos posts, mapa de calor por dia da semana e perfil do público. Use esta skill sempre que a pessoa disser "analise meu linkedin", "analytics do linkedin", "monte meu dashboard", "revise meu desempenho", ou enviar um arquivo de exportação do LinkedIn Analytics. Exige como entrada a exportação do LinkedIn Analytics da pessoa (xlsx).
---

# Dashboard de Analytics

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1.

## Passo 1. Receba o arquivo de exportação

Peça:

> Envie o arquivo de exportação do seu LinkedIn Analytics (xlsx).
>
> Não sabe como conseguir? Entre no LinkedIn Analytics, defina o período (30, 60 ou 90 dias funcionam bem) e clique em Exportar no canto superior direito.

Espere o envio do arquivo.

## Passo 2. Leia os dados

Leia todas as abas do arquivo. Confirme o autor, o período do relatório, as unidades e os nomes reais das colunas antes de calcular. As abas abaixo são exemplos, não um esquema garantido da exportação:

- **DISCOVERY**: impressões e alcance gerais
- **ENGAGEMENT**: impressões e engajamentos diários ao longo do tempo
- **TOP POSTS**: os 50 melhores posts, ordenados por engajamentos e por impressões (duas tabelas para mesclar)
- **FOLLOWERS**: novos seguidores por dia mais o total
- **DEMOGRAPHICS**: cargos, localizações, setores, senioridade, tamanho da empresa, principais empresas

As tabelas de melhores posts são amostras selecionadas, não o histórico completo de publicações da conta. Mantenha os denominadores delas separados das métricas da conta inteira; não deduza os melhores horários de postagem a partir de agregados diários. Limpe cabeçalhos bagunçados. Mescle as duas tabelas TOP POSTS (por engajamentos e por impressões) em um único conjunto de dados por post. Remova duplicatas.

## Passo 3. Monte o dashboard interativo

Use uma interface de artefato React compatível ou a configuração de React e Recharts que o projeto escolhido já tem. Se nenhuma das duas existir, entregue a análise calculada e o código React com **pré-visualização pendente**; não instale dependências em silêncio nem diga que um dashboard interativo está rodando. Abra a pré-visualização e teste as dicas dos gráficos e o redimensionamento antes de chamar de verificado. Tema escuro (fundo `#0f1117`), cores de destaque nos gráficos. Use Recharts em todas as visualizações.

Inclua estes painéis, nesta ordem:

### Métricas principais (cards na linha de cima)
- Total de impressões
- Alcance total
- Total de novos seguidores
- Média diária de impressões
- Média diária de engajamentos
- Taxa de engajamento geral (soma dos engajamentos / soma das impressões, no mesmo período do relatório). Denominadores zerados ou ausentes ficam indisponíveis, não viram zero.
- Total de posts acompanhados

### Tendência de engajamento (gráfico de linhas)
- Impressões diárias (eixo y da esquerda) e engajamentos (eixo y da direita) ao longo de todo o período
- Destaque com marcadores os 3 dias de pico

### Crescimento de seguidores (gráfico de área)
- Novos seguidores por dia
- Linha de tendência com média móvel de 7 dias sobreposta
- Ganho acumulado de seguidores

### Dispersão de desempenho dos posts
- Eixo X: impressões. Eixo Y: engajamentos
- Classifique os posts por cor em quatro quadrantes:
  - **Estrelas**: alto alcance + alto engajamento
  - **Virais mas rasos**: alto alcance + baixo engajamento
  - **Ouro de nicho**: baixo alcance + alto engajamento
  - **Abaixo do esperado**: baixo alcance + baixo engajamento
- Pontos com informação ao passar o mouse mostrando a URL e a data do post

### Mapa de calor por dia da semana
- Média de impressões e engajamentos por dia da semana
- Destaque os dias mais fortes

### Perfil do público (gráficos de barras)
- Cargos
- Setores
- Senioridade
- Tamanho da empresa
- Principais localizações

### Regras de formatação
- Formate os números: `67 mil` e não `67000`, `1,2 mi` e não `1200000`
- Total de seguidores em destaque no topo
- Layout responsivo (funciona em notebook e em tela grande)
- Fundo escuro, cores de gráfico com alto contraste

## Passo 4. Análise estratégica escrita

Abaixo do dashboard, escreva uma análise concisa com estas seções:

### Resumo de desempenho
- Trajetória: crescendo, estabilizando ou caindo (use as linhas de tendência)
- Taxa de engajamento atual; compare com benchmarks externos apenas com fonte datada verificada e definição de métrica equivalente

### Padrões dos melhores posts
- Analise os 10 melhores por impressões e os 10 melhores por engajamentos
- Padrões: dia de postagem, época do mês, temas de conteúdo
- Muitas impressões + pouco engajamento: o que isso indica?
- Poucas impressões + muito engajamento: o que isso indica?

### Encaixe entre público e conteúdo
- Quem é o público central, com base nos dados demográficos
- Quais temas e formatos de conteúdo teriam ressonância
- Segmentos para investir mais ou menos

### Velocidade de crescimento
- Crescimento médio diário de seguidores
- Cenários de 30, 60 e 90 dias no ritmo atual, sinalizados como extrapolações e não como previsões
- Tendências de aceleração ou desaceleração

### Estratégia de dias e horários
- Melhores dias para impressões
- Melhores dias para engajamento
- Calendário de postagem ideal com base nos dados

### 5 recomendações específicas de conteúdo
Cada uma inclui:
- Ângulo ou tema de conteúdo
- Por que os dados sustentam a recomendação
- Qual segmento de público ela atinge
- Evidência e uma hipótese testável, sem garantia de impacto

## Passo 5. Ofereça o próximo passo

Depois da análise:

> Quer que eu transforme uma dessas 5 recomendações em post completo? Chame a skill post-writer ou post-formatter com o número da recomendação.

## Regras

- Use números, não adjetivos. "A taxa de engajamento é 2,3%" vale mais que "o engajamento está saudável".
- Mantenha a análise direta. Sem enchimento, sem palha.
- Nunca invente métricas que não estão na exportação.
- Sinalize problemas de qualidade dos dados (colunas faltando, períodos estranhos) em vez de contorná-los em silêncio.
- Nunca use travessões.
- Português do Brasil, a menos que o voice.md diga outra coisa.
- Recomende rodar isto todo mês. Os padrões só aparecem com o tempo.
