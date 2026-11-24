"use server";

import { redirect } from "next/navigation";
import { assinarCorpo, provedorSimuladoAtivo } from "@/lib/contratos/assinatura";
import { SITE_URL } from "@/lib/supabase/env";
import { DEMO } from "@/lib/demo/config";
import { criarClienteAdmin } from "@/lib/supabase/admin";

/** Faz o que o provedor real faria: chama o nosso webhook com a assinatura HMAC. */
export async function assinarSimulado(dados: FormData) {
  if (!provedorSimuladoAtivo()) throw new Error("Indisponível.");
  const ref = String(dados.get("ref") ?? "");
  const nome = String(dados.get("nome") ?? "").trim().slice(0, 200);
  if (DEMO) {
    // Sem servidor externo na demonstração: confirma direto, como o webhook faria.
    const admin = criarClienteAdmin();
    const { data: k } = await admin.from("contratos").select("id").eq("provedor_ref", ref).maybeSingle();
    if (k) await admin.rpc("confirmar_assinatura_contrato", { p_contrato: k.id, p_assinado_por: nome, p_origem: "demonstracao" });
    redirect("/entrada/contrato?assinado=1");
  }
  const corpo = JSON.stringify({ evento: "assinado", ref, assinado_por: nome });
  const r = await fetch(`${SITE_URL()}/api/webhooks/assinatura`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-assinatura-hmac": assinarCorpo(corpo) },
    body: corpo,
  });
  if (!r.ok) throw new Error(`Webhook recusou: ${r.status}`);
  redirect("/entrada/contrato?assinado=1");
}
