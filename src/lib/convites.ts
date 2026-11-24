import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createElement } from "react";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/supabase/env";
import { enviarEmail } from "@/lib/email/enviar";
import { EmailConvite } from "@/emails/convite";
import type { FuncaoEquipe, Papel } from "@/lib/tipos";

export const VALIDADE_CONVITE_DIAS = 7;

export function hashDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class ErroConvite extends Error {}

/** Cria o usuário no auth com agência e papel em app_metadata (só o servidor define). */
export async function criarUsuarioConvidado(dados: {
  email: string;
  nome: string;
  agenciaId: string;
  papel: Papel;
  funcao?: FuncaoEquipe | null;
  clienteId?: string | null;
}) {
  const admin = criarClienteAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: dados.email,
    email_confirm: true,
    user_metadata: { nome: dados.nome },
    app_metadata: {
      agencia_id: dados.agenciaId,
      papel: dados.papel,
      nome: dados.nome,
      ...(dados.funcao ? { funcao: dados.funcao } : {}),
      ...(dados.clienteId ? { cliente_id: dados.clienteId } : {}),
    },
  });
  if (error) {
    if (error.code === "email_exists" || /already/i.test(error.message)) {
      throw new ErroConvite("Esse e-mail já tem acesso ao portal. Use outro e-mail ou fale com o suporte.");
    }
    throw error;
  }
  return data.user.id;
}

/** Gera um convite novo (o anterior deixa de valer) e manda o e-mail. */
export async function enviarConvite(dados: {
  userId: string;
  email: string;
  nome: string;
  agenciaId: string;
  nomeAgencia: string;
  contatoAgencia?: string | null;
  clienteId?: string | null;
  criadoPor: string;
  responsavel?: string | null;
  equipe?: boolean;
}) {
  const admin = criarClienteAdmin();
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + VALIDADE_CONVITE_DIAS * 24 * 60 * 60 * 1000);

  await admin
    .from("convites")
    .update({ expira_em: new Date().toISOString() })
    .eq("user_id", dados.userId)
    .is("usado_em", null);

  const { error } = await admin.from("convites").insert({
    agencia_id: dados.agenciaId,
    cliente_id: dados.clienteId ?? null,
    user_id: dados.userId,
    email: dados.email,
    token_hash: hashDoToken(token),
    expira_em: expira.toISOString(),
    criado_por: dados.criadoPor,
  });
  if (error) throw error;

  if (dados.clienteId) {
    await admin.from("clientes").update({ convidado_em: new Date().toISOString() }).eq("id", dados.clienteId);
  }

  await enviarEmail({
    para: dados.email,
    assunto: `Seu acesso ao portal da ${dados.nomeAgencia}`,
    nomeRemetente: dados.nomeAgencia,
    responderPara: dados.contatoAgencia ?? undefined,
    conteudo: createElement(EmailConvite, {
      marca: { nomeAgencia: dados.nomeAgencia, siteUrl: SITE_URL(), contato: dados.contatoAgencia },
      nome: dados.nome.split(" ")[0] ?? "",
      link: `${SITE_URL()}/convite/${token}`,
      responsavel: dados.responsavel,
      equipe: dados.equipe,
    }),
  });

  await admin.from("auditoria").insert({
    agencia_id: dados.agenciaId,
    cliente_id: dados.clienteId ?? null,
    user_id: dados.criadoPor,
    acao: "convite.enviado",
    entidade: "perfis",
    entidade_id: dados.userId,
  });
}

/**
 * Consome o convite (uma vez só) e devolve o token_hash de um link mágico
 * para abrir a sessão do convidado.
 */
export async function consumirConvite(token: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) throw new ErroConvite("Convite inválido.");
  const admin = criarClienteAdmin();
  const agora = new Date().toISOString();

  // Marca como usado de forma atômica: dois cliques ao mesmo tempo não passam juntos.
  const { data: convite, error } = await admin
    .from("convites")
    .update({ usado_em: agora })
    .eq("token_hash", hashDoToken(token))
    .is("usado_em", null)
    .gt("expira_em", agora)
    .select("user_id, email, cliente_id, agencia_id")
    .maybeSingle();
  if (error) throw error;
  if (!convite) throw new ErroConvite("Esse convite já foi usado ou passou da validade.");

  const { data: perfil } = await admin.from("perfis").select("papel, ativo").eq("id", convite.user_id).maybeSingle();
  if (!perfil?.ativo) throw new ErroConvite("Esse acesso não está ativo. Fale com a agência.");

  const { data: link, error: erroLink } = await admin.auth.admin.generateLink({ type: "magiclink", email: convite.email });
  if (erroLink || !link.properties?.hashed_token) throw erroLink ?? new Error("Falha ao gerar o acesso.");

  return { tokenHash: link.properties.hashed_token, papel: perfil.papel as Papel };
}

/** Busca um convite sem consumir, para mostrar a tela de boas-vindas do link. */
export async function lerConvite(token: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const admin = criarClienteAdmin();
  const { data } = await admin
    .from("convites")
    .select("usado_em, expira_em, agencia:agencias(nome)")
    .eq("token_hash", hashDoToken(token))
    .maybeSingle();
  if (!data) return null;
  const valido = !data.usado_em && new Date(data.expira_em) > new Date();
  const agencia = data.agencia as unknown as { nome: string } | null;
  return { valido, nomeAgencia: agencia?.nome ?? "" };
}
