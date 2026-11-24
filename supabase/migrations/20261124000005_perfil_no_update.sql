-- O Auth do Supabase cria o usuário e grava app_metadata num segundo passo
-- (update). O perfil passa a nascer também nesse momento. Um perfil que já
-- existe nunca muda de agência ou papel por aqui.

create or replace function privado.criar_perfil_do_usuario()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
begin
  if not (meta ? 'agencia_id' and meta ? 'papel') then
    return new;
  end if;
  if exists (select 1 from public.perfis where id = new.id) then
    return new;
  end if;

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
    values ((meta ->> 'cliente_id')::uuid, (meta ->> 'agencia_id')::uuid, new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger criar_perfil_do_usuario_update after update of raw_app_meta_data on auth.users
  for each row execute function privado.criar_perfil_do_usuario();
