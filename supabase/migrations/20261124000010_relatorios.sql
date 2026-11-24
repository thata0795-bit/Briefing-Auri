-- Relatório de métricas mês a mês, desde a entrada do cliente na agência.
-- A agência preenche (à mão hoje; pelo Metricool depois) e publica; o cliente lê
-- só o que foi publicado.

create table public.relatorios (
  id                uuid primary key default gen_random_uuid(),
  cliente_id        uuid not null,
  agencia_id        uuid not null,
  mes               text not null check (mes ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  seguidores        integer check (seguidores >= 0),
  alcance           integer check (alcance >= 0),
  impressoes        integer check (impressoes >= 0),
  interacoes        integer check (interacoes >= 0),
  visitas_perfil    integer check (visitas_perfil >= 0),
  cliques_link      integer check (cliques_link >= 0),
  publicacoes       integer check (publicacoes >= 0),
  destaques         text check (length(destaques) <= 4000),
  analise           text check (length(analise) <= 4000),
  proximos_passos   text check (length(proximos_passos) <= 4000),
  publicado_em      timestamptz,
  criado_por        uuid references public.perfis (id) on delete set null,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now(),
  unique (cliente_id, mes),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index relatorios_cliente_idx on public.relatorios (cliente_id, mes);

create trigger tocar_atualizado_em before update on public.relatorios
  for each row execute function privado.tocar_atualizado_em();
alter table public.relatorios enable row level security;
create policy exigir_mfa on public.relatorios as restrictive for all to authenticated
  using (privado.mfa_ok()) with check (privado.mfa_ok());

revoke all on public.relatorios from anon;
grant select, insert, update, delete on public.relatorios to authenticated;

-- A agência (admin e equipe atribuída) edita; o cliente lê só o publicado.
create policy relatorios_ler on public.relatorios for select to authenticated
  using (privado.pode_editar_cliente(cliente_id) or (privado.e_usuario_do_cliente(cliente_id) and publicado_em is not null));
create policy relatorios_equipe on public.relatorios for all to authenticated
  using (privado.pode_editar_cliente(cliente_id)) with check (privado.pode_editar_cliente(cliente_id));
