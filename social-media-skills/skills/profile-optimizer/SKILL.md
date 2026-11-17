---
name: profile-optimizer
description: >
  Reconstrói um perfil do LinkedIn para converter o máximo possível. Entrega opções de título (headline), seção Sobre, seção de Experiência, estratégia da seção Em Destaque e 4 prompts de geração de imagem (banner, foto de perfil, 2 cards de destaque). Use esta skill sempre que a pessoa disser "otimize meu perfil", "arrume meu LinkedIn", "reescreva meu título", "revisão de perfil", "auditoria de LinkedIn", "reconstrua meu perfil", ou quiser ajuda com qualquer parte do perfil do LinkedIn. Acione também quando a pessoa subir um PDF ou print do perfil do LinkedIn para revisão.
---

# Otimizador de Perfil

## Execução no Codex e no Claude

- Use esta skill no Codex ou no Claude com as ferramentas realmente disponíveis na tarefa atual. Os exemplos de `AskUserQuestion` descrevem as perguntas, não uma API obrigatória: use uma ferramenta de perguntas disponível, dentro dos limites dela, ou pergunte no chat. Reaproveite respostas e materiais já fornecidos.
- Trabalhe no projeto escolhido pela pessoa. Leia `about-me.md`, `voice.md` e os arquivos de marca relevantes antes de qualquer trabalho personalizado. Confirme quem é o autor pretendido se os arquivos se contradizem ou contêm valores iniciais de exemplo. Peça os dados que faltam ou rode o `voice-builder`; nunca herde a identidade, as contas ou os arquivos privados do mantenedor.
- Resolva a pasta `references/` incluída a partir da pasta desta skill. Quando a pessoa pedir explicitamente uma atualização de perfil, leia e atualize no próprio lugar os arquivos canônicos `about-me.md`, `voice.md` ou `newsletter-voice.md`, preservando fatos e regras não relacionados. Quem consome esses arquivos deve relê-los. Use um nome de arquivo novo apenas para entregas novas que colidiriam com arquivos existentes não relacionados. A instalação sozinha nunca inicia uma entrevista nem grava arquivos. Não grave aprendizados persistentes sem pedido.
- Use primeiro as evidências fornecidas. Verifique afirmações externas com as ferramentas de busca e fontes disponíveis quando necessário. Se uma fonte ou integração não estiver disponível, diga qual capacidade falta e ofereça a opção de receber texto ou exportação. Nunca invente fatos, experiências em primeira pessoa, métricas ou uma execução bem-sucedida de ferramenta.
- Conecte apenas os serviços necessários para o caminho escolhido, pela conta que a pessoa já tem. Nunca exiba credenciais nem sobrescreva conexões. Redigir, salvar e revisar não autorizam publicar, enviar mensagens ou alterar contas.

## Estado de conclusão visual

Os prompts de imagem desta skill ficam **prontos para uso como prompt**, não são imagens geradas nem revisadas visualmente. Mantenha o fluxo com o Gemini, a menos que a pessoa peça outro gerador. A falta de um serviço de imagem não impede escrever o prompt. Quando houver imagens fornecidas ou geradas, abra e inspecione cada exportação em tamanho real e em tamanho de feed (cerca de 360px de largura, 320px para thumbnails). Confira o texto exato, as dimensões, cortes, legibilidade, cores da marca, aparência das fontes, logos e fidelidade à referência. Corrija e inspecione de novo as exportações com problema. Registre como pendente qualquer exportação ou inspeção que não foi possível fazer. Um prompt de imagem ou uma exportação rasterizada não é um arquivo de design editável.

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Não explique o que vai entregar. Comece a coletar as informações imediatamente.

## Passo 1. Colete as informações

Procure o about-me.md no projeto. Se existir, preencha nome, público, temas e ponto de vista a partir dele. Pule essas perguntas e diga à pessoa o que você aproveitou.

Chame o AskUserQuestion em dois lotes.

### Lote 1

```json
[
  {
    "question": "Qual é o objetivo principal da sua presença no LinkedIn?",
    "header": "Objetivo",
    "multiSelect": false,
    "options": [
      {"label": "Calls agendadas", "description": "Gerar calls de descoberta ou demonstrações"},
      {"label": "Leads inbound", "description": "Atrair prospects que entram em contato com você"},
      {"label": "Assinantes de newsletter", "description": "Crescer sua lista de e-mails a partir do LinkedIn"},
      {"label": "Oportunidades de emprego", "description": "Fazer recrutadores e gestores te procurarem"}
    ]
  },
  {
    "question": "Qual é a sua principal oferta ou serviço?",
    "header": "Oferta",
    "multiSelect": false,
    "options": [
      {"label": "Mentoria", "description": "Mentoria individual ou em grupo"},
      {"label": "Consultoria", "description": "Trabalho de aconselhamento ou estratégia"},
      {"label": "Serviços de agência", "description": "Serviços executados para clientes"},
      {"label": "Freelance", "description": "Trabalho por projeto ou contrato"}
    ]
  },
  {
    "question": "Você tem cores de marca (códigos hex)?",
    "header": "Cores",
    "multiSelect": false,
    "options": [
      {"label": "Não, sugira para mim", "description": "Escolha cores com base no meu posicionamento"},
      {"label": "Sim, vou colar", "description": "Tenho códigos hex específicos para usar"}
    ]
  },
  {
    "question": "Alguma prova social que você quer destacar?",
    "header": "Prova",
    "multiSelect": false,
    "options": [
      {"label": "Anos de experiência", "description": "Ex.: mais de 10 anos em marketing"},
      {"label": "Resultados de clientes", "description": "Ex.: ajudei mais de 200 clientes"},
      {"label": "Aparições na mídia", "description": "Ex.: destaque na Forbes"},
      {"label": "Vou digitar a minha", "description": "Deixe eu colar provas específicas"}
    ]
  }
]
```

### Lote 2

```json
[
  {
    "question": "Quais links externos você quer na seção Em Destaque? (máximo 2)",
    "header": "Links",
    "multiSelect": false,
    "options": [
      {"label": "Agenda + newsletter", "description": "Link principal para agendar calls, secundário para assinar"},
      {"label": "Portfólio + agenda", "description": "Mostrar o trabalho primeiro, depois converter"},
      {"label": "Vou colar as URLs", "description": "Tenho links específicos para usar"}
    ]
  },
  {
    "question": "Como eu recebo o seu perfil atual?",
    "header": "Perfil atual",
    "multiSelect": false,
    "options": [
      {"label": "Vou colar", "description": "Vou copiar e colar meu título, Sobre e Experiência"},
      {"label": "Começar do zero", "description": "Ignore meu perfil atual e monte do zero usando meu about-me.md"},
      {"label": "Vou subir um print", "description": "Vou compartilhar um print ou PDF do meu perfil"}
    ]
  }
]
```

Espere todas as informações antes de seguir.

## Passo 2. O título (headline)

Escreva 3 opções de título. Entregue em um bloco de código.

Restrições:
- No máximo 50 caracteres cada
- Só a primeira letra da frase em maiúscula (sem Iniciais Maiúsculas Em Todas As Palavras)
- Comece pelo valor central
- Inclua o público-alvo quando os caracteres permitirem
- Sem cargos (nada de "Fundador" / "CEO" / "Designer")
- Sem palavras vazias

Formato: [Valor central] + [para público-alvo]

```
Opção 1 (Direta): [resultado + público]
Opção 2 (Foco na dor): [problema + público]
Opção 3 (Diferencial): [ângulo único + público]
```

Depois chame o AskUserQuestion para a pessoa escolher:

```json
[
  {
    "question": "Qual título você quer usar?",
    "header": "Título",
    "multiSelect": false,
    "options": [
      {"label": "Opção 1", "description": "[O texto real do título acima]"},
      {"label": "Opção 2", "description": "[O texto real do título acima]"},
      {"label": "Opção 3", "description": "[O texto real do título acima]"}
    ]
  }
]
```

## Passo 3. A seção Sobre

Entregue em um bloco de código. Regras de formatação:
- Escreva frases completas. Não force quebras de linha no meio da frase.
- Uma quebra de linha entre frases ou expressões curtas para facilitar a leitura.
- Quebra dupla entre as partes (gancho, história, autoridade, CTA).
- O LinkedIn cuida da quebra de texto no celular e no desktop. Não quebre manualmente a cada 50 ou 60 caracteres.
- Frases curtas e diretas são boas. Cortar frases ao meio não é.

Estrutura: Gancho > Dificuldade/Empatia > Método/Filosofia > Autoridade > CTA

Tom: direto, enxuto, humano. Nada corporativo.

Exemplo apenas de formatação; substitua pelos fatos fornecidos, nunca por uma biografia inventada:
```
[Ponto de partida real da pessoa, se informado.]
[Resultado verificado, com o prazo correto.]

[O que ela faz e como isso ajuda o público dela.]
[Um exemplo concreto da experiência que ela informou.]

[Oferta atual e próximo passo confirmado.]
```

## Passo 4. A seção de Experiência

Reescreva os 2 cargos mais recentes. Entregue em um bloco de código. Mesma abordagem de formatação da seção Sobre: frases completas, sem quebras forçadas no meio da frase, o LinkedIn cuida da quebra.

Estrutura por cargo: Contexto > Desafio > Ação > Resultado

Formato narrativo, não tópicos. No máximo 8 a 15 frases por cargo.

Exemplo apenas de formatação; substitua pelos fatos fornecidos, nunca por uma biografia inventada:
```
Entrei em um time que tinha perdido 3 gestores em 2 anos.
O ânimo tinha acabado. O faturamento estava caindo.

Não comecei com apresentações de estratégia. Comecei ouvindo.

Em 6 meses reconstruímos a cultura.
Em 12 meses o faturamento subiu 40%.

Isso me ensinou tudo sobre liderar no caos.
```

Exemplo de formatação incorreta:
- Gerenciei um time de 15 representantes de vendas
- Responsável pelas metas de faturamento do 3º trimestre
- Implementei um novo sistema de CRM

## Passo 5. Estratégia da seção Em Destaque

No máximo 2 itens. Os dois devem ser links externos.

Item 1: objetivo principal de conversão
- Propósito: caminho direto para a oferta principal (página de agendamento, formulário de inscrição, página de vendas)
- Título: 3 a 5 palavras, focado no benefício

Item 2: construção de valor secundária
- Propósito: gerar confiança ou capturar leads (inscrição na newsletter, material gratuito, portfólio, estudo de caso)
- Título: 3 a 5 palavras, focado no benefício

Sem subtítulos. Sem posts internos do LinkedIn. Sem itens do tipo "me chama no direct".

## Passo 6. Briefing de design visual

Entregue 4 prompts de geração de imagem separados, cada um em seu próprio bloco de código. Cada prompt deve ser completo por si só e funcionar quando colado no Gemini como um pedido independente.

Informe as cores da marca no topo:
- Hex primário: [informado pela pessoa ou sugerido]
- Hex secundário: [informado pela pessoa ou sugerido]
- Uma linha sobre por que essas cores combinam com o posicionamento

### Peça 1: banner do LinkedIn (1584 x 396 pixels)

O prompt deve:
- Dizer "Usando a foto minha em anexo..."
- Criar o banner nas dimensões exatas
- Posicionar o texto do título escolhido no centro-direita
- Colocar uma frase de apoio de 5 a 8 palavras abaixo do título
- Incluir um elemento de botão de CTA (3 a 4 palavras)
- Incluir apenas provas sociais fornecidas e confirmadas pela pessoa; omitir se não houver
- Usar as cores da marca
- Especificar o estilo do fundo

### Peça 2: foto de perfil (400 x 400 pixels)

O prompt deve:
- Dizer "Usando a foto de rosto em anexo como base..."
- Aplicar fundo na cor da marca (sólido ou degradê)
- Centralizar o rosto ocupando 60 a 70% do quadro
- Funcionar quando recortada em círculo
- Acrescentar borda na cor da marca, se fizer sentido

### Peça 3: card de destaque 1 (552 x 368 pixels)

- Texto do título do Item em Destaque 1 como ponto focal
- Cores da marca iguais às do banner
- Indicação visual simples de clique (ícone de seta)
- Limpo, minimalista, sem subtítulo nem texto corrido
- Sem foto

### Peça 4: card de destaque 2 (552 x 368 pixels)

- Texto do título do Item em Destaque 2 como ponto focal
- Visualmente diferente do card 1 (inverter o uso das cores primária e secundária)
- Sem foto

Depois dos 4 prompts, diga:

> Copie cada prompt em uma conversa nova do Gemini, um de cada vez. Para o banner e a foto de perfil, anexe sua foto de rosto junto com o prompt. Os cards de destaque não precisam de foto.

## Regras

- Sempre leia o about-me.md se existir e preencha as informações a partir dele.
- Todo texto do perfil (título, Sobre, Experiência) deve ir em blocos de código.
- Escreva frases completas. Não force quebras no meio da frase. O LinkedIn cuida da quebra.
- Sem cargos nos títulos.
- Nenhum parágrafo em bloco em lugar nenhum.
- Cada prompt de imagem deve ser completo por si só.
- Nunca use travessões.
- Português do Brasil em tudo.
- NÃO ofereça escrever um post de lançamento ou uma estratégia de engajamento depois do briefing de design. Termine no briefing de design.
