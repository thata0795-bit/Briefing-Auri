"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/sessao";
import { criarUsuarioConvidado, enviarConvite, ErroConvite } from "@/lib/convites";

export type EstadoEquipe = { ok: boolean; erro?: string; mensagem?: string } | null;

const Membro = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.string().trim().toLowerCase().email("Confira o e-mail."),
  papel: z.enum(["admin", "equipe"]),
  funcao: z.enum(["social_media", "designer", "captador", "gestor", "outro"]),
});

export async function convidarMembro(_: EstadoEquipe, dados: FormData): Promise<EstadoEquipe> {
  const sessao = await exigirPapel("admin");
  const p = Membro.safeParse(Object.fromEntries(dados));
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  try {
    const userId = await criarUsuarioConvidado({
      email: p.data.email,
      nome: p.data.nome,
      agenciaId: sessao.agencia.id,
      papel: p.data.papel,
      funcao: p.data.papel === "equipe" ? p.data.funcao : null,
    });
    await enviarConvite({
      userId,
      email: p.data.email,
      nome: p.data.nome,
      agenciaId: sessao.agencia.id,
      nomeAgencia: sessao.agencia.nome,
      contatoAgencia: sessao.agencia.email_contato,
      criadoPor: sessao.userId,
      equipe: true,
    });
  } catch (e) {
    if (e instanceof ErroConvite) return { ok: false, erro: e.message };
    console.error("[convidarMembro]", e);
    return { ok: false, erro: "Não foi possível enviar o convite." };
  }
  revalidatePath("/equipe");
  return { ok: true, mensagem: `Convite enviado para ${p.data.email}.` };
}
