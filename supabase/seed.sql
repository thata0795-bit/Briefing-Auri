-- Dados de teste LOCAIS. Tudo aqui é fictício.
-- Senha de todos os usuários de equipe e admin no ambiente local: senha-local-123
-- Clientes entram por link mágico (veja o e-mail em http://127.0.0.1:54324).

insert into public.agencias (id, nome, slug, email_contato) values
  ('a0000000-0000-4000-8000-000000000000', 'Plataforma (interna)', 'plataforma', null),
  ('a0000000-0000-4000-8000-000000000001', 'Agência Taynara Castro', 'taynara-castro', 'contato@agencia-tc.teste'),
  ('a0000000-0000-4000-8000-000000000002', 'Agência Exemplo Norte', 'exemplo-norte', 'contato@exemplo-norte.teste');

insert into public.clientes (id, agencia_id, nome, segmento, status) values
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', 'Padaria Fictícia Aurora', 'Alimentação', 'ativo'),
  ('c0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', 'Estúdio Fictício Bravo', 'Beleza e bem-estar', 'onboarding'),
  ('c0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000002', 'Loja Fictícia Cedro', 'Varejo', 'ativo');

create or replace function pg_temp.novo_usuario(p_id uuid, p_email text, p_meta jsonb, p_senha text)
returns void language plpgsql as $$
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
          case when p_senha is null then '' else crypt(p_senha, gen_salt('bf')) end, now(),
          jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')) || p_meta,
          '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
end;
$$;

-- Dono da plataforma: mora numa agência interna, sem clientes.
select pg_temp.novo_usuario('10000000-0000-4000-8000-000000000001', 'dono@plataforma.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000000","papel":"admin","nome":"Dono da Plataforma"}', 'senha-local-123');
insert into public.plataforma_admins (user_id) values ('10000000-0000-4000-8000-000000000001');

-- Agência Taynara Castro
select pg_temp.novo_usuario('20000000-0000-4000-8000-000000000001', 'admin@agencia-tc.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000001","papel":"admin","nome":"Admin Teste TC"}', 'senha-local-123');
select pg_temp.novo_usuario('20000000-0000-4000-8000-000000000002', 'social@agencia-tc.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000001","papel":"equipe","funcao":"social_media","nome":"Social Media Teste"}', 'senha-local-123');
select pg_temp.novo_usuario('20000000-0000-4000-8000-000000000003', 'designer@agencia-tc.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000001","papel":"equipe","funcao":"designer","nome":"Designer Teste"}', 'senha-local-123');
select pg_temp.novo_usuario('30000000-0000-4000-8000-00000000000a', 'cliente.aurora@exemplo.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000001","papel":"cliente","cliente_id":"c0000000-0000-4000-8000-00000000000a","nome":"Cliente Aurora"}', null);
select pg_temp.novo_usuario('30000000-0000-4000-8000-0000000000a2', 'socio.aurora@exemplo.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000001","papel":"cliente","cliente_id":"c0000000-0000-4000-8000-00000000000a","nome":"Sócio Aurora"}', null);
select pg_temp.novo_usuario('30000000-0000-4000-8000-00000000000b', 'cliente.bravo@exemplo.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000001","papel":"cliente","cliente_id":"c0000000-0000-4000-8000-00000000000b","nome":"Cliente Bravo"}', null);

-- Agência Exemplo Norte
select pg_temp.novo_usuario('40000000-0000-4000-8000-000000000001', 'admin@exemplo-norte.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000002","papel":"admin","nome":"Admin Teste Norte"}', 'senha-local-123');
select pg_temp.novo_usuario('30000000-0000-4000-8000-00000000000c', 'cliente.cedro@exemplo.teste',
  '{"agencia_id":"a0000000-0000-4000-8000-000000000002","papel":"cliente","cliente_id":"c0000000-0000-4000-8000-00000000000c","nome":"Cliente Cedro"}', null);

update public.clientes set responsavel_id = '20000000-0000-4000-8000-000000000002'
  where id in ('c0000000-0000-4000-8000-00000000000a', 'c0000000-0000-4000-8000-00000000000b');
update public.clientes set responsavel_id = '40000000-0000-4000-8000-000000000001'
  where id = 'c0000000-0000-4000-8000-00000000000c';

-- Social media atende Aurora e Bravo; designer atende só Bravo.
insert into public.equipe_clientes (cliente_id, agencia_id, user_id) values
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003');

insert into public.financeiro_clientes (cliente_id, agencia_id, plano, valor_mensal, dia_vencimento) values
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', 'Plano Essencial', 1500.00, 10),
  ('c0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', 'Plano Completo', 2800.00, 5),
  ('c0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000002', 'Plano Único', 900.00, 15);

insert into public.briefings (cliente_id, agencia_id, respostas) values
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', '{"negocio":{"nome":"Padaria Fictícia Aurora"}}'),
  ('c0000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', '{}'),
  ('c0000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000002', '{}');
