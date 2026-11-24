"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { acharPergunta, normalizarResposta, pendentes, type Respostas } from "@/lib/briefing/perguntas";
import { TERMOS_VERSAO } from "@/lib/entrada";

export type Resultado = { ok: true; destino?: string } | { ok: false; erro: string };

/** Conta do cliente logado, pelo RLS. */
async function minhaConta() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");
  const { data } = await supabase.from("cliente_usuarios").select("cliente_id, agencia_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!data) throw new Error("Conta não encontrada.");
  return { supabase, userId: user.id, clienteId: data.cliente_id as string, agenciaId: data.agencia_id as string };
}

function mensagem(e: unknown, padrao = "Não foi possível salvar. Tente de novo.") {
  const m = (e as { message?: string })?.message;
  const code = (e as { code?: string })?.code;
  // Mensagens das funções do banco (55000, P0002, 22023) já são escritas para o cliente.
  if (m && code && ["55000", "P0002", "22023"].includes(code)) return m;
  return padrao;
}

export async function concluirBoasVindas(_: Resultado | null, dados: FormData): Promise<Resultado> {
  if (dados.get("aceite") !== "on") return { ok: false, erro: "Para continuar, marque que leu e aceita os termos." };
  try {
    const { supabase, clienteId } = await minhaConta();
    const { error } = await supabase.rpc("concluir_boas_vindas", { p_cliente: clienteId, p_termos_versao: TERMOS_VERSAO });
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
  return { ok: true, destino: "/entrada" };
}

export async function salvarResposta(chave: string, valor: unknown): Promise<Resultado> {
  const pergunta = acharPergunta(chave);
  if (!pergunta || pergunta.tipo === "arquivo") return { ok: false, erro: "Pergunta inválida." };
  const normal = normalizarResposta(pergunta, valor);
  if (!normal.ok) return normal;
  try {
    const { supabase, clienteId } = await minhaConta();
    const { error } = await supabase.rpc("salvar_resposta_briefing", { p_cliente: clienteId, p_chave: chave, p_valor: normal.valor });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
}

export async function pularPergunta(chave: string, pular: boolean): Promise<Resultado> {
  if (!acharPergunta(chave)) return { ok: false, erro: "Pergunta inválida." };
  try {
    const { supabase, clienteId } = await minhaConta();
    const { error } = await supabase.rpc("pular_pergunta_briefing", { p_cliente: clienteId, p_chave: chave, p_pular: pular });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
}

const ArquivoEnviado = z.object({
  chave: z.string(),
  caminho: z.string().max(500),
  nome: z.string().min(1).max(200),
  tamanho: z.number().int().positive().max(52428800),
  tipo: z.string().max(120),
});

/** Registra um arquivo já enviado ao armazenamento e liga à pergunta do briefing. */
export async function registrarArquivoBriefing(entrada: z.infer<typeof ArquivoEnviado>): Promise<Resultado & { id?: string }> {
  const d = ArquivoEnviado.safeParse(entrada);
  const pergunta = d.success ? acharPergunta(d.data.chave) : undefined;
  if (!d.success || pergunta?.tipo !== "arquivo") return { ok: false, erro: "Arquivo inválido." };
  try {
    const { supabase, clienteId, agenciaId, userId } = await minhaConta();
    if (!d.data.caminho.startsWith(`${agenciaId}/${clienteId}/briefing/`)) return { ok: false, erro: "Arquivo inválido." };
    const { data: arquivo, error } = await supabase
      .from("arquivos")
      .insert({
        cliente_id: clienteId,
        agencia_id: agenciaId,
        pasta: "briefing",
        nome: d.data.nome,
        caminho: d.data.caminho,
        tamanho: d.data.tamanho,
        tipo_mime: d.data.tipo,
        referencia: d.data.chave,
        enviado_por: userId,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { data: b } = await supabase.from("briefings").select("respostas").eq("cliente_id", clienteId).single();
    const atuais = ((b?.respostas as Respostas)?.[d.data.chave] as string[] | undefined) ?? [];
    const { error: e2 } = await supabase.rpc("salvar_resposta_briefing", {
      p_cliente: clienteId,
      p_chave: d.data.chave,
      p_valor: [...atuais, arquivo.id].slice(-20),
    });
    if (e2) throw e2;
    return { ok: true, id: arquivo.id };
  } catch (e) {
    return { ok: false, erro: mensagem(e, "Não foi possível registrar o arquivo.") };
  }
}

export async function removerArquivoBriefing(chave: string, arquivoId: string): Promise<Resultado> {
  if (acharPergunta(chave)?.tipo !== "arquivo" || !/^[0-9a-f-]{36}$/.test(arquivoId)) return { ok: false, erro: "Arquivo inválido." };
  try {
    const { supabase, clienteId } = await minhaConta();
    const { data: arquivo } = await supabase.from("arquivos").select("caminho").eq("id", arquivoId).eq("cliente_id", clienteId).maybeSingle();
    if (arquivo) {
      await supabase.storage.from("arquivos").remove([arquivo.caminho]);
      await supabase.from("arquivos").delete().eq("id", arquivoId);
    }
    const { data: b } = await supabase.from("briefings").select("respostas").eq("cliente_id", clienteId).single();
    const atuais = ((b?.respostas as Respostas)?.[chave] as string[] | undefined) ?? [];
    const restantes = atuais.filter((id) => id !== arquivoId);
    const { error } = await supabase.rpc("salvar_resposta_briefing", {
      p_cliente: clienteId,
      p_chave: chave,
      p_valor: restantes.length ? restantes : null,
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
}

export async function concluirBriefing(): Promise<Resultado & { faltam?: string[] }> {
  try {
    const { supabase, clienteId, userId } = await minhaConta();
    const { data: b, error } = await supabase.from("briefings").select("respostas, puladas").eq("cliente_id", clienteId).single();
    if (error) throw error;
    const faltam = pendentes((b.respostas ?? {}) as Respostas, b.puladas ?? []);
    if (faltam.length) {
      return { ok: false, erro: "Faltam algumas respostas obrigatórias.", faltam: faltam.map((p) => p.chave) };
    }
    // A checagem das perguntas obrigatórias vive no código; a transição usa a chave de serviço.
    const admin = criarClienteAdmin();
    const { data: etapas } = await admin
      .from("etapas_entrada")
      .select("etapa, status")
      .eq("cliente_id", clienteId)
      .in("etapa", ["boas_vindas", "contrato"]);
    if ((etapas ?? []).some((e) => e.status !== "concluido")) {
      return { ok: false, erro: "Conclua as etapas anteriores primeiro." };
    }
    await admin.from("briefings").update({ concluido_em: new Date().toISOString() }).eq("cliente_id", clienteId);
    const { error: e2 } = await admin.rpc("concluir_etapa_servico", { p_cliente: clienteId, p_etapa: "briefing", p_quem: userId });
    if (e2) throw e2;
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
  return { ok: true, destino: "/entrada" };
}

const StatusAcesso = z.enum(["pendente", "liberado", "nao_tenho", "ajuda"]);

export async function marcarAcesso(tipo: string, status: string, observacao?: string): Promise<Resultado> {
  const s = StatusAcesso.safeParse(status);
  if (!s.success) return { ok: false, erro: "Opção inválida." };
  try {
    const { supabase, clienteId } = await minhaConta();
    const { error } = await supabase.rpc("marcar_acesso", {
      p_cliente: clienteId,
      p_tipo: tipo,
      p_status: s.data,
      p_observacao: (observacao ?? "").slice(0, 1000),
    });
    if (error) throw error;
    revalidatePath("/entrada/acessos");
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
}

export async function concluirAcessos(): Promise<Resultado> {
  try {
    const { supabase, clienteId } = await minhaConta();
    const { error } = await supabase.rpc("concluir_acessos", { p_cliente: clienteId });
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagem(e) };
  }
  return { ok: true, destino: "/entrada" };
}

export async function reservarReuniao(horarioId: string): Promise<Resultado> {
  if (!/^[0-9a-f-]{36}$/.test(horarioId)) return { ok: false, erro: "Horário inválido." };
  try {
    const { supabase, clienteId } = await minhaConta();
    const { error } = await supabase.rpc("reservar_primeira_reuniao", { p_cliente: clienteId, p_horario: horarioId });
    if (error) throw error;
  } catch (e) {
    return { ok: false, erro: mensagem(e, "Não foi possível reservar. Tente outro horário.") };
  }
  return { ok: true, destino: "/entrada/reuniao?marcada=1" };
}
