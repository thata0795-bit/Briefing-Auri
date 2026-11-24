-- Fase 3 (parte 1): conteúdos do mês, roteiros de reels e stories, aprovação e ajuste.

create table public.conteudos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null,
  agencia_id       uuid not null,
  data_publicacao  date not null,
  horario          time,
  formato          text not null check (formato in ('feed', 'carrossel', 'reels', 'stories')),
  titulo           text not null check (length(trim(titulo)) between 2 and 160),
  legenda          text check (length(legenda) <= 5000),
  arte_caminho     text,
  status           public.status_item not null default 'em_andamento'
                   check (status in ('em_andamento', 'aguardando_aprovacao', 'ajuste_solicitado', 'aprovado', 'programado', 'concluido')),
  aprovado_em      timestamptz,
  aprovado_por     uuid references public.perfis (id) on delete set null,
  criado_por       uuid references public.perfis (id) on delete set null,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index conteudos_cliente_data_idx on public.conteudos (cliente_id, data_publicacao);

create table public.roteiros (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid not null,
  agencia_id       uuid not null,
  tipo             text not null check (tipo in ('reels', 'stories')),
  titulo           text not null check (length(trim(titulo)) between 2 and 160),
  data_gravacao    date not null,
  objetivo         text check (length(objetivo) <= 2000),
  gancho           text check (length(gancho) <= 2000),
  falas            text check (length(falas) <= 10000),
  cenas            text check (length(cenas) <= 10000),
  referencias      text check (length(referencias) <= 2000),
  o_que_levar      text check (length(o_que_levar) <= 2000),
  status           public.status_item not null default 'em_andamento'
                   check (status in ('em_andamento', 'aguardando_aprovacao', 'ajuste_solicitado', 'aprovado', 'concluido')),
  publicado_em     timestamptz,
  lido_em          timestamptz,
  aprovado_em      timestamptz,
  aprovado_por     uuid references public.perfis (id) on delete set null,
  criado_por       uuid references public.perfis (id) on delete set null,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index roteiros_cliente_data_idx on public.roteiros (cliente_id, data_gravacao);

-- Comentários e histórico de cada conteúdo ou roteiro (aprovações, ajustes, reenvios).
create table public.comentarios (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null,
  agencia_id    uuid not null,
  item_tipo     text not null check (item_tipo in ('conteudo', 'roteiro')),
  item_id       uuid not null,
  autor_id      uuid references public.perfis (id) on delete set null,
  tipo          text not null default 'comentario' check (tipo in ('comentario', 'ajuste', 'aprovacao', 'reenvio')),
  texto         text not null check (length(trim(texto)) between 1 and 4000),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (cliente_id, agencia_id) references public.clientes (id, agencia_id) on delete cascade
);
create index comentarios_item_idx on public.comentarios (item_tipo, item_id, criado_em);

do $$
declare t text;
begin
  foreach t in array array['conteudos', 'roteiros', 'comentarios']
  loop
    execute format('create trigger tocar_atualizado_em before update on public.%I
                    for each row execute function privado.tocar_atualizado_em()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy exigir_mfa on public.%I as restrictive for all to authenticated
                    using (privado.mfa_ok()) with check (privado.mfa_ok())', t);
  end loop;
end;
$$;

revoke all on public.conteudos, public.roteiros, public.comentarios from anon;
grant select, insert, update, delete on public.conteudos, public.roteiros, public.comentarios to authenticated;

-- Leitura: quem vê o cliente. O cliente não vê roteiros ainda não publicados para ele.
create policy conteudos_ler on public.conteudos for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy conteudos_equipe on public.conteudos for all to authenticated
  using (privado.pode_editar_cliente(cliente_id)) with check (privado.pode_editar_cliente(cliente_id));

create policy roteiros_ler on public.roteiros for select to authenticated
  using (privado.pode_editar_cliente(cliente_id)
         or (privado.e_usuario_do_cliente(cliente_id) and publicado_em is not null));
create policy roteiros_equipe on public.roteiros for all to authenticated
  using (privado.pode_editar_cliente(cliente_id)) with check (privado.pode_editar_cliente(cliente_id));

create policy comentarios_ler on public.comentarios for select to authenticated
  using (privado.pode_ver_cliente(cliente_id));
create policy comentarios_criar on public.comentarios for insert to authenticated
  with check (privado.pode_ver_cliente(cliente_id) and autor_id = (select auth.uid()) and tipo = 'comentario');

-- Resposta do cliente: aprovar ou pedir ajuste. Só vale para o que está aguardando aprovação.
create or replace function public.responder_item(p_tipo text, p_id uuid, p_acao text, p_texto text default null)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  cli uuid;
  ag uuid;
  st public.status_item;
begin
  if p_tipo not in ('conteudo', 'roteiro') or p_acao not in ('aprovar', 'ajuste') then
    raise exception 'Ação inválida.' using errcode = '22023';
  end if;
  if p_tipo = 'conteudo' then
    select cliente_id, agencia_id, status into cli, ag, st from public.conteudos where id = p_id for update;
  else
    select cliente_id, agencia_id, status into cli, ag, st from public.roteiros where id = p_id and publicado_em is not null for update;
  end if;
  if cli is null or not privado.e_usuario_do_cliente(cli) then
    raise exception 'Item não encontrado.' using errcode = 'P0002';
  end if;
  if st <> 'aguardando_aprovacao' then
    raise exception 'Este item não está esperando a sua aprovação.' using errcode = '55000';
  end if;
  if p_acao = 'ajuste' and length(trim(coalesce(p_texto, ''))) < 3 then
    raise exception 'Descreva o ajuste que você precisa.' using errcode = '22023';
  end if;

  if p_tipo = 'conteudo' then
    update public.conteudos
       set status = case when p_acao = 'aprovar' then 'aprovado'::public.status_item else 'ajuste_solicitado'::public.status_item end,
           aprovado_em = case when p_acao = 'aprovar' then now() else null end,
           aprovado_por = case when p_acao = 'aprovar' then (select auth.uid()) else null end
     where id = p_id;
  else
    update public.roteiros
       set status = case when p_acao = 'aprovar' then 'aprovado'::public.status_item else 'ajuste_solicitado'::public.status_item end,
           aprovado_em = case when p_acao = 'aprovar' then now() else null end,
           aprovado_por = case when p_acao = 'aprovar' then (select auth.uid()) else null end,
           lido_em = coalesce(lido_em, now())
     where id = p_id;
  end if;

  insert into public.comentarios (cliente_id, agencia_id, item_tipo, item_id, autor_id, tipo, texto)
  values (cli, ag, p_tipo, p_id, (select auth.uid()),
          case when p_acao = 'aprovar' then 'aprovacao' else 'ajuste' end,
          case when p_acao = 'aprovar' then coalesce(nullif(trim(p_texto), ''), 'Aprovado.') else trim(p_texto) end);

  insert into public.auditoria (agencia_id, cliente_id, user_id, acao, entidade, entidade_id)
  values (ag, cli, (select auth.uid()), p_tipo || '.' || p_acao, p_tipo || 's', p_id::text);
end;
$$;

-- Marca o roteiro como lido pelo cliente.
create or replace function public.marcar_roteiro_lido(p_id uuid)
returns void
language sql security definer
set search_path = ''
as $$
  update public.roteiros set lido_em = now()
   where id = p_id and lido_em is null and publicado_em is not null and privado.e_usuario_do_cliente(cliente_id);
$$;

revoke all on function public.responder_item(text, uuid, text, text) from public, anon;
revoke all on function public.marcar_roteiro_lido(uuid) from public, anon;
grant execute on function public.responder_item(text, uuid, text, text) to authenticated;
grant execute on function public.marcar_roteiro_lido(uuid) to authenticated;
