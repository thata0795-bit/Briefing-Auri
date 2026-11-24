-- Permite ao servidor (chave de serviço) concluir uma etapa depois de validar
-- regras que vivem no código, como as perguntas obrigatórias do briefing.
create or replace function public.concluir_etapa_servico(p_cliente uuid, p_etapa public.etapa_entrada, p_quem uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role' then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  perform privado.concluir_etapa(p_cliente, p_etapa, p_quem);
end;
$$;
revoke all on function public.concluir_etapa_servico(uuid, public.etapa_entrada, uuid) from public, anon, authenticated;
grant execute on function public.concluir_etapa_servico(uuid, public.etapa_entrada, uuid) to service_role;
