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

## 012. Convite com token próprio (Fase 2)
- O link do convite não é o link mágico do Supabase, que vence em 1 hora. É um token nosso, de 7 dias e uso único, guardado só como hash (`convites.token_hash`).
- O link abre uma tela com o botão "Entrar no portal". A sessão só é criada no clique (POST), porque leitores de e-mail corporativo abrem links sozinhos e queimariam um convite que abrisse direto.
- Reenviar convite invalida o anterior.
- Os e-mails do sistema saem pelo nosso código (React Email), não pelos modelos do Supabase. Assim cada agência manda com o próprio nome e o visual dela. Canal: Resend quando houver `RESEND_API_KEY`, SMTP local em desenvolvimento.
- Limitação: um e-mail tem acesso a uma agência só. Se a mesma pessoa for cliente de duas agências, usa dois e-mails. Dá para mudar depois, se for comum.

## 013. Perfil criado também na atualização do usuário
- O Auth do Supabase cria o usuário e grava `app_metadata` num segundo passo. O gatilho que cria o perfil passou a rodar também nessa atualização. Um perfil existente nunca muda de agência ou papel por esse caminho (há teste cobrindo).

## 014. Entrada em ordem, garantida no banco
- Etapas: boas-vindas (aceite dos termos), contrato, briefing, acessos, primeira reunião. Cada uma só abre com a anterior concluída. A regra vale nas funções do banco, não só na tela.
- O contrato só conclui pela confirmação da assinatura (webhook com HMAC) ou quando o admin marca "assinado fora do sistema", e isso fica na auditoria.
- A reserva da primeira reunião é atômica: o horário é travado na transação, então dois clientes não pegam o mesmo.
- Concluir a última etapa muda o cliente para "Ativo".

## 015. Assinatura eletrônica simulada até a escolha da ferramenta
- `ProvedorAssinatura` é a interface; Autentique e ZapSign entram como implementações. Enquanto nenhuma é escolhida, um provedor simulado gera uma tela de assinatura local que chama o mesmo webhook, com a mesma verificação HMAC. Ele não roda em produção.
- O contrato é gerado a partir de um modelo da agência com campos `{{cliente.nome}}`, `{{plano.valor}}` etc. O modelo do seed é um texto de exemplo e precisa ser trocado pelo contrato real.
- Por enquanto o contrato é texto. O PDF para a ferramenta de assinatura entra junto com a integração escolhida.

## 016. Briefing
- 10 partes: negócio, produtos, público, concorrência, identidade visual, tom de voz, redes, objetivos, materiais e captação, combinados. As partes 1, 3, 5, 7 e 10 reaproveitam as perguntas e opções do protótipo da Auri Studio.
- Cada resposta salva sozinha: escolhas na hora, texto 0,7 s depois de parar de digitar ou ao sair do campo. A gravação é por pergunta (`jsonb_set`), então duas abas abertas não apagam a resposta uma da outra.
- "Responder depois" marca a pergunta; obrigatória marcada para depois não impede concluir, e a agência vê a lista.
- Arquivos (logo, manual, fotos) vão direto do navegador para o bucket privado `arquivos`, no caminho `{agencia}/{cliente}/briefing/`. As regras do bucket conferem agência e cliente pelo caminho. A agência abre os arquivos por links assinados de 5 minutos.
- Limite de 50 MB por arquivo (o limite do plano gratuito do Supabase). Vídeos brutos maiores entram pela área de arquivos na Fase 3, com envio em partes.

## 017. Horários livres e fuso
- A agência abre horários (com repetição semanal). Datas digitadas são lidas como horário de Brasília (UTC-3; o Brasil não tem horário de verão desde 2019) e gravadas em UTC.
- Cada compromisso tem .ics e link do Google Agenda. O lembrete de 48h entra na Fase 4, que vai ler os compromissos.

## 018. Navegação depois de ações no Next 15.5
- Em telas dentro de uma fronteira de carregamento (`loading.tsx`), o Next 15.5 às vezes não aplica a resposta de uma ação do servidor (redirecionamento ou atualização). Medido nos testes de navegador.
- Por isso: a tela de carregamento fica só no Início, que não tem ações; e depois de concluir uma etapa ou cadastrar um cliente, o navegador carrega a próxima tela inteira (`navegarDepoisDeSalvar`). Reavaliar quando atualizar o Next.

## 019. Termos e política de privacidade
- Textos em `/termos` e `/privacidade`, versão `2026-11-v1`, aceitos nas boas-vindas e registrados com data e versão no perfil e na auditoria.
- São um ponto de partida e precisam de revisão jurídica antes do lançamento.

## 020. Ainda não feito nesta fase (vai para a Fase 4)
- Aviso em tempo real para a agência a cada etapa concluída (sino) e alerta de cliente parado 3 dias. Os dados já estão gravados (etapas com data e auditoria); falta a central de notificações e o agendador.
