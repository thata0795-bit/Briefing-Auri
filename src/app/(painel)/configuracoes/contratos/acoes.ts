"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoModelo = { ok: boolean; erro?: string; mensagem?: string } | null;

const Modelo = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  nome: z.string().trim().min(2, "Dê um nome ao modelo.").max(120),
  corpo: z.string().trim().min(20, "O texto do contrato está curto demais.").max(100000),
  padrao: z.boolean(),
});

export async function salvarModelo(_: EstadoModelo, dados: FormData): Promise<EstadoModelo> {
  const sessao = await exigirPapel("admin");
  const p = Modelo.safeParse({ ...Object.fromEntries(dados), padrao: dados.get("padrao") === "on" });
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  const supabase = await criarClienteServidor();
  if (p.data.padrao) {
    await supabase.from("modelos_contrato").update({ padrao: false }).eq("agencia_id", sessao.agencia.id).eq("padrao", true);
  }
  const linha = { agencia_id: sessao.agencia.id, nome: p.data.nome, corpo: p.data.corpo, padrao: p.data.padrao };
  const { error } = p.data.id
    ? await supabase.from("modelos_contrato").update(linha).eq("id", p.data.id)
    : await supabase.from("modelos_contrato").insert(linha);
  if (error) return { ok: false, erro: "Não foi possível salvar." };
  revalidatePath("/configuracoes/contratos");
  return { ok: true, mensagem: "Modelo salvo." };
}
