import { FUSO } from "@/lib/datas";

export type DadosContrato = {
  cliente: { nome: string };
  contato: { nome: string; email: string };
  agencia: { nome: string };
  plano: { nome: string; valor: number; vencimento: number; forma_pagamento: string };
  contrato: { inicio?: string | null };
};

const FORMAS: Record<string, string> = { boleto: "boleto", pix: "Pix", cartao: "cartão de crédito" };

export const CAMPOS_MODELO = [
  "cliente.nome",
  "contato.nome",
  "contato.email",
  "agencia.nome",
  "plano.nome",
  "plano.valor",
  "plano.vencimento",
  "plano.forma_pagamento",
  "contrato.inicio",
  "hoje",
] as const;

export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function dataPorExtenso(iso?: string | null) {
  const d = iso ? new Date(`${iso}T12:00:00-03:00`) : new Date();
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: FUSO }).format(d);
}

/** Troca {{campo}} pelos dados do cliente. Campos desconhecidos ficam visíveis para a agência corrigir. */
export function preencherModelo(corpo: string, d: DadosContrato) {
  const valores: Record<string, string> = {
    "cliente.nome": d.cliente.nome,
    "contato.nome": d.contato.nome,
    "contato.email": d.contato.email,
    "agencia.nome": d.agencia.nome,
    "plano.nome": d.plano.nome,
    "plano.valor": formatarMoeda(d.plano.valor),
    "plano.vencimento": String(d.plano.vencimento),
    "plano.forma_pagamento": FORMAS[d.plano.forma_pagamento] ?? d.plano.forma_pagamento,
    "contrato.inicio": d.contrato.inicio ? dataPorExtenso(d.contrato.inicio) : "data a combinar",
    hoje: dataPorExtenso(),
  };
  return corpo.replace(/\{\{\s*([a-z_.]+)\s*\}\}/g, (inteiro, chave: string) => valores[chave] ?? inteiro);
}
