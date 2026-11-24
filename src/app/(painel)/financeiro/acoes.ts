"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

/** Cria as mensalidades do mês a partir do plano de cada cliente ativo. Não duplica. */
export async function gerarMensalidades(dados: FormData) {
  const sessao = await exigirPapel("admin");
  const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(dados.get("mes"));
  const supabase = await criarClienteServidor();
  const [{ data: planos }, { data: existentes }, { data: clientes }] = await Promise.all([
    supabase.from("financeiro_clientes").select("cliente_id, agencia_id, valor_mensal, dia_vencimento"),
    supabase.from("mensalidades").select("cliente_id").eq("competencia", mes),
    supabase.from("clientes").select("id, status"),
  ]);
  const ativos = new Set((clientes ?? []).filter((c) => c.status === "ativo" || c.status === "onboarding").map((c) => c.id));
  const ja = new Set((existentes ?? []).map((e) => e.cliente_id));
  const novas = (planos ?? [])
    .filter((p) => ativos.has(p.cliente_id) && !ja.has(p.cliente_id) && p.agencia_id === sessao.agencia.id)
    .map((p) => ({
      cliente_id: p.cliente_id,
      agencia_id: p.agencia_id,
      competencia: mes,
      valor: p.valor_mensal,
      vencimento: `${mes}-${String(p.dia_vencimento).padStart(2, "0")}`,
    }));
  if (novas.length) await supabase.from("mensalidades").insert(novas);
  revalidatePath("/financeiro");
}

export async function marcarPago(dados: FormData) {
  const sessao = await exigirPapel("admin");
  const id = z.string().uuid().parse(dados.get("id"));
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("mensalidades").update({ status: "pago", pago_em: new Date().toISOString() }).eq("id", id).select("cliente_id").maybeSingle();
  if (data) {
    await supabase.rpc("registrar_auditoria", { p_acao: "financeiro.pagamento_manual", p_entidade: "mensalidades", p_entidade_id: id, p_cliente_id: data.cliente_id, p_detalhes: { por: sessao.userId } });
  }
  revalidatePath("/financeiro");
}
