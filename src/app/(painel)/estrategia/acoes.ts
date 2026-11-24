"use server";

import { z } from "zod";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

export type Resultado = { ok: true } | { ok: false; erro: string };

const texto = z.string().trim().max(4000, "Use até 4.000 caracteres por campo.").optional().transform((v) => v || null);
const Estrategia = z.object({
  cliente_id: z.string().uuid(),
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  foco: texto,
  objetivos: texto,
  pilares: texto,
  metas: texto,
  publicar: z.boolean(),
});

/**
 * Salva a estratégia do mês. Se a versão atual já foi publicada, cria uma
 * versão nova, para o cliente sempre ver o histórico do que mudou.
 */
export async function salvarEstrategia(_: Resultado | null, dados: FormData): Promise<Resultado> {
  const sessao = await obterSessao();
  if (sessao.perfil.papel === "cliente") return { ok: false, erro: "Só a agência edita a estratégia." };
  const p = Estrategia.safeParse({ ...Object.fromEntries(dados), publicar: dados.get("acao") === "publicar" });
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  const { cliente_id, mes, publicar, ...campos } = p.data;
  if (!campos.foco && !campos.objetivos && !campos.pilares && !campos.metas) return { ok: false, erro: "Preencha ao menos um campo." };
  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase.from("clientes").select("id, agencia_id").eq("id", cliente_id).maybeSingle();
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };
  const { data: versoes } = await supabase.from("estrategias").select("id, versao, publicado_em").eq("cliente_id", cliente_id).eq("mes", mes).order("versao", { ascending: false }).limit(1);
  const atual = versoes?.[0];
  const publicado_em = publicar ? new Date().toISOString() : null;
  const { error } =
    atual && !atual.publicado_em
      ? await supabase.from("estrategias").update({ ...campos, publicado_em }).eq("id", atual.id)
      : await supabase.from("estrategias").insert({
          cliente_id,
          agencia_id: cliente.agencia_id,
          mes,
          versao: (atual?.versao ?? 0) + 1,
          ...campos,
          publicado_em,
          criado_por: sessao.userId,
        });
  if (error) return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  return { ok: true };
}

export async function salvarResumoReuniao(compromissoId: string, resumo: string): Promise<Resultado> {
  const sessao = await obterSessao();
  if (sessao.perfil.papel === "cliente") return { ok: false, erro: "Só a agência registra o resumo." };
  if (!z.string().uuid().safeParse(compromissoId).success) return { ok: false, erro: "Reunião inválida." };
  if (resumo.length > 8000) return { ok: false, erro: "Use até 8.000 caracteres." };
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("compromissos").update({ resumo: resumo.trim() || null }).eq("id", compromissoId).select("id").maybeSingle();
  if (error || !data) return { ok: false, erro: "Não foi possível salvar." };
  return { ok: true };
}
