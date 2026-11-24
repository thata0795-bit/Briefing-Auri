"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarUsuarioConvidado, enviarConvite, ErroConvite } from "@/lib/convites";
import { gerarEEnviarContrato } from "@/lib/contratos/gerar";

export type Estado = {
  ok: boolean;
  erro?: string;
  campos?: Record<string, string>;
  mensagem?: string;
  /** Valores enviados, para o formulário não perder o que foi digitado quando dá erro. */
  valores?: Record<string, string | string[]>;
  /** Para onde o formulário leva depois de salvar. */
  destino?: string;
} | null;

function valoresDo(dados: FormData) {
  const v: Record<string, string | string[]> = {};
  for (const k of new Set(dados.keys())) {
    if (k.startsWith("$")) continue;
    const todos = dados.getAll(k).map(String);
    v[k] = todos.length > 1 || k === "equipe" ? todos : todos[0];
  }
  return v;
}

async function exigirAdmin() {
  const sessao = await obterSessao();
  if (sessao.perfil.papel !== "admin") throw new Error("Só o admin da agência pode fazer isso.");
  return sessao;
}

const uuid = z.string().uuid();
const texto = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, `Use até ${max} caracteres.`);

const NovoCliente = z.object({
  nome: texto(2, 160, "Informe o nome da empresa."),
  segmento: z.string().trim().max(80).optional(),
  contato_nome: texto(2, 120, "Informe o nome do contato."),
  contato_email: z.string().trim().toLowerCase().email("Confira o e-mail."),
  plano: texto(2, 120, "Informe o plano."),
  valor: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .pipe(z.number({ message: "Valor inválido." }).min(0, "Valor inválido.").max(1_000_000, "Valor inválido.")),
  dia_vencimento: z.coerce.number().int().min(1, "Escolha um dia de 1 a 28.").max(28, "Escolha um dia de 1 a 28."),
  forma_pagamento: z.enum(["boleto", "pix", "cartao"]),
  inicio_contrato: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
  responsavel_id: uuid.optional().or(z.literal("").transform(() => undefined)),
  equipe: z.array(uuid).max(20).default([]),
  enviar_contrato: z.boolean(),
});

function errosDeCampo(e: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const i of e.issues) campos[String(i.path[0])] ??= i.message;
  return campos;
}

export async function convidarCliente(_: Estado, dados: FormData): Promise<Estado> {
  const sessao = await exigirAdmin();
  const valores = valoresDo(dados);
  const parse = NovoCliente.safeParse({
    ...Object.fromEntries(dados),
    equipe: dados.getAll("equipe"),
    enviar_contrato: dados.get("enviar_contrato") === "on",
  });
  if (!parse.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(parse.error), valores };
  const d = parse.data;
  const agenciaId = sessao.agencia.id;
  const admin = criarClienteAdmin();

  // Responsável e equipe precisam ser da mesma agência.
  const pessoas = [...new Set([d.responsavel_id, ...d.equipe].filter(Boolean))] as string[];
  if (pessoas.length) {
    const { data } = await admin.from("perfis").select("id").in("id", pessoas).eq("agencia_id", agenciaId).in("papel", ["admin", "equipe"]);
    if ((data ?? []).length !== pessoas.length) return { ok: false, erro: "Responsável ou equipe inválidos.", valores };
  }

  const { data: cliente, error } = await admin
    .from("clientes")
    .insert({ agencia_id: agenciaId, nome: d.nome, segmento: d.segmento || null, responsavel_id: d.responsavel_id ?? null })
    .select("id")
    .single();
  if (error) return { ok: false, erro: "Não foi possível cadastrar. Tente de novo.", valores };

  let userId: string | null = null;
  try {
    const { error: e1 } = await admin.from("financeiro_clientes").insert({
      cliente_id: cliente.id,
      agencia_id: agenciaId,
      plano: d.plano,
      valor_mensal: d.valor,
      dia_vencimento: d.dia_vencimento,
      forma_pagamento: d.forma_pagamento,
      inicio_contrato: d.inicio_contrato,
    });
    if (e1) throw e1;

    const equipe = d.equipe.filter((id) => id !== undefined);
    const { data: membrosEquipe } = equipe.length
      ? await admin.from("perfis").select("id").in("id", equipe).eq("papel", "equipe")
      : { data: [] };
    if (membrosEquipe?.length) {
      const { error: e2 } = await admin
        .from("equipe_clientes")
        .insert(membrosEquipe.map((m) => ({ cliente_id: cliente.id, agencia_id: agenciaId, user_id: m.id })));
      if (e2) throw e2;
    }

    userId = await criarUsuarioConvidado({
      email: d.contato_email,
      nome: d.contato_nome,
      agenciaId,
      papel: "cliente",
      clienteId: cliente.id,
    });

    const { data: resp } = d.responsavel_id
      ? await admin.from("perfis").select("nome").eq("id", d.responsavel_id).single()
      : { data: null };

    await enviarConvite({
      userId,
      email: d.contato_email,
      nome: d.contato_nome,
      agenciaId,
      nomeAgencia: sessao.agencia.nome,
      contatoAgencia: sessao.agencia.email_contato,
      clienteId: cliente.id,
      criadoPor: sessao.userId,
      responsavel: resp?.nome,
    });

    if (d.enviar_contrato) {
      await gerarEEnviarContrato({ agenciaId, clienteId: cliente.id, criadoPor: sessao.userId });
    }
  } catch (e) {
    // Desfaz o cadastro para não deixar cliente nem acesso pela metade.
    await admin.from("clientes").delete().eq("id", cliente.id);
    if (userId) await admin.auth.admin.deleteUser(userId);
    if (e instanceof ErroConvite) return { ok: false, erro: e.message, campos: { contato_email: e.message }, valores };
    console.error("[convidarCliente]", e);
    return { ok: false, erro: (e as Error).message?.startsWith("Cadastre") ? (e as Error).message : "Não foi possível concluir o cadastro. Nada foi salvo.", valores };
  }

  // Sem revalidatePath: as páginas são dinâmicas, e a atualização disputaria com a navegação.
  return { ok: true, destino: `/clientes/${cliente.id}?convidado=1` };
}

/** Convida mais uma pessoa do lado do cliente (sócio, gerente de marketing). */
export async function convidarPessoaDoCliente(_: Estado, dados: FormData): Promise<Estado> {
  const sessao = await exigirAdmin();
  const p = z
    .object({ cliente_id: uuid, nome: texto(2, 120, "Informe o nome."), email: z.string().trim().toLowerCase().email("Confira o e-mail.") })
    .safeParse(Object.fromEntries(dados));
  if (!p.success) return { ok: false, erro: "Confira os campos.", campos: errosDeCampo(p.error) };
  const admin = criarClienteAdmin();
  const { data: cliente } = await admin.from("clientes").select("id").eq("id", p.data.cliente_id).eq("agencia_id", sessao.agencia.id).maybeSingle();
  if (!cliente) return { ok: false, erro: "Cliente não encontrado." };
  try {
    const userId = await criarUsuarioConvidado({ email: p.data.email, nome: p.data.nome, agenciaId: sessao.agencia.id, papel: "cliente", clienteId: cliente.id });
    await enviarConvite({
      userId,
      email: p.data.email,
      nome: p.data.nome,
      agenciaId: sessao.agencia.id,
      nomeAgencia: sessao.agencia.nome,
      contatoAgencia: sessao.agencia.email_contato,
      clienteId: cliente.id,
      criadoPor: sessao.userId,
    });
  } catch (e) {
    if (e instanceof ErroConvite) return { ok: false, erro: e.message };
    console.error("[convidarPessoaDoCliente]", e);
    return { ok: false, erro: "Não foi possível enviar o convite." };
  }
  revalidatePath(`/clientes/${cliente.id}`);
  return { ok: true, mensagem: "Convite enviado." };
}

export async function reenviarConvite(dados: FormData) {
  const sessao = await exigirAdmin();
  const userId = uuid.parse(dados.get("user_id"));
  const admin = criarClienteAdmin();
  const { data: perfil } = await admin.from("perfis").select("id, nome, email, papel, agencia_id").eq("id", userId).single();
  if (!perfil || perfil.agencia_id !== sessao.agencia.id) throw new Error("Pessoa não encontrada.");
  const { data: vinculo } = await admin.from("cliente_usuarios").select("cliente_id").eq("user_id", userId).maybeSingle();
  await enviarConvite({
    userId,
    email: perfil.email,
    nome: perfil.nome,
    agenciaId: sessao.agencia.id,
    nomeAgencia: sessao.agencia.nome,
    contatoAgencia: sessao.agencia.email_contato,
    clienteId: vinculo?.cliente_id ?? null,
    criadoPor: sessao.userId,
    equipe: perfil.papel !== "cliente",
  });
  revalidatePath(vinculo ? `/clientes/${vinculo.cliente_id}` : "/equipe");
}

export async function enviarContrato(dados: FormData) {
  const sessao = await exigirAdmin();
  const clienteId = uuid.parse(dados.get("cliente_id"));
  const modeloId = dados.get("modelo_id") ? uuid.parse(dados.get("modelo_id")) : null;
  await gerarEEnviarContrato({ agenciaId: sessao.agencia.id, clienteId, modeloId, criadoPor: sessao.userId });
  revalidatePath(`/clientes/${clienteId}`);
}

export async function marcarContratoAssinadoManual(dados: FormData) {
  await exigirAdmin();
  const contratoId = uuid.parse(dados.get("contrato_id"));
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("confirmar_assinatura_contrato", {
    p_contrato: contratoId,
    p_assinado_por: "Assinado fora do sistema",
    p_origem: "manual",
  });
  if (error) throw error;
  revalidatePath("/clientes", "layout");
}

/** Equipe confirma um acesso liberado pelo cliente. */
export async function confirmarAcesso(dados: FormData) {
  const clienteId = uuid.parse(dados.get("cliente_id"));
  const tipo = z.enum(["instagram", "meta_business", "google_meu_negocio", "dominio"]).parse(dados.get("tipo"));
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("marcar_acesso", { p_cliente: clienteId, p_tipo: tipo, p_status: "confirmado", p_observacao: null });
  if (error) throw error;
  revalidatePath(`/clientes/${clienteId}`);
}

export async function atualizarEquipeDoCliente(dados: FormData) {
  const sessao = await exigirAdmin();
  const clienteId = uuid.parse(dados.get("cliente_id"));
  const equipe = z.array(uuid).max(20).parse(dados.getAll("equipe"));
  const responsavel = dados.get("responsavel_id") ? uuid.parse(dados.get("responsavel_id")) : null;
  const supabase = await criarClienteServidor();
  const { error: e1 } = await supabase.from("clientes").update({ responsavel_id: responsavel }).eq("id", clienteId);
  if (e1) throw e1;
  await supabase.from("equipe_clientes").delete().eq("cliente_id", clienteId);
  if (equipe.length) {
    const { error } = await supabase
      .from("equipe_clientes")
      .insert(equipe.map((user_id) => ({ cliente_id: clienteId, agencia_id: sessao.agencia.id, user_id })));
    if (error) throw error;
  }
  revalidatePath(`/clientes/${clienteId}`);
}
