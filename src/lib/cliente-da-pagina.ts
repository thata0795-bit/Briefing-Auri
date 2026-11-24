import "server-only";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Sessao } from "@/lib/sessao";

export type ClienteResumo = { id: string; nome: string };

/**
 * Cliente mostrado na página: para quem é cliente, a própria conta; para a
 * agência, o cliente escolhido em ?cliente= (ou o primeiro da lista).
 */
export async function clienteDaPagina(sessao: Sessao, pedido?: string | null) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("clientes").select("id, nome, status").neq("status", "encerrado").order("nome");
  const clientes = (data ?? []) as (ClienteResumo & { status: string })[];
  if (sessao.perfil.papel === "cliente") {
    const proprio = clientes[0];
    if (!proprio) redirect("/inicio");
    return { cliente: proprio, clientes: [proprio], agencia: false, supabase };
  }
  const cliente = clientes.find((c) => c.id === pedido) ?? clientes[0] ?? null;
  return { cliente, clientes, agencia: true, supabase };
}
