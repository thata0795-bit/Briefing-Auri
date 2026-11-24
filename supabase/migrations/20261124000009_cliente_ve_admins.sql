-- O cliente passa a ver o nome de quem é admin da agência dele (chat, aprovações).
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
        -- cliente enxerga quem é admin da agência (aparece no chat e nas aprovações)
        or (eu.papel = 'cliente' and ele.papel = 'admin')
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
