"use server";

import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function salvarManual(_: { ok: boolean; msg: string } | null, dados: FormData) {
  const sessao = await exigirPapel("admin");
  const texto = String(dados.get("manual") ?? "").trim();
  if (texto.length < 20) return { ok: false, msg: "O manual está curto demais." };
  if (texto.length > 30000) return { ok: false, msg: "Use até 30.000 caracteres." };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("agencias").update({ manual_parceria: texto }).eq("id", sessao.agencia.id).select("id").maybeSingle();
  if (error || !data) return { ok: false, msg: "Não foi possível salvar." };
  return { ok: true, msg: "Manual salvo. Os clientes já veem a versão nova em Documentos." };
}
