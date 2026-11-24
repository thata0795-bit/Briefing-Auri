-- Fase 2: entrada do cliente.
-- Convite, etapas da entrada, contrato, briefing, acessos, horários livres,
-- compromissos (reunião e captação) e arquivos.

-- ---------------------------------------------------------------------------
-- Status compartilhado (seção 8). Usado por etapas, tarefas, conteúdos e pedidos.
-- ---------------------------------------------------------------------------
create type public.status_item as enum (
  'a_fazer', 'em_andamento', 'aguardando_aprovacao', 'ajuste_solicitado',
  'aprovado', 'programado', 'concluido', 'atrasado'
);

create type public.etapa_entrada as enum ('boas_vindas', 'contrato', 'briefing', 'acessos', 'reuniao');

alter table public.clientes
  add column convidado_em timestamptz,
  add column entrada_concluida_em timestamptz;

alter table public.perfis
  add column termos_versao text;

alter table public.briefings
  add column puladas text[] not null default '{}',
  add constraint briefing_tamanho check (pg_column_size(respostas) < 400000);

-- ---------------------------------------------------------------------------
-- Convites: token próprio, com validade de 7 dias e uso único.
-- Só o servidor (chave de serviço) lê e grava. Guardamos o hash, nunca o token.
-- ---------------------------------------------------------------------------
create table public.convites (
  id            uuid primary key default gen_random_uuid(),
  agencia_id    uuid not null references public.agencias (id) on delete cascade,
  cliente_id    uuid references public.clientes (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  email         text not null,
  token_hash    text not null unique,
  expira_em     timestamptz not null,
  usado_em      timestamptz,
  criado_por    uuid references public.perfis (id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index convites_user_idx on public.convites (user_id);

-- ---------------------------------------------------------------------------
-- Etapas da entrada
-- ---------------------------------------------------------------------------
create table public.etapas_entrada (
  cliente_id     uuid not null,
  agencia_id     uuid not null,
  etapa          public.etapa_entrada not null,
  status         public.status_item not null default 'a_fazer',
  concluido_em   timestamptz,
  concluido_por  uuid references public.perfis (id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  primary key (cliente_id, etapa),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Contratos
-- ---------------------------------------------------------------------------
-- Modelos são da agência, não de um cliente: por isso não têm cliente_id.
create table public.modelos_contrato (
  id            uuid primary key default gen_random_uuid(),
  agencia_id    uuid not null references public.agencias (id) on delete cascade,
  nome          text not null check (length(trim(nome)) between 2 and 120),
  corpo         text not null check (length(corpo) between 20 and 100000),
  padrao        boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index modelos_contrato_um_padrao on public.modelos_contrato (agencia_id) where padrao;

create type public.status_contrato as enum ('rascunho', 'enviado', 'assinado', 'cancelado');

create table public.contratos (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null,
  agencia_id        uuid not null,
  modelo_id         uuid references public.modelos_contrato (id) on delete set null,
  titulo            text not null,
  conteudo          text not null,
  status            public.status_contrato not null default 'rascunho',
  provedor          text,
  provedor_ref      text unique,
  link_assinatura   text,
  enviado_em        timestamptz,
  assinado_em       timestamptz,
  assinado_por      text,
  arquivo_assinado  text,
  criado_por        uuid references public.perfis (id) on delete set null,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index contratos_cliente_idx on public.contratos (cliente_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- Acessos que o cliente libera (sem guardar senha)
-- ---------------------------------------------------------------------------
create table public.acessos_cliente (
  cliente_id     uuid not null,
  agencia_id     uuid not null,
  tipo           text not null check (tipo in ('instagram', 'meta_business', 'google_meu_negocio', 'dominio')),
  status         text not null default 'pendente'
                 check (status in ('pendente', 'liberado', 'nao_tenho', 'ajuda', 'confirmado')),
  observacao     text check (length(observacao) <= 1000),
  atualizado_por uuid references public.perfis (id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  primary key (cliente_id, tipo),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Agenda: compromissos e horários livres da agência
-- ---------------------------------------------------------------------------
create table public.compromissos (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid not null,
  agencia_id      uuid not null,
  tipo            text not null check (tipo in ('reuniao', 'captacao')),
  titulo          text not null check (length(trim(titulo)) between 2 and 160),
  descricao       text,
  inicio          timestamptz not null,
  fim             timestamptz not null,
  formato         text not null default 'online' check (formato in ('online', 'presencial')),
  local           text,
  link            text check (link is null or link ~* '^https://'),
  o_que_levar     text,
  responsavel_id  uuid references public.perfis (id) on delete set null,
  status          text not null default 'agendado'
                  check (status in ('agendado', 'confirmado', 'remarcacao_solicitada', 'cancelado', 'concluido')),
  criado_por      uuid references public.perfis (id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  check (fim > inicio),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index compromissos_cliente_idx on public.compromissos (cliente_id, inicio);

-- Horários que a agência abre para o cliente escolher. Não pertencem a um
-- cliente até serem reservados, por isso cliente_id é opcional aqui.
create table public.horarios_livres (
  id              uuid primary key default gen_random_uuid(),
  agencia_id      uuid not null references public.agencias (id) on delete cascade,
  cliente_id      uuid references public.clientes (id) on delete set null,
  responsavel_id  uuid not null references public.perfis (id) on delete cascade,
  inicio          timestamptz not null,
  fim             timestamptz not null,
  formato         text not null default 'online' check (formato in ('online', 'presencial')),
  local           text,
  link            text check (link is null or link ~* '^https://'),
  compromisso_id  uuid references public.compromissos (id) on delete set null,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  check (fim > inicio)
);
create index horarios_livres_agencia_idx on public.horarios_livres (agencia_id, inicio) where cliente_id is null;

-- ---------------------------------------------------------------------------
-- Arquivos (metadados). O conteúdo fica no bucket privado "arquivos",
-- no caminho {agencia_id}/{cliente_id}/{pasta}/{arquivo}.
-- ---------------------------------------------------------------------------
create table public.arquivos (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  pasta         text not null default 'geral' check (pasta ~ '^[a-z0-9-]{1,40}$'),
  nome          text not null check (length(nome) between 1 and 200),
  caminho       text not null unique,
  tamanho       bigint not null check (tamanho > 0),
  tipo_mime     text not null,
  referencia    text,
  enviado_por   uuid references public.perfis (id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade,
  check (caminho like agencia_id::text || '/' || cliente_id::text || '/%')
);
create index arquivos_cliente_idx on public.arquivos (cliente_id, pasta, criado_em desc);

-- Gatilhos de atualizado_em
do $$
declare t text;
begin
  foreach t in array array['convites','etapas_entrada','modelos_contrato','contratos','acessos_cliente',
                           'compromissos','horarios_livres','arquivos']
  loop
    execute format('create trigger tocar_atualizado_em before update on public.%I
                    for each row execute function privado.tocar_atualizado_em()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Funções de apoio
-- ---------------------------------------------------------------------------
create or replace function privado.uuid_ou_nulo(valor text)
returns uuid
language plpgsql immutable
set search_path = ''
as $$
begin
  return valor::uuid;
exception when others then
  return null;
end;
$$;

create or replace function privado.e_da_agencia(agencia uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = (select auth.uid()) and p.ativo and p.agencia_id = agencia and p.papel in ('admin', 'equipe')
  )
$$;

-- Etapa anterior concluída (a entrada é em ordem).
create or replace function privado.etapa_liberada(cliente uuid, alvo public.etapa_entrada)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.etapas_entrada e
    where e.cliente_id = cliente and e.etapa < alvo and e.status <> 'concluido'
  )
$$;

-- Marca uma etapa como concluída e, se for a última, conclui a entrada.
create or replace function privado.concluir_etapa(cliente uuid, alvo public.etapa_entrada, quem uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  ag uuid;
begin
  update public.etapas_entrada
     set status = 'concluido', concluido_em = now(), concluido_por = quem
   where cliente_id = cliente and etapa = alvo and status <> 'concluido'
  returning agencia_id into ag;

  if ag is null then
    return;
  end if;

  insert into public.auditoria (agencia_id, cliente_id, user_id, acao, entidade, entidade_id)
  values (ag, cliente, quem, 'entrada.etapa_concluida', 'etapas_entrada', alvo::text);

  -- A próxima etapa passa a "em andamento".
  update public.etapas_entrada
     set status = 'em_andamento'
   where cliente_id = cliente
     and status = 'a_fazer'
     and etapa = (select min(e.etapa) from public.etapas_entrada e
                  where e.cliente_id = cliente and e.status = 'a_fazer');

  if not exists (select 1 from public.etapas_entrada e where e.cliente_id = cliente and e.status <> 'concluido') then
    update public.clientes set status = 'ativo', entrada_concluida_em = now()
     where id = cliente and status in ('convidado', 'onboarding');
  end if;
end;
$$;

revoke all on all functions in schema privado from public, anon;
grant execute on all functions in schema privado to authenticated, service_role;
-- concluir_etapa é interna: só funções do banco e o servidor chamam.
revoke execute on function privado.concluir_etapa(uuid, public.etapa_entrada, uuid) from authenticated;

-- Cria as etapas, o briefing e o checklist de acessos de um cliente novo.
create or replace function privado.preparar_entrada()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.etapas_entrada (cliente_id, agencia_id, etapa, status)
  select new.id, new.agencia_id, e, case when e = 'boas_vindas' then 'em_andamento'::public.status_item
                                         else 'a_fazer'::public.status_item end
  from unnest(enum_range(null::public.etapa_entrada)) as e
  on conflict do nothing;

  insert into public.briefings (cliente_id, agencia_id) values (new.id, new.agencia_id)
  on conflict (cliente_id) do nothing;

  insert into public.acessos_cliente (cliente_id, agencia_id, tipo)
  select new.id, new.agencia_id, t
  from unnest(array['instagram', 'meta_business', 'google_meu_negocio', 'dominio']) as t
  on conflict do nothing;
  return new;
end;
$$;

create trigger preparar_entrada after insert on public.clientes
  for each row execute function privado.preparar_entrada();

-- ---------------------------------------------------------------------------
-- Ações do cliente (chamadas pela API, com checagem de quem chama)
-- ---------------------------------------------------------------------------

-- Boas-vindas: aceite dos termos e da política de privacidade.
create or replace function public.concluir_boas_vindas(p_cliente uuid, p_termos_versao text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not privado.e_usuario_do_cliente(p_cliente) then
    raise exception 'Sem acesso a este cliente.' using errcode = '42501';
  end if;
  if p_termos_versao is null or length(p_termos_versao) > 40 then
    raise exception 'Versão dos termos inválida.' using errcode = '22023';
  end if;

  update public.perfis set termos_aceitos_em = now(), termos_versao = p_termos_versao
   where id = (select auth.uid());

  insert into public.auditoria (agencia_id, cliente_id, user_id, acao, detalhes)
  select c.agencia_id, c.id, (select auth.uid()), 'lgpd.termos_aceitos', jsonb_build_object('versao', p_termos_versao)
  from public.clientes c where c.id = p_cliente;

  update public.clientes set status = 'onboarding' where id = p_cliente and status = 'convidado';
  perform privado.concluir_etapa(p_cliente, 'boas_vindas', (select auth.uid()));
end;
$$;

-- Checklist de acessos: o cliente marca cada item; "confirmado" é só da agência.
create or replace function public.marcar_acesso(p_cliente uuid, p_tipo text, p_status text, p_observacao text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  equipe boolean := privado.pode_editar_cliente(p_cliente);
begin
  if not (equipe or privado.e_usuario_do_cliente(p_cliente)) then
    raise exception 'Sem acesso a este cliente.' using errcode = '42501';
  end if;
  if p_status = 'confirmado' and not equipe then
    raise exception 'Só a agência confirma o acesso.' using errcode = '42501';
  end if;
  if p_status not in ('pendente', 'liberado', 'nao_tenho', 'ajuda', 'confirmado') then
    raise exception 'Status inválido.' using errcode = '22023';
  end if;

  update public.acessos_cliente
     set status = p_status, observacao = nullif(trim(p_observacao), ''), atualizado_por = (select auth.uid())
   where cliente_id = p_cliente and tipo = p_tipo;
  if not found then
    raise exception 'Item não encontrado.' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.concluir_acessos(p_cliente uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not privado.e_usuario_do_cliente(p_cliente) then
    raise exception 'Sem acesso a este cliente.' using errcode = '42501';
  end if;
  if not privado.etapa_liberada(p_cliente, 'acessos') then
    raise exception 'Conclua as etapas anteriores primeiro.' using errcode = '55000';
  end if;
  if exists (select 1 from public.acessos_cliente where cliente_id = p_cliente and status = 'pendente') then
    raise exception 'Responda todos os itens do checklist.' using errcode = '55000';
  end if;
  perform privado.concluir_etapa(p_cliente, 'acessos', (select auth.uid()));
end;
$$;

-- Reserva de horário: atômica, um horário só vira um compromisso.
create or replace function public.reservar_primeira_reuniao(p_cliente uuid, p_horario uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  h public.horarios_livres;
  c public.clientes;
  novo uuid;
begin
  if not privado.e_usuario_do_cliente(p_cliente) then
    raise exception 'Sem acesso a este cliente.' using errcode = '42501';
  end if;
  if not privado.etapa_liberada(p_cliente, 'reuniao') then
    raise exception 'Conclua as etapas anteriores primeiro.' using errcode = '55000';
  end if;

  if exists (select 1 from public.etapas_entrada
             where cliente_id = p_cliente and etapa = 'reuniao' and status = 'concluido') then
    raise exception 'Sua primeira reunião já está marcada.' using errcode = '55000';
  end if;

  select * into c from public.clientes where id = p_cliente;

  select * into h from public.horarios_livres
   where id = p_horario for update;

  if h.id is null or h.agencia_id <> c.agencia_id then
    raise exception 'Horário não encontrado.' using errcode = 'P0002';
  end if;
  if h.cliente_id is not null then
    raise exception 'Esse horário acabou de ser reservado. Escolha outro.' using errcode = '55000';
  end if;
  if h.inicio <= now() + interval '2 hours' then
    raise exception 'Esse horário já passou. Escolha outro.' using errcode = '55000';
  end if;

  insert into public.compromissos (cliente_id, agencia_id, tipo, titulo, inicio, fim, formato, local, link,
                                   responsavel_id, criado_por, descricao)
  values (c.id, c.agencia_id, 'reuniao', 'Primeira reunião', h.inicio, h.fim, h.formato, h.local, h.link,
          h.responsavel_id, (select auth.uid()),
          'Conversa inicial para alinhar objetivos, briefing e a primeira estratégia.')
  returning id into novo;

  update public.horarios_livres set cliente_id = c.id, compromisso_id = novo where id = h.id;
  perform privado.concluir_etapa(p_cliente, 'reuniao', (select auth.uid()));
  return novo;
end;
$$;

-- Assinatura do contrato confirmada. Chamada pelo webhook (chave de serviço)
-- ou pelo admin, quando o contrato foi assinado fora do sistema.
create or replace function public.confirmar_assinatura_contrato(p_contrato uuid, p_assinado_por text, p_origem text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  k public.contratos;
  servico boolean := coalesce((select auth.jwt() ->> 'role'), current_user) = 'service_role';
begin
  select * into k from public.contratos where id = p_contrato for update;
  if k.id is null then
    raise exception 'Contrato não encontrado.' using errcode = 'P0002';
  end if;
  if not servico and not privado.e_admin_da(k.agencia_id) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  if k.status = 'assinado' then
    return;
  end if;
  if k.status = 'cancelado' then
    raise exception 'Contrato cancelado.' using errcode = '55000';
  end if;

  update public.contratos
     set status = 'assinado', assinado_em = now(), assinado_por = left(p_assinado_por, 200)
   where id = k.id;

  insert into public.auditoria (agencia_id, cliente_id, user_id, acao, entidade, entidade_id, detalhes)
  values (k.agencia_id, k.cliente_id, (select auth.uid()), 'contrato.assinado', 'contratos', k.id::text,
          jsonb_build_object('origem', p_origem));

  perform privado.concluir_etapa(k.cliente_id, 'contrato', (select auth.uid()));
end;
$$;
revoke all on function public.confirmar_assinatura_contrato(uuid, text, text) from public, anon;
grant execute on function public.confirmar_assinatura_contrato(uuid, text, text) to authenticated, service_role;

-- Salva uma resposta do briefing (chave "secao.pergunta"). Sujeito ao RLS de quem chama.
create or replace function public.salvar_resposta_briefing(p_cliente uuid, p_chave text, p_valor jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_chave !~ '^[a-z_]+\.[a-z_]+$' then
    raise exception 'Pergunta inválida.' using errcode = '22023';
  end if;
  if pg_column_size(p_valor) > 20000 then
    raise exception 'Resposta grande demais.' using errcode = '22023';
  end if;
  update public.briefings
     set respostas = case when p_valor is null or p_valor = 'null'::jsonb
                          then respostas - p_chave
                          else jsonb_set(respostas, array[p_chave], p_valor, true) end,
         puladas = array_remove(puladas, p_chave)
   where cliente_id = p_cliente;
  if not found then
    raise exception 'Sem acesso a este briefing.' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.pular_pergunta_briefing(p_cliente uuid, p_chave text, p_pular boolean)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_chave !~ '^[a-z_]+\.[a-z_]+$' then
    raise exception 'Pergunta inválida.' using errcode = '22023';
  end if;
  update public.briefings
     set puladas = case when p_pular then array_append(array_remove(puladas, p_chave), p_chave)
                        else array_remove(puladas, p_chave) end
   where cliente_id = p_cliente;
  if not found then
    raise exception 'Sem acesso a este briefing.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.concluir_boas_vindas(uuid, text) from public, anon;
revoke all on function public.marcar_acesso(uuid, text, text, text) from public, anon;
revoke all on function public.concluir_acessos(uuid) from public, anon;
revoke all on function public.reservar_primeira_reuniao(uuid, uuid) from public, anon;
revoke all on function public.salvar_resposta_briefing(uuid, text, jsonb) from public, anon;
revoke all on function public.pular_pergunta_briefing(uuid, text, boolean) from public, anon;
grant execute on function public.concluir_boas_vindas(uuid, text) to authenticated;
grant execute on function public.marcar_acesso(uuid, text, text, text) to authenticated;
grant execute on function public.concluir_acessos(uuid) to authenticated;
grant execute on function public.reservar_primeira_reuniao(uuid, uuid) to authenticated;
grant execute on function public.salvar_resposta_briefing(uuid, text, jsonb) to authenticated;
grant execute on function public.pular_pergunta_briefing(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.convites         enable row level security;
alter table public.etapas_entrada   enable row level security;
alter table public.modelos_contrato enable row level security;
alter table public.contratos        enable row level security;
alter table public.acessos_cliente  enable row level security;
alter table public.compromissos     enable row level security;
alter table public.horarios_livres  enable row level security;
alter table public.arquivos         enable row level security;

revoke all on public.convites, public.etapas_entrada, public.modelos_contrato, public.contratos,
              public.acessos_cliente, public.compromissos, public.horarios_livres, public.arquivos from anon;
grant select, insert, update, delete on public.etapas_entrada, public.modelos_contrato, public.contratos,
              public.acessos_cliente, public.compromissos, public.horarios_livres, public.arquivos to authenticated;
grant select on public.convites to authenticated;

-- convites: só o admin lê (para ver pendentes); escrita só pelo servidor.
create policy convites_admin_le on public.convites for select to authenticated
  using (privado.e_admin_da(agencia_id));

-- etapas: todos que veem o cliente leem; mudança só por função ou pelo admin.
create policy etapas_ler on public.etapas_entrada for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy etapas_admin on public.etapas_entrada for update to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- modelos de contrato: só o admin.
create policy modelos_admin on public.modelos_contrato for all to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- contratos: mesmo nível do financeiro (admin e o próprio cliente). Escrita do admin.
create policy contratos_ler on public.contratos for select to authenticated
  using (privado.pode_ver_financeiro(cliente_id));
create policy contratos_admin on public.contratos for all to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- acessos: leitura de quem vê o cliente; escrita pela função marcar_acesso.
create policy acessos_ler on public.acessos_cliente for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));

-- compromissos
create policy compromissos_ler on public.compromissos for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy compromissos_equipe on public.compromissos for all to authenticated
  using (privado.pode_editar_cliente(cliente_id)) with check (privado.pode_editar_cliente(cliente_id));

-- horários livres: a equipe da agência gerencia; o cliente vê só os livres e futuros da agência dele.
create policy horarios_equipe on public.horarios_livres for all to authenticated
  using (privado.e_da_agencia(agencia_id)) with check (privado.e_da_agencia(agencia_id));
create policy horarios_cliente_le on public.horarios_livres for select to authenticated
  using (agencia_id = privado.minha_agencia() and cliente_id is null and inicio > now());

-- arquivos
create policy arquivos_ler on public.arquivos for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy arquivos_criar on public.arquivos for insert to authenticated
  with check ((privado.e_usuario_do_cliente(cliente_id) or privado.pode_editar_cliente(cliente_id))
              and enviado_por = (select auth.uid()));
create policy arquivos_apagar on public.arquivos for delete to authenticated
  using (enviado_por = (select auth.uid()) or privado.pode_editar_cliente(cliente_id));

do $$
declare t text;
begin
  foreach t in array array['convites','etapas_entrada','modelos_contrato','contratos','acessos_cliente',
                           'compromissos','horarios_livres','arquivos']
  loop
    execute format('create policy exigir_mfa on public.%I as restrictive for all to authenticated
                    using (privado.mfa_ok()) with check (privado.mfa_ok())', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Armazenamento: bucket privado "arquivos"
-- Caminho: {agencia_id}/{cliente_id}/{pasta}/{arquivo}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('arquivos', 'arquivos', false, 52428800,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf',
              'video/mp4', 'video/quicktime', 'application/zip',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do nothing;

create or replace function privado.cliente_do_caminho(caminho text)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select c.id from public.clientes c
  where c.id = privado.uuid_ou_nulo(split_part(caminho, '/', 2))
    and c.agencia_id = privado.uuid_ou_nulo(split_part(caminho, '/', 1))
$$;
revoke all on function privado.cliente_do_caminho(text) from public, anon;
grant execute on function privado.cliente_do_caminho(text) to authenticated, service_role;

create policy arquivos_storage_ler on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and privado.mfa_ok()
         and privado.pode_ver_cliente(privado.cliente_do_caminho(name)));
create policy arquivos_storage_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and privado.mfa_ok()
              and (privado.e_usuario_do_cliente(privado.cliente_do_caminho(name))
                   or privado.pode_editar_cliente(privado.cliente_do_caminho(name))));
create policy arquivos_storage_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and privado.mfa_ok()
         and (owner_id = (select auth.uid())::text
              or privado.pode_editar_cliente(privado.cliente_do_caminho(name))));
