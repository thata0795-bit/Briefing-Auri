-- Fase 1: base multiagência, perfis e regras de acesso por linha (RLS).
--
-- Modelo de isolamento:
--   agência  > clientes > dados do cliente
-- Toda tabela de negócio carrega agencia_id e cliente_id. O RLS confere
-- primeiro a agência e depois o vínculo do usuário com o cliente.
--
-- Funções de apoio ficam no schema "privado", que não é exposto pela API.

create extension if not exists pgcrypto;

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
grant usage on schema privado to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.papel as enum ('admin', 'equipe', 'cliente');
create type public.funcao_equipe as enum ('social_media', 'designer', 'captador', 'gestor', 'outro');
create type public.status_cliente as enum ('convidado', 'onboarding', 'ativo', 'pausado', 'encerrado');

-- ---------------------------------------------------------------------------
-- Gatilho padrão de atualizado_em
-- ---------------------------------------------------------------------------
create or replace function privado.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Agências (tenants). A Taynara Castro é a primeira.
-- ---------------------------------------------------------------------------
create table public.agencias (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (length(trim(nome)) between 2 and 120),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Marca da agência: logo, cores e contato. Tokens ausentes usam o tema padrão.
  marca         jsonb not null default '{}'::jsonb,
  email_contato text,
  telefone      text,
  ativa         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Donos da plataforma (quem vende o sistema). Gerenciam agências,
-- mas não leem dados de clientes das agências (LGPD).
create table public.plataforma_admins (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Perfis: um por usuário do auth. Cada usuário pertence a uma agência.
-- ---------------------------------------------------------------------------
create table public.perfis (
  id            uuid primary key references auth.users (id) on delete cascade,
  agencia_id    uuid not null references public.agencias (id) on delete cascade,
  papel         public.papel not null,
  funcao        public.funcao_equipe,
  nome          text not null default '',
  email         text not null,
  telefone      text,
  ativo         boolean not null default true,
  termos_aceitos_em timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint funcao_so_para_equipe check (funcao is null or papel = 'equipe')
);
create index perfis_agencia_idx on public.perfis (agencia_id);

-- ---------------------------------------------------------------------------
-- Clientes da agência
-- ---------------------------------------------------------------------------
create table public.clientes (
  id              uuid primary key default gen_random_uuid(),
  agencia_id      uuid not null references public.agencias (id) on delete cascade,
  nome            text not null check (length(trim(nome)) between 2 and 160),
  segmento        text,
  status          public.status_cliente not null default 'convidado',
  responsavel_id  uuid references public.perfis (id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  unique (id, agencia_id)
);
create index clientes_agencia_idx on public.clientes (agencia_id);

-- Usuários do lado do cliente (sócio, gerente de marketing...).
create table public.cliente_usuarios (
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  user_id       uuid not null references public.perfis (id) on delete cascade,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (cliente_id, user_id),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index cliente_usuarios_user_idx on public.cliente_usuarios (user_id);

-- Atribuição de membros da equipe aos clientes.
create table public.equipe_clientes (
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  user_id       uuid not null references public.perfis (id) on delete cascade,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (cliente_id, user_id),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index equipe_clientes_user_idx on public.equipe_clientes (user_id);

-- Dados comerciais do cliente. Separados de "clientes" porque a equipe
-- não pode ver valores.
create table public.financeiro_clientes (
  cliente_id       uuid primary key,
  agencia_id       uuid not null,
  plano            text not null,
  valor_mensal     numeric(12, 2) not null check (valor_mensal >= 0),
  dia_vencimento   smallint not null check (dia_vencimento between 1 and 28),
  forma_pagamento  text not null default 'boleto' check (forma_pagamento in ('boleto', 'pix', 'cartao')),
  inicio_contrato  date,
  fim_contrato     date,
  reajuste         text,
  observacoes      text,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

-- Briefing do cliente (respostas salvas como JSON por seção). Preenchido na Fase 2.
create table public.briefings (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null unique,
  agencia_id    uuid not null,
  respostas     jsonb not null default '{}'::jsonb,
  concluido_em  timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

-- Auditoria: quem fez o quê e quando. Só se escreve por função.
create table public.auditoria (
  id            bigint generated always as identity primary key,
  agencia_id    uuid references public.agencias (id) on delete cascade,
  cliente_id    uuid,
  user_id       uuid,
  acao          text not null,
  entidade      text,
  entidade_id   text,
  detalhes      jsonb not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index auditoria_agencia_idx on public.auditoria (agencia_id, criado_em desc);

-- Gatilhos de atualizado_em
do $$
declare t text;
begin
  foreach t in array array['agencias','plataforma_admins','perfis','clientes','cliente_usuarios',
                           'equipe_clientes','financeiro_clientes','briefings','auditoria']
  loop
    execute format('create trigger tocar_atualizado_em before update on public.%I
                    for each row execute function privado.tocar_atualizado_em()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funções de apoio ao RLS (security definer para não cair em recursão)
-- ---------------------------------------------------------------------------
create or replace function privado.minha_agencia()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select p.agencia_id from public.perfis p
  where p.id = (select auth.uid()) and p.ativo
$$;

create or replace function privado.meu_papel()
returns public.papel
language sql stable security definer
set search_path = ''
as $$
  select p.papel from public.perfis p
  where p.id = (select auth.uid()) and p.ativo
$$;

create or replace function privado.e_admin_da(agencia uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = (select auth.uid()) and p.ativo
      and p.papel = 'admin' and p.agencia_id = agencia
  )
$$;

create or replace function privado.e_dono_plataforma()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.plataforma_admins a where a.user_id = (select auth.uid()))
$$;

-- Pode ver os dados operacionais do cliente: admin da agência,
-- equipe atribuída ou usuário do próprio cliente.
create or replace function privado.pode_ver_cliente(cliente uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clientes c
    join public.perfis p on p.id = (select auth.uid()) and p.ativo and p.agencia_id = c.agencia_id
    where c.id = cliente
      and (
        p.papel = 'admin'
        or (p.papel = 'equipe' and exists (
              select 1 from public.equipe_clientes e where e.cliente_id = c.id and e.user_id = p.id))
        or (p.papel = 'cliente' and exists (
              select 1 from public.cliente_usuarios u where u.cliente_id = c.id and u.user_id = p.id))
      )
  )
$$;

-- Pode editar dados operacionais: admin ou equipe atribuída.
create or replace function privado.pode_editar_cliente(cliente uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clientes c
    join public.perfis p on p.id = (select auth.uid()) and p.ativo and p.agencia_id = c.agencia_id
    where c.id = cliente
      and (
        p.papel = 'admin'
        or (p.papel = 'equipe' and exists (
              select 1 from public.equipe_clientes e where e.cliente_id = c.id and e.user_id = p.id))
      )
  )
$$;

-- É usuário do próprio cliente.
create or replace function privado.e_usuario_do_cliente(cliente uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cliente_usuarios u
    join public.perfis p on p.id = u.user_id and p.ativo
    where u.cliente_id = cliente and u.user_id = (select auth.uid())
  )
$$;

-- Financeiro: admin da agência ou usuário do próprio cliente. Equipe nunca.
create or replace function privado.pode_ver_financeiro(cliente uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clientes c
    where c.id = cliente and privado.e_admin_da(c.agencia_id)
  ) or privado.e_usuario_do_cliente(cliente)
$$;

-- Pode ver o perfil de outra pessoa.
create or replace function privado.pode_ver_perfil(alvo uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  with eu as (
    select p.id, p.agencia_id, p.papel from public.perfis p
    where p.id = (select auth.uid()) and p.ativo
  ), ele as (
    select p.id, p.agencia_id, p.papel from public.perfis p where p.id = alvo
  )
  select exists (
    select 1 from eu, ele
    where eu.agencia_id = ele.agencia_id
      and (
        eu.id = ele.id
        or eu.papel = 'admin'
        -- equipe enxerga a equipe da agência e os usuários dos clientes atribuídos
        or (eu.papel = 'equipe' and (
              ele.papel in ('admin', 'equipe')
              or exists (select 1 from public.cliente_usuarios u
                         join public.equipe_clientes e on e.cliente_id = u.cliente_id
                         where u.user_id = ele.id and e.user_id = eu.id)))
        -- cliente enxerga colegas da mesma conta e a equipe atribuída a ela
        or (eu.papel = 'cliente' and exists (
              select 1 from public.cliente_usuarios minha
              where minha.user_id = eu.id
                and (exists (select 1 from public.cliente_usuarios u
                             where u.cliente_id = minha.cliente_id and u.user_id = ele.id)
                     or exists (select 1 from public.equipe_clientes e
                                where e.cliente_id = minha.cliente_id and e.user_id = ele.id)
                     or exists (select 1 from public.clientes c
                                where c.id = minha.cliente_id and c.responsavel_id = ele.id))))
      )
  )
$$;

revoke all on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Integridade: ninguém troca o próprio papel ou agência pelo app
-- ---------------------------------------------------------------------------
create or replace function privado.proteger_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if new.agencia_id <> old.agencia_id or new.email <> old.email then
    raise exception 'Agência e e-mail não podem ser alterados por aqui.' using errcode = '42501';
  end if;
  if (new.papel <> old.papel or new.ativo <> old.ativo or new.funcao is distinct from old.funcao)
     and not privado.e_admin_da(old.agencia_id) then
    raise exception 'Somente o admin da agência altera papel, função ou status.' using errcode = '42501';
  end if;
  if new.id = (select auth.uid()) and new.papel <> old.papel then
    raise exception 'Ninguém altera o próprio papel.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger proteger_perfil before update on public.perfis
  for each row execute function privado.proteger_perfil();

-- Vínculos precisam respeitar o papel e a agência de quem é vinculado.
create or replace function privado.validar_vinculo()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  esperado public.papel := case tg_table_name when 'cliente_usuarios' then 'cliente'::public.papel
                                              else 'equipe'::public.papel end;
begin
  if not exists (select 1 from public.perfis p
                 where p.id = new.user_id and p.agencia_id = new.agencia_id and p.papel = esperado) then
    raise exception 'Usuário não pertence a esta agência com o papel esperado.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validar_vinculo before insert or update on public.cliente_usuarios
  for each row execute function privado.validar_vinculo();
create trigger validar_vinculo before insert or update on public.equipe_clientes
  for each row execute function privado.validar_vinculo();

-- ---------------------------------------------------------------------------
-- Criação de perfil ao cadastrar usuário no auth.
-- agencia_id e papel vêm de app_metadata, que só o servidor consegue definir.
-- ---------------------------------------------------------------------------
create or replace function privado.criar_perfil_do_usuario()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
begin
  if meta ? 'agencia_id' and meta ? 'papel' then
    insert into public.perfis (id, agencia_id, papel, funcao, nome, email)
    values (
      new.id,
      (meta ->> 'agencia_id')::uuid,
      (meta ->> 'papel')::public.papel,
      nullif(meta ->> 'funcao', '')::public.funcao_equipe,
      coalesce(meta ->> 'nome', new.raw_user_meta_data ->> 'nome', ''),
      new.email
    );
    if meta ? 'cliente_id' and meta ->> 'papel' = 'cliente' then
      insert into public.cliente_usuarios (cliente_id, agencia_id, user_id)
      values ((meta ->> 'cliente_id')::uuid, (meta ->> 'agencia_id')::uuid, new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger criar_perfil_do_usuario after insert on auth.users
  for each row execute function privado.criar_perfil_do_usuario();

-- ---------------------------------------------------------------------------
-- Auditoria: função única de registro
-- ---------------------------------------------------------------------------
create or replace function public.registrar_auditoria(
  p_acao text, p_entidade text default null, p_entidade_id text default null,
  p_cliente_id uuid default null, p_detalhes jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  ag uuid := privado.minha_agencia();
begin
  if ag is null then
    raise exception 'Usuário sem agência.' using errcode = '42501';
  end if;
  if p_cliente_id is not null and not privado.pode_ver_cliente(p_cliente_id) then
    raise exception 'Sem acesso a este cliente.' using errcode = '42501';
  end if;
  insert into public.auditoria (agencia_id, cliente_id, user_id, acao, entidade, entidade_id, detalhes)
  values (ag, p_cliente_id, (select auth.uid()), p_acao, p_entidade, p_entidade_id, coalesce(p_detalhes, '{}'::jsonb));
end;
$$;
revoke all on function public.registrar_auditoria(text, text, text, uuid, jsonb) from public, anon;
grant execute on function public.registrar_auditoria(text, text, text, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.agencias            enable row level security;
alter table public.plataforma_admins   enable row level security;
alter table public.perfis              enable row level security;
alter table public.clientes            enable row level security;
alter table public.cliente_usuarios    enable row level security;
alter table public.equipe_clientes     enable row level security;
alter table public.financeiro_clientes enable row level security;
alter table public.briefings           enable row level security;
alter table public.auditoria           enable row level security;

-- O papel anônimo não acessa nada.
revoke all on all tables in schema public from anon;

-- agencias
create policy agencias_ler on public.agencias for select to authenticated
  using (id = privado.minha_agencia() or privado.e_dono_plataforma());
create policy agencias_admin_edita on public.agencias for update to authenticated
  using (privado.e_admin_da(id)) with check (privado.e_admin_da(id));
create policy agencias_plataforma_cria on public.agencias for insert to authenticated
  with check (privado.e_dono_plataforma());
create policy agencias_plataforma_edita on public.agencias for update to authenticated
  using (privado.e_dono_plataforma()) with check (privado.e_dono_plataforma());

-- plataforma_admins: cada um vê só a própria linha; escrita só pelo servidor.
create policy plataforma_ler_propria on public.plataforma_admins for select to authenticated
  using (user_id = (select auth.uid()));

-- perfis
create policy perfis_ler on public.perfis for select to authenticated
  using (privado.pode_ver_perfil(id));
create policy perfis_editar_proprio on public.perfis for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy perfis_admin_edita on public.perfis for update to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- clientes
create policy clientes_ler on public.clientes for select to authenticated
  using (privado.pode_ver_cliente(id));
create policy clientes_admin_cria on public.clientes for insert to authenticated
  with check (privado.e_admin_da(agencia_id));
create policy clientes_admin_edita on public.clientes for update to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));
create policy clientes_admin_apaga on public.clientes for delete to authenticated
  using (privado.e_admin_da(agencia_id));

-- cliente_usuarios e equipe_clientes: leitura para quem vê o cliente, escrita só do admin.
create policy cliente_usuarios_ler on public.cliente_usuarios for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy cliente_usuarios_admin on public.cliente_usuarios for all to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

create policy equipe_clientes_ler on public.equipe_clientes for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy equipe_clientes_admin on public.equipe_clientes for all to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- financeiro_clientes: admin e o próprio cliente leem; só admin escreve.
create policy financeiro_ler on public.financeiro_clientes for select to authenticated
  using (privado.pode_ver_financeiro(cliente_id));
create policy financeiro_admin on public.financeiro_clientes for all to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- briefings: quem vê o cliente lê; cliente e equipe atribuída escrevem.
create policy briefings_ler on public.briefings for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy briefings_criar on public.briefings for insert to authenticated
  with check (privado.e_usuario_do_cliente(cliente_id) or privado.pode_editar_cliente(cliente_id));
create policy briefings_editar on public.briefings for update to authenticated
  using (privado.e_usuario_do_cliente(cliente_id) or privado.pode_editar_cliente(cliente_id))
  with check (privado.e_usuario_do_cliente(cliente_id) or privado.pode_editar_cliente(cliente_id));

-- auditoria: só o admin da agência lê; ninguém escreve direto.
create policy auditoria_admin_le on public.auditoria for select to authenticated
  using (privado.e_admin_da(agencia_id));

-- Privilégios de tabela para o papel autenticado (o RLS filtra as linhas).
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.auditoria from authenticated;
revoke insert, update, delete on public.plataforma_admins from authenticated;
revoke insert, delete on public.perfis from authenticated;
