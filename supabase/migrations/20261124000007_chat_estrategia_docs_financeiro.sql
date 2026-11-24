-- Funções do protótipo de referência: chat, estratégia e reuniões, documentos
-- (manual da parceria), mensalidades e a etapa de manual na entrada.

-- ---------------------------------------------------------------------------
-- Chat: uma conversa por cliente, gravada para a agência toda que atende o cliente
-- ---------------------------------------------------------------------------
create table public.mensagens (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null,
  agencia_id       uuid not null,
  autor_id         uuid references public.perfis (id) on delete set null,
  texto            text check (length(texto) <= 4000),
  arquivo_caminho  text,
  arquivo_nome     text check (length(arquivo_nome) <= 200),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  check (coalesce(length(trim(texto)), 0) > 0 or arquivo_caminho is not null),
  check (arquivo_caminho is null or arquivo_caminho like agencia_id::text || '/' || cliente_id::text || '/mensagens/%'),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index mensagens_cliente_idx on public.mensagens (cliente_id, criado_em desc);

-- Até onde cada pessoa leu a conversa de cada cliente (para o contador de não lidas).
create table public.leituras_conversa (
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  user_id       uuid not null references public.perfis (id) on delete cascade,
  lido_ate      timestamptz not null default now(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (cliente_id, user_id),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Estratégia do mês (com versões) e resumo das reuniões
-- ---------------------------------------------------------------------------
create table public.estrategias (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  mes           text not null check (mes ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  versao        integer not null default 1,
  foco          text check (length(foco) <= 4000),
  objetivos     text check (length(objetivos) <= 4000),
  pilares       text check (length(pilares) <= 4000),
  metas         text check (length(metas) <= 4000),
  publicado_em  timestamptz,
  criado_por    uuid references public.perfis (id) on delete set null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cliente_id, mes, versao),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

alter table public.compromissos add column resumo text check (length(resumo) <= 8000);

-- Comentários passam a valer também para a estratégia.
alter table public.comentarios drop constraint comentarios_item_tipo_check;
alter table public.comentarios add constraint comentarios_item_tipo_check check (item_tipo in ('conteudo', 'roteiro', 'estrategia'));

-- ---------------------------------------------------------------------------
-- Manual da parceria (texto da agência) e etapa de aceite na entrada
-- ---------------------------------------------------------------------------
alter table public.agencias add column manual_parceria text check (length(manual_parceria) <= 30000);
alter type public.etapa_entrada add value if not exists 'manual' after 'contrato';
alter table public.perfis add column manual_aceito_em timestamptz;

-- ---------------------------------------------------------------------------
-- Mensalidades (o boleto automático entra na fase do financeiro)
-- ---------------------------------------------------------------------------
create table public.mensalidades (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  competencia   text not null check (competencia ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  valor         numeric(12, 2) not null check (valor >= 0),
  vencimento    date not null,
  status        text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  pago_em       timestamptz,
  link_boleto   text check (link_boleto is null or link_boleto ~* '^https://'),
  observacao    text check (length(observacao) <= 1000),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cliente_id, competencia),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);

do $$
declare t text;
begin
  foreach t in array array['mensagens', 'leituras_conversa', 'estrategias', 'mensalidades']
  loop
    execute format('create trigger tocar_atualizado_em before update on public.%I
                    for each row execute function privado.tocar_atualizado_em()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy exigir_mfa on public.%I as restrictive for all to authenticated
                    using (privado.mfa_ok()) with check (privado.mfa_ok())', t);
  end loop;
end;
$$;

revoke all on public.mensagens, public.leituras_conversa, public.estrategias, public.mensalidades from anon;
grant select, insert, update, delete on public.mensagens, public.leituras_conversa, public.estrategias, public.mensalidades to authenticated;

-- Mensagens: quem vê o cliente lê e escreve, sempre em nome próprio. Ninguém edita nem apaga.
create policy mensagens_ler on public.mensagens for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy mensagens_criar on public.mensagens for insert to authenticated
  with check (privado.pode_ver_cliente(cliente_id) and autor_id = (select auth.uid()));

create policy leituras_proprias on public.leituras_conversa for all to authenticated
  using (user_id = (select auth.uid()) and privado.pode_ver_cliente(cliente_id))
  with check (user_id = (select auth.uid()) and privado.pode_ver_cliente(cliente_id));

-- Estratégia: a agência edita; o cliente lê só a versão publicada.
create policy estrategias_ler on public.estrategias for select to authenticated
  using (privado.pode_editar_cliente(cliente_id) or (privado.e_usuario_do_cliente(cliente_id) and publicado_em is not null));
create policy estrategias_equipe on public.estrategias for all to authenticated
  using (privado.pode_editar_cliente(cliente_id)) with check (privado.pode_editar_cliente(cliente_id));

-- Mensalidades: nível do financeiro (admin e o próprio cliente). Só o admin escreve.
create policy mensalidades_ler on public.mensalidades for select to authenticated
  using (privado.pode_ver_financeiro(cliente_id));
create policy mensalidades_admin on public.mensalidades for all to authenticated
  using (privado.e_admin_da(agencia_id)) with check (privado.e_admin_da(agencia_id));

-- Aceite do manual da parceria (etapa da entrada).
create or replace function public.concluir_manual(p_cliente uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not privado.e_usuario_do_cliente(p_cliente) then
    raise exception 'Sem acesso a este cliente.' using errcode = '42501';
  end if;
  if not privado.etapa_liberada(p_cliente, 'manual') then
    raise exception 'Conclua as etapas anteriores primeiro.' using errcode = '55000';
  end if;
  update public.perfis set manual_aceito_em = now() where id = (select auth.uid());
  perform privado.concluir_etapa(p_cliente, 'manual', (select auth.uid()));
end;
$$;
revoke all on function public.concluir_manual(uuid) from public, anon;
grant execute on function public.concluir_manual(uuid) to authenticated;
