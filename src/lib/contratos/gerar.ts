import "server-only";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { obterProvedor } from "./assinatura";
import { preencherModelo } from "./modelo";

/**
 * Gera o contrato a partir de um modelo e envia para assinatura.
 * Chamado pelo servidor depois de conferir que quem pede é admin da agência.
 */
export async function gerarEEnviarContrato({
  agenciaId,
  clienteId,
  modeloId,
  criadoPor,
}: {
  agenciaId: string;
  clienteId: string;
  modeloId?: string | null;
  criadoPor: string;
}) {
  const admin = criarClienteAdmin();

  const modeloQuery = admin.from("modelos_contrato").select("id, nome, corpo").eq("agencia_id", agenciaId);
  const { data: modelo } = await (modeloId ? modeloQuery.eq("id", modeloId) : modeloQuery.eq("padrao", true)).maybeSingle();
  if (!modelo) throw new Error("Cadastre um modelo de contrato antes de enviar.");

  const [{ data: cliente }, { data: agencia }, { data: fin }, { data: usuarios }] = await Promise.all([
    admin.from("clientes").select("id, nome, agencia_id").eq("id", clienteId).eq("agencia_id", agenciaId).single(),
    admin.from("agencias").select("nome").eq("id", agenciaId).single(),
    admin.from("financeiro_clientes").select("plano, valor_mensal, dia_vencimento, forma_pagamento, inicio_contrato").eq("cliente_id", clienteId).maybeSingle(),
    admin.from("cliente_usuarios").select("perfil:perfis(nome, email)").eq("cliente_id", clienteId).order("criado_em").limit(1),
  ]);
  if (!cliente || !agencia) throw new Error("Cliente não encontrado.");
  if (!fin) throw new Error("Cadastre plano, valor e vencimento antes de gerar o contrato.");
  const contato = (usuarios?.[0]?.perfil ?? null) as unknown as { nome: string; email: string } | null;
  if (!contato) throw new Error("O cliente ainda não tem um contato com acesso.");

  // Cancela contratos em aberto: só um vale por vez.
  await admin.from("contratos").update({ status: "cancelado" }).eq("cliente_id", clienteId).in("status", ["rascunho", "enviado"]);

  const conteudo = preencherModelo(modelo.corpo, {
    cliente: { nome: cliente.nome },
    contato,
    agencia: { nome: agencia.nome },
    plano: { nome: fin.plano, valor: Number(fin.valor_mensal), vencimento: fin.dia_vencimento, forma_pagamento: fin.forma_pagamento },
    contrato: { inicio: fin.inicio_contrato },
  });

  const { data: contrato, error } = await admin
    .from("contratos")
    .insert({ cliente_id: clienteId, agencia_id: agenciaId, modelo_id: modelo.id, titulo: modelo.nome, conteudo, criado_por: criadoPor })
    .select("id")
    .single();
  if (error) throw error;

  const provedor = obterProvedor();
  const envio = await provedor.enviar({ contratoId: contrato.id, titulo: modelo.nome, conteudo, signatario: contato });
  await admin
    .from("contratos")
    .update({ status: "enviado", provedor: provedor.nome, provedor_ref: envio.ref, link_assinatura: envio.link, enviado_em: new Date().toISOString() })
    .eq("id", contrato.id);

  await admin.from("etapas_entrada").update({ status: "aguardando_aprovacao" }).eq("cliente_id", clienteId).eq("etapa", "contrato").neq("status", "concluido");

  await admin.from("auditoria").insert({
    agencia_id: agenciaId,
    cliente_id: clienteId,
    user_id: criadoPor,
    acao: "contrato.enviado",
    entidade: "contratos",
    entidade_id: contrato.id,
    detalhes: { provedor: provedor.nome },
  });
  return contrato.id;
}
