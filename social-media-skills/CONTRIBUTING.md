# Contribuindo

Obrigado pelo interesse em melhorar estas skills. Este guia explica como adicionar skills novas, melhorar as existentes e enviar alterações.

## Começo rápido

1. Faça um fork do repositório
2. Crie um branch de trabalho (`feat/nome-da-skill-nova` ou `fix/problema-na-skill`)
3. Faça suas alterações
4. Rode `./validate-skills.sh` para conferir as alterações contra a especificação
5. Abra um PR

## Adicionando uma skill nova

1. Crie uma pasta nova em `skills/` com nome em minúsculas e hífens, igual ao campo `name` da skill.
2. Adicione um arquivo `SKILL.md` com frontmatter YAML.

Frontmatter mínimo:

```yaml
---
name: minha-skill-nova
description: >
  Uma ou duas frases explicando o que a skill faz e quando usar. Inclua frases de acionamento específicas que a pessoa pode dizer, como "escreva um post sobre", "avalie meu rascunho" ou "monte um carrossel". A primeira palavra da descrição deve ser um verbo ou uma ação.
---
```

3. Escreva o corpo da skill. A maioria das skills segue esta estrutura:

```markdown
# Nome da Skill

## CRÍTICO: início automático ao carregar

Quando esta skill for acionada, vá direto para o Passo 1. Não resuma. Comece imediatamente.

## Passo 1. Colete as informações
[Use o AskUserQuestion sempre que possível]

## Passo 2. [Trabalho principal]

## Passo 3. Entrega
[Bloco de código mostrando o formato exato da entrega]

## Regras
[O que é inegociável. Regras de voz, limites de palavras, o que nunca fazer]
```

4. Mantenha o `SKILL.md` abaixo de 500 linhas. Mova material de referência para `skills/minha-skill-nova/references/`.
5. Se a skill tiver modelos ou arquivos de apoio, coloque em `skills/minha-skill-nova/assets/`.
6. Se a skill rodar scripts de shell, coloque em `skills/minha-skill-nova/scripts/`.

## Melhorando uma skill existente

- Mantenha o `name` do frontmatter YAML igual ao nome da pasta.
- Não quebre as frases de acionamento da descrição. Outras pessoas dependem delas.
- Se mudar o formato de entrega, atualize a seção de entrega da skill.
- Teste a skill em um projeto limpo do Codex ou do Claude antes de abrir um PR.

## Regras de estilo

Estas regras valem para todas as skills do repositório:

- Português do Brasil em tudo
- Frases curtas. Sem travessões. Sem ponto e vírgula.
- Nunca use: "alavancar", "mergulho profundo", "desbloquear", "divisor de águas", "revolucionário"
- Use o AskUserQuestion para coletar informações quando uma chamada de ferramenta for melhor do que digitar perguntas
- A seção de regras no final cobre o que é inegociável, com frases de "nunca" e "sempre"
- Toda skill que produz um arquivo (como o voice-builder gerando o `about-me.md`) informa o nome exato do arquivo e o local
- Toda skill que depende do resultado de outra skill confere se ele existe antes de rodar

## Convenções de nome

- Nome da pasta = campo `name` do YAML = minúsculas, separadas por hífen, sem espaços
- Os nomes das skills funcionam como verbo-objeto ou substantivos que descrevem a entrega (`post-writer`, não `writing-posts`)
- Nomes curtos. No máximo três palavras, quando possível.
- Nesta versão traduzida, os nomes continuam em inglês para manter a compatibilidade com o plugin original.

## Testando localmente

Siga o caminho de instalação do README para o seu assistente. Para uma única skill local no Codex, preserve qualquer instalação existente:

```bash
test ! -e .agents/skills/minha-skill-nova && test ! -L .agents/skills/minha-skill-nova && mkdir -p .agents/skills && cp -R skills/minha-skill-nova .agents/skills/
```

Depois acione a skill em uma tarefa nova no projeto escolhido, com as frases listadas na descrição. Confirme que:

- O assistente reconhece a skill pela frase de acionamento
- As informações são coletadas corretamente com uma ferramenta de perguntas disponível ou pelo chat
- A entrega segue o formato da skill
- Todas as dependências externas (Apify, Gemini etc.) são conferidas antes do uso

## Enviando um PR

- Título: `feat: adiciona [nome-da-skill]` ou `fix: [nome-da-skill] [descrição breve]`
- Corpo: descreva o que mudou e por quê, com exemplo de entrada e saída quando fizer sentido
- Cite a issue relacionada, se houver

Dúvidas? Abra uma issue no GitHub.

- Rode `python3 tests/test-codex-portability.py` para as verificações de preservação na instalação e de instruções portáveis.
- Informe chamadas reais a provedores, exportações e inspeções de imagem separadamente das verificações estáticas.
- Mantenha as skills públicas independentes de fluxos privados, contas pessoais e caminhos de máquina.
