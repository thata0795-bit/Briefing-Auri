import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";

export type Email = {
  para: string;
  assunto: string;
  conteudo: ReactElement;
  responderPara?: string;
  nomeRemetente?: string;
};

/** Um canal de envio de e-mail. Resend em produção, SMTP local em desenvolvimento. */
interface CanalEmail {
  nome: string;
  enviar(email: { para: string; assunto: string; html: string; texto: string; de: string; responderPara?: string }): Promise<void>;
}

const resend: CanalEmail = {
  nome: "resend",
  async enviar({ para, assunto, html, texto, de, responderPara }) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [para], subject: assunto, html, text: texto, reply_to: responderPara }),
    });
    if (!r.ok) throw new Error(`Resend recusou o envio (${r.status}): ${await r.text()}`);
  },
};

function smtp(url: string): CanalEmail {
  const transporte = nodemailer.createTransport(url);
  return {
    nome: "smtp",
    async enviar({ para, assunto, html, texto, de, responderPara }) {
      await transporte.sendMail({ from: de, to: para, subject: assunto, html, text: texto, replyTo: responderPara });
    },
  };
}

function escolherCanal(): CanalEmail {
  if (process.env.RESEND_API_KEY) return resend;
  if (process.env.EMAIL_SMTP_URL) return smtp(process.env.EMAIL_SMTP_URL);
  throw new Error("Nenhum canal de e-mail configurado. Defina RESEND_API_KEY ou EMAIL_SMTP_URL.");
}

export async function enviarEmail({ para, assunto, conteudo, responderPara, nomeRemetente }: Email) {
  const [html, texto] = await Promise.all([render(conteudo), render(conteudo, { plainText: true })]);
  const endereco = process.env.EMAIL_REMETENTE ?? "nao-responda@portal.local";
  // O nome que aparece é o da agência; o endereço é o remetente verificado da plataforma.
  const de = nomeRemetente ? `${nomeRemetente.replace(/["<>]/g, "")} <${endereco}>` : endereco;
  await escolherCanal().enviar({ para, assunto, html, texto, de, responderPara });
}
