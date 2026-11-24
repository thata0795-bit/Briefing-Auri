# Decisões do projeto

Registro das decisões tomadas durante a construção do portal. Cada item diz o que foi decidido e por quê.

## 001. Logo
- Original salvo em `public/brand/logo.png` (foto da placa enviada na conversa).
- A partir dele foram gerados `logo-dourado.png` e `monograma-dourado.png`, com fundo transparente. Só o fundo da parede foi removido: desenho, proporção e cor do dourado são os da foto.
- O ícone da aba (`src/app/icon.png`) é um recorte quadrado da foto com o monograma TC.
- A logo fica sempre sobre o marrom (`--brown-mid`), como na peça original.
- Pendente: receber o arquivo vetorial (SVG) ou um PNG original da logo. A versão tirada da foto serve bem em tela, mas o vetor fica mais nítido em telas grandes e no e-mail.

## 002. Sem a pasta /referencia
- Os quatro protótipos citados no prompt não existem. O único material é `referencia/briefing-auri-studio.html` (5 seções de briefing).
- Na Fase 2, o briefing de 10 seções será montado a partir dessas 5 seções e das seções descritas no prompt (negócio, público, identidade, redes, projeto, mais concorrência, produtos, tom de voz, materiais e acessos, objetivos do mês).

## 003. Multiagência desde a base
- O sistema começa como portal da Agência Taynara Castro e será vendido para outras agências e social medias. Por isso existe a tabela `agencias`, e toda tabela de negócio guarda `agencia_id` além de `cliente_id`.
- O RLS confere primeiro a agência e depois o vínculo com o cliente. Testes provam que o admin de uma agência não vê nada de outra.
- Cada agência tem o campo `marca` (logo e cores). Sem valor, vale o tema da Taynara Castro. Só cores hexadecimais em chaves conhecidas viram CSS, então nada do banco injeta estilo arbitrário.
- Cobrança das agências pelo uso do sistema (assinatura do SaaS) fica fora desta versão. Entra depois da Fase 5, reaproveitando a integração com o Asaas.

## 004. Dono da plataforma não lê dados de clientes
- Existe um nível acima das agências (`plataforma_admins`), para quem vende o sistema. Ele vê a lista de agências e contagens, mas o RLS bloqueia clientes, briefings e financeiro das agências.
- Motivo: LGPD. A agência é a controladora dos dados dos clientes dela, e quem vende o sistema é operador e não precisa enxergar esse conteúdo.
- Suporte técnico, quando necessário, usa acesso pelo painel do Supabase com registro, nunca pelo app.

## 005. Perfis e criação de acesso
- Papéis: `admin`, `equipe` (com função: social media, designer, captação, gestão) e `cliente`.
- O perfil nasce de um gatilho no cadastro do usuário, lendo `agencia_id`, `papel` e `cliente_id` de `app_metadata`. Esse campo só o servidor define, então ninguém escolhe o próprio papel.
- Cadastro público desligado: só a agência cria acessos (Fase 2, convite).
- Ninguém altera o próprio papel. Só o admin da agência muda papel, função ou status de outra pessoa.
- Perfil inativo perde o acesso na hora, sem esperar o token vencer.

## 006. Financeiro separado
- Valor, plano e vencimento ficam em `financeiro_clientes`, não em `clientes`. Assim a equipe vê o cliente sem ver valores, e a regra fica no banco.

## 007. Login
- Cliente: link mágico, sem senha. O link usa `token_hash` em vez do fluxo PKCE, para funcionar quando o pedido sai do computador e o e-mail é aberto no celular.
- Equipe e admin: e-mail e senha (mínimo de 10 caracteres, com letras e números), com recuperação por e-mail.
- A tela responde igual para e-mail cadastrado e não cadastrado, para não revelar quem é cliente.
- As chamadas de login saem do navegador direto para o Supabase. Assim o limite de tentativas do Supabase conta por pessoa (IP do usuário), e não pelo IP do servidor, que seria o mesmo para todos.

## 008. Verificação em duas etapas
- Aplicativo autenticador (TOTP), opcional, oferecido a admin e equipe. Recomendado para admin.
- Garantida no banco: uma regra restritiva em todas as tabelas exige sessão confirmada com código (`aal2`) para quem cadastrou autenticador. Mesmo com a senha, sem o código a API não devolve nada.
- A confirmação extra para abrir o financeiro (seção 4) entra na Fase 5, junto com a tela do financeiro.

## 009. Contraste do texto secundário
- `#8A7762`, medido na logo, dá 3,98:1 sobre o fundo `#FAF6EE`, abaixo do nível AA (4,5:1).
- Para texto, `--muted` passou a `#6E5B48` (6,1:1). O tom original continua como `--muted-soft`, para ícones e detalhes.
- Dourado (`--gold`) sobre fundo claro dá 2,2:1. Ele é usado só em detalhes e nos números de seção decorativos, nunca em texto que precise ser lido.
- Para os status da seção 8, a cor aparece como borda e fundo suave do selo, sempre com texto escuro e ícone.

## 010. Segurança da aplicação
- Cabeçalhos: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- O parâmetro `voltar` da tela de entrada só aceita caminhos internos, para não virar redirecionamento para fora.
- Sair exige POST vindo do próprio site.
- Funções de apoio ao RLS ficam no schema `privado`, que a API não expõe.

## 011. Ambiente local
- O Supabase local roda pelo Docker (`npx supabase start`), com banco, autenticação e caixa de e-mail de teste. Os testes de RLS usam essa mesma instância.
