import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/supabase/env";

export type Signatario = { nome: string; email: string };
export type EnvioAssinatura = { ref: string; link: string };

/**
 * Provedor de assinatura eletrônica. Autentique e ZapSign entram como
 * implementações desta interface quando a agência escolher um deles.
 */
export interface ProvedorAssinatura {
  nome: string;
  enviar(dados: { contratoId: string; titulo: string; conteudo: string; signatario: Signatario }): Promise<EnvioAssinatura>;
}

/** Simula o provedor em desenvolvimento: gera um link local e dispara o mesmo webhook. */
const simulado: ProvedorAssinatura = {
  nome: "simulado",
  async enviar() {
    const ref = `sim_${randomUUID()}`;
    return { ref, link: `${SITE_URL()}/assinatura-simulada/${ref}` };
  },
};

export function provedorSimuladoAtivo() {
  return (process.env.ASSINATURA_PROVEDOR ?? "simulado") === "simulado" && process.env.VERCEL_ENV !== "production";
}

export function obterProvedor(): ProvedorAssinatura {
  const nome = process.env.ASSINATURA_PROVEDOR ?? "simulado";
  if (nome === "simulado") {
    if (!provedorSimuladoAtivo()) throw new Error("O provedor simulado não roda em produção.");
    return simulado;
  }
  throw new Error(`Provedor de assinatura "${nome}" ainda não foi integrado. Defina a ferramenta (Autentique ou ZapSign).`);
}

function segredo() {
  const s = process.env.ASSINATURA_WEBHOOK_SECRET;
  if (!s || s.length < 16) throw new Error("ASSINATURA_WEBHOOK_SECRET ausente ou curto demais.");
  return s;
}

export function assinarCorpo(corpo: string) {
  return createHmac("sha256", segredo()).update(corpo).digest("hex");
}

/** Confere a assinatura HMAC do webhook em tempo constante. */
export function webhookValido(corpo: string, assinatura: string | null) {
  if (!assinatura || !/^[0-9a-f]{64}$/.test(assinatura)) return false;
  const esperado = Buffer.from(assinarCorpo(corpo), "hex");
  const recebido = Buffer.from(assinatura, "hex");
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}
