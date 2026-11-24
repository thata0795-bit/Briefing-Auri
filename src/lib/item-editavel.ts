import "server-only";
import { notFound } from "next/navigation";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

/** Para os formulários da agência: cliente escolhido (com agência) ou item existente. */
export async function clienteParaFormulario(clienteId?: string) {
  await exigirPapel("admin", "equipe");
  if (!clienteId || !/^[0-9a-f-]{36}$/.test(clienteId)) notFound();
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("clientes").select("id, nome, agencia_id").eq("id", clienteId).maybeSingle();
  if (!data) notFound();
  return data as { id: string; nome: string; agencia_id: string };
}

export async function itemParaFormulario(tabela: "conteudos" | "roteiros", id: string) {
  await exigirPapel("admin", "equipe");
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from(tabela).select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const cliente = await clienteParaFormulario(data.cliente_id as string);
  return { item: data, cliente };
}
