"use server";

import { z } from "zod";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { METRICAS } from "@/lib/relatorios";

export type Resultado = { ok: true } | { ok: false; erro: string };

const inteiro = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim().replace(/\./g, "").replace(/\s/g, ""))
  .refine((v) => v === "" || /^\d{1,10}$/.test(v), "Use só números inteiros, sem vírgula.")
  .transform((v) => (v === "" ? null : Number(v)))
  .refine((v) => v == null || v <= 2_000_000_000, "Número grande demais.");
const texto = z.string().optional().transform((v) => (v ?? "").trim() || null).refine((v) => v == null || v.length <= 4000, "Use até 4.000 caracteres por campo.");

const Relatorio = z.object({
  cliente_id: z.string().uuid(),
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  publicar: z.boolean(),
  seguidores: inteiro,
  alcance: inteiro,
  impressoes: inteiro,
  interacoes: inteiro,
  visitas_perfil: inteiro,
  cliques_link: inteiro,
  publicacoes: inteiro,
  destaques: texto,
  analise: texto,
  proximos_passos: texto,
});

/** Salva o relatório do mês. Publicar deixa visível para o cliente; rascunho esconde. */
export async function salvarRelatorio(_: Resultado | null, dados: FormData): Promise<Resultado> {
  const sessao = await obterSessao();
  if (sessao.perfil.papel === "cliente") return { ok: false, erro: "Só a agência edita o relatório." };
  const p = Relatorio.safeParse({ ...Object.fromEntries(dados), publicar: dados.get("acao") === "publicar" });
  if (!p.success) {
    const q = p.error.issues[0];
    const nome = METRICAS.find((m) => m.campo === q.path[0])?.rotulo;
    return { ok: false, erro: nome ? `${nome}: ${q.message}` : q.message };
  }
  const { cliente_id, mes, publicar, ...campos } = p.data;
  if (METRICAS.every((m) => campos[m.campo] == null)) return { ok: false, erro: "Preencha ao menos um número." };
  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase.from("clientes").select("id, agencia_id").eq("id", cliente_id).maybeSingle();
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };
  const { data: atual } = await supabase.from("relatorios").select("id, publicado_em").eq("cliente_id", cliente_id).eq("mes", mes).maybeSingle();
  const publicado_em = publicar ? (atual?.publicado_em ?? new Date().toISOString()) : null;
  const { error } = atual
    ? await supabase.from("relatorios").update({ ...campos, publicado_em }).eq("id", atual.id)
    : await supabase.from("relatorios").insert({ cliente_id, agencia_id: cliente.agencia_id, mes, ...campos, publicado_em, criado_por: sessao.userId });
  if (error) return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  return { ok: true };
}
