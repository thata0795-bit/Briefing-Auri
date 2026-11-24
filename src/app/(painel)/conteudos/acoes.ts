"use server";

import { z } from "zod";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export type Resultado = { ok: true; destino?: string } | { ok: false; erro: string };

const uuid = z.string().uuid();
const TipoItem = z.enum(["conteudo", "roteiro"]);
const TipoComentavel = z.enum(["conteudo", "roteiro", "estrategia"]);
const TABELA = { conteudo: "conteudos", roteiro: "roteiros", estrategia: "estrategias" } as const;

function erroDoBanco(e: unknown, padrao = "Não foi possível salvar. Tente de novo.") {
  const m = (e as { message?: string })?.message;
  const code = (e as { code?: string })?.code;
  if (m && code && ["55000", "P0002", "22023"].includes(code)) return m;
  return padrao;
}

// ---------------------------------------------------------------------------
// Cliente: aprovar, pedir ajuste, aprovar vários, comentar
// ---------------------------------------------------------------------------
export async function responder(tipo: string, id: string, acao: "aprovar" | "ajuste", texto?: string): Promise<Resultado> {
  const t = TipoItem.safeParse(tipo);
  if (!t.success || !uuid.safeParse(id).success) return { ok: false, erro: "Item inválido." };
  if (acao === "ajuste" && (texto ?? "").trim().length < 3) return { ok: false, erro: "Descreva o que precisa ser ajustado." };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("responder_item", { p_tipo: t.data, p_id: id, p_acao: acao, p_texto: (texto ?? "").slice(0, 4000) });
  if (error) return { ok: false, erro: erroDoBanco(error) };
  return { ok: true };
}

export async function aprovarVarios(itens: { tipo: string; id: string }[]): Promise<Resultado & { aprovados?: number }> {
  if (!Array.isArray(itens) || itens.length === 0 || itens.length > 60) return { ok: false, erro: "Escolha o que aprovar." };
  const supabase = await criarClienteServidor();
  let aprovados = 0;
  for (const i of itens) {
    if (!TipoItem.safeParse(i.tipo).success || !uuid.safeParse(i.id).success) continue;
    const { error } = await supabase.rpc("responder_item", { p_tipo: i.tipo, p_id: i.id, p_acao: "aprovar", p_texto: null });
    if (!error) aprovados++;
  }
  if (aprovados === 0) return { ok: false, erro: "Nada foi aprovado. Atualize a página e tente de novo." };
  return { ok: true, aprovados };
}

export async function comentar(tipo: string, id: string, texto: string): Promise<Resultado> {
  const t = TipoComentavel.safeParse(tipo);
  const limpo = (texto ?? "").trim();
  if (!t.success || !uuid.safeParse(id).success) return { ok: false, erro: "Item inválido." };
  if (limpo.length < 1 || limpo.length > 4000) return { ok: false, erro: "Escreva um comentário de até 4.000 caracteres." };
  const sessao = await obterSessao();
  const supabase = await criarClienteServidor();
  const { data: item } = await supabase.from(TABELA[t.data]).select("cliente_id, agencia_id").eq("id", id).maybeSingle();
  if (!item) return { ok: false, erro: "Item não encontrado." };
  const { error } = await supabase.from("comentarios").insert({
    cliente_id: item.cliente_id,
    agencia_id: item.agencia_id,
    item_tipo: t.data,
    item_id: id,
    autor_id: sessao.userId,
    tipo: "comentario",
    texto: limpo,
  });
  if (error) return { ok: false, erro: erroDoBanco(error) };
  return { ok: true };
}

export async function marcarRoteiroLido(id: string) {
  if (!uuid.safeParse(id).success) return;
  const supabase = await criarClienteServidor();
  await supabase.rpc("marcar_roteiro_lido", { p_id: id });
}

// ---------------------------------------------------------------------------
// Agência: criar, editar e mudar situação
// ---------------------------------------------------------------------------
async function exigirEquipe() {
  const sessao = await obterSessao();
  if (sessao.perfil.papel === "cliente") throw new Error("Só a agência faz isso.");
  return sessao;
}

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data.");
const textoOpcional = (max: number) => z.string().trim().max(max, `Use até ${max} caracteres.`).optional().transform((v) => v || null);

const ConteudoForm = z.object({
  id: uuid.optional().or(z.literal("").transform(() => undefined)),
  cliente_id: uuid,
  data_publicacao: data,
  horario: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().regex(/^\d{2}:\d{2}$/).nullable()),
  formato: z.enum(["feed", "carrossel", "reels", "stories"]),
  titulo: z.string().trim().min(2, "Dê um título ao post.").max(160),
  legenda: textoOpcional(5000),
  arte_caminho: z.string().max(500).optional().transform((v) => v || null),
  enviar: z.boolean(),
});

export async function salvarConteudo(_: Resultado | null, dados: FormData): Promise<Resultado> {
  const sessao = await exigirEquipe();
  const p = ConteudoForm.safeParse({ ...Object.fromEntries(dados), enviar: dados.get("acao") === "enviar" });
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  const { id, enviar, ...campos } = p.data;
  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase.from("clientes").select("id, agencia_id").eq("id", campos.cliente_id).maybeSingle();
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };
  if (campos.arte_caminho && !campos.arte_caminho.startsWith(`${cliente.agencia_id}/${cliente.id}/conteudos/`)) {
    return { ok: false, erro: "Arte inválida." };
  }

  const linha = { ...campos, agencia_id: cliente.agencia_id, ...(enviar ? { status: "aguardando_aprovacao" } : {}) };
  let salvoId = id;
  let anterior: string | null = null;
  if (id) {
    const { data: atual } = await supabase.from("conteudos").select("status").eq("id", id).maybeSingle();
    anterior = atual?.status ?? null;
    const { data: r, error } = await supabase.from("conteudos").update(linha).eq("id", id).select("id").maybeSingle();
    if (error || !r) return { ok: false, erro: erroDoBanco(error) };
  } else {
    const { data: r, error } = await supabase
      .from("conteudos")
      .insert({ ...linha, criado_por: sessao.userId, status: enviar ? "aguardando_aprovacao" : "em_andamento" })
      .select("id")
      .single();
    if (error || !r) return { ok: false, erro: erroDoBanco(error) };
    salvoId = r.id;
  }
  if (enviar && anterior === "ajuste_solicitado") await registrarReenvio("conteudo", salvoId!, cliente, sessao.userId);
  return { ok: true, destino: `/conteudos/${salvoId}?cliente=${cliente.id}` };
}

const RoteiroForm = z.object({
  id: uuid.optional().or(z.literal("").transform(() => undefined)),
  cliente_id: uuid,
  tipo: z.enum(["reels", "stories"]),
  titulo: z.string().trim().min(2, "Dê um título ao roteiro.").max(160),
  data_gravacao: data,
  objetivo: textoOpcional(2000),
  gancho: textoOpcional(2000),
  falas: textoOpcional(10000),
  cenas: textoOpcional(10000),
  referencias: textoOpcional(2000),
  o_que_levar: textoOpcional(2000),
  publicar: z.boolean(),
});

export async function salvarRoteiro(_: Resultado | null, dados: FormData): Promise<Resultado> {
  const sessao = await exigirEquipe();
  const p = RoteiroForm.safeParse({ ...Object.fromEntries(dados), publicar: dados.get("acao") === "publicar" });
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  const { id, publicar, ...campos } = p.data;
  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase.from("clientes").select("id, agencia_id").eq("id", campos.cliente_id).maybeSingle();
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };

  const extra = publicar ? { status: "aguardando_aprovacao", publicado_em: new Date().toISOString() } : {};
  let salvoId = id;
  let anterior: string | null = null;
  if (id) {
    const { data: atual } = await supabase.from("roteiros").select("status, publicado_em").eq("id", id).maybeSingle();
    anterior = atual?.status ?? null;
    const manterPublicacao = publicar && atual?.publicado_em ? { publicado_em: atual.publicado_em } : {};
    const { data: r, error } = await supabase
      .from("roteiros")
      .update({ ...campos, agencia_id: cliente.agencia_id, ...extra, ...manterPublicacao })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error || !r) return { ok: false, erro: erroDoBanco(error) };
  } else {
    const { data: r, error } = await supabase
      .from("roteiros")
      .insert({ ...campos, agencia_id: cliente.agencia_id, criado_por: sessao.userId, status: "em_andamento", ...extra })
      .select("id")
      .single();
    if (error || !r) return { ok: false, erro: erroDoBanco(error) };
    salvoId = r.id;
  }
  if (publicar && anterior === "ajuste_solicitado") await registrarReenvio("roteiro", salvoId!, cliente, sessao.userId);
  return { ok: true, destino: `/roteiros/${salvoId}?cliente=${cliente.id}` };
}

async function registrarReenvio(tipo: "conteudo" | "roteiro", id: string, cliente: { id: string; agencia_id: string }, autor: string) {
  await criarClienteAdmin().from("comentarios").insert({
    cliente_id: cliente.id,
    agencia_id: cliente.agencia_id,
    item_tipo: tipo,
    item_id: id,
    autor_id: autor,
    tipo: "reenvio",
    texto: "Ajuste feito. Enviado de novo para a sua aprovação.",
  });
}

const PROXIMOS: Record<string, string[]> = {
  em_andamento: ["aguardando_aprovacao"],
  aguardando_aprovacao: ["em_andamento"],
  ajuste_solicitado: ["aguardando_aprovacao"],
  aprovado: ["programado", "concluido", "em_andamento"],
  programado: ["concluido", "aprovado"],
  concluido: ["programado"],
};

export async function mudarSituacao(tipo: string, id: string, novo: string): Promise<Resultado> {
  const sessao = await exigirEquipe();
  const t = TipoItem.safeParse(tipo);
  if (!t.success || !uuid.safeParse(id).success) return { ok: false, erro: "Item inválido." };
  const tabela = t.data === "conteudo" ? "conteudos" : "roteiros";
  const supabase = await criarClienteServidor();
  const { data: atual } = await supabase.from(tabela).select("status, cliente_id, agencia_id, publicado_em").eq("id", id).maybeSingle();
  if (!atual) return { ok: false, erro: "Item não encontrado." };
  if (!PROXIMOS[atual.status]?.includes(novo) || (t.data === "roteiro" && novo === "programado")) {
    return { ok: false, erro: "Essa mudança não é possível a partir da situação atual." };
  }
  const extra = t.data === "roteiro" && novo === "aguardando_aprovacao" && !atual.publicado_em ? { publicado_em: new Date().toISOString() } : {};
  const { data: r, error } = await supabase.from(tabela).update({ status: novo, ...extra }).eq("id", id).select("id").maybeSingle();
  if (error || !r) return { ok: false, erro: erroDoBanco(error) };
  if (novo === "aguardando_aprovacao" && atual.status === "ajuste_solicitado") {
    await registrarReenvio(t.data, id, { id: atual.cliente_id, agencia_id: atual.agencia_id }, sessao.userId);
  }
  return { ok: true };
}
