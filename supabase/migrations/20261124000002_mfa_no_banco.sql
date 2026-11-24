-- Verificação em duas etapas garantida no banco: quem cadastrou um autenticador
-- só acessa dados depois de confirmar o código (sessão aal2). Sem isso,
-- alguém com a senha poderia chamar a API direto e pular a tela de código.

create or replace function privado.mfa_ok()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = (select auth.uid()) and f.status = 'verified'
      )
$$;
revoke all on function privado.mfa_ok() from public, anon;
grant execute on function privado.mfa_ok() to authenticated, service_role;

do $$
declare t text;
begin
  foreach t in array array['agencias','plataforma_admins','perfis','clientes','cliente_usuarios',
                           'equipe_clientes','financeiro_clientes','briefings','auditoria']
  loop
    execute format('create policy exigir_mfa on public.%I as restrictive for all to authenticated
                    using (privado.mfa_ok()) with check (privado.mfa_ok())', t);
  end loop;
end;
$$;
