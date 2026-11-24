# Portal do Cliente

Portal para agências de marketing acompanharem cada cliente da entrada ao dia a dia: briefing, contrato, conteúdos, roteiros, agenda, tarefas, financeiro e pedidos extras.

O sistema é **multiagência** desde a base: a Agência Taynara Castro é a primeira conta, e outras agências podem usar a mesma instalação, cada uma isolada no banco com a própria marca.

## Stack

- Next.js 15 (App Router), TypeScript e Tailwind CSS 4
- Supabase: Postgres, autenticação, arquivos e regras de acesso por linha (RLS)
- Próximas fases: Resend (e-mail), Asaas (boleto e Pix), Autentique ou ZapSign (assinatura)

## Rodar localmente

Requisitos: Node 20.9 ou mais novo e Docker rodando.

```bash
npm install
npx supabase start          # sobe banco, autenticação e caixa de e-mail de teste
npx supabase db reset       # aplica as migrações e os dados fictícios de supabase/seed.sql
cp .env.example .env.local  # preencha com os valores de `npx supabase status`
npm run dev                 # http://localhost:3000
```

Os e-mails enviados no ambiente local (link mágico, nova senha) chegam na caixa de teste em http://127.0.0.1:54324.

### Usuários de teste (todos fictícios)

| Perfil | E-mail | Como entra |
| --- | --- | --- |
| Admin da Agência Taynara Castro | admin@agencia-tc.teste | senha `senha-local-123` |
| Equipe (social media, atende Aurora e Bravo) | social@agencia-tc.teste | senha `senha-local-123` |
| Equipe (designer, atende só Bravo) | designer@agencia-tc.teste | senha `senha-local-123` |
| Cliente Padaria Fictícia Aurora | cliente.aurora@exemplo.teste | link mágico |
| Cliente Estúdio Fictício Bravo | cliente.bravo@exemplo.teste | link mágico |
| Admin de outra agência (Exemplo Norte) | admin@exemplo-norte.teste | senha `senha-local-123` |
| Cliente da outra agência | cliente.cedro@exemplo.teste | link mágico |
| Dono da plataforma | dono@plataforma.teste | senha `senha-local-123` |

Essas senhas existem só no banco local. Em produção não há seed.

## Testes

```bash
npm test            # testes de RLS: provam que ninguém vê dados de outro cliente ou agência
npm run test:e2e    # roteiro no navegador (precisa do app rodando em localhost:3000)
```

O roteiro de navegador entra com cada perfil no desktop e no celular, confere o que cada um vê, testa o link mágico aberto em outro aparelho, confere que não há rolagem horizontal a 360 px e liga e desliga a verificação em duas etapas. Para salvar capturas de tela: `node tests/e2e/fase1.mjs pasta-de-saida`.

## Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Onde pegar | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | domínio do sistema | usada nos links dos e-mails |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API | pública, protegida pelo RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API | **secreta**, só no servidor |
| `SUPABASE_DB_URL` | `npx supabase status` | só para os testes |

## Configurar o Supabase em produção

1. Crie o projeto em supabase.com, região São Paulo (`sa-east-1`).
2. Ligue o projeto local: `npx supabase link --project-ref SEU_PROJETO` e envie o banco: `npx supabase db push`.
3. Em Authentication > URL Configuration, coloque o domínio do sistema em Site URL e em Redirect URLs.
4. Em Authentication > Sign In / Providers, desligue "Allow new users to sign up". Só a agência cria acessos.
5. Em Authentication > Multi-Factor, ligue TOTP.
6. Em Authentication > Emails, cole os modelos de `supabase/templates/` (link mágico, convite e nova senha) e configure o SMTP do Resend com o remetente verificado da agência.
7. Cadastre as variáveis de ambiente na Vercel.

## Estrutura

```
supabase/migrations/   banco, funções e regras de acesso (RLS)
supabase/seed.sql      dados fictícios para desenvolvimento
supabase/templates/    e-mails de acesso no visual da agência
src/app/entrar/        tela de entrada e verificação em duas etapas
src/app/(painel)/      telas logadas (menu lateral)
src/lib/               sessão, cliente do Supabase, marca da agência
tests/rls/             testes de isolamento no banco
tests/e2e/             roteiro no navegador
referencia/            protótipo de briefing usado como referência de conteúdo
```

Decisões de projeto ficam em `DECISOES.md`.
