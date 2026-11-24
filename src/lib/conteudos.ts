import type { StatusItem } from "@/lib/status";

export type Formato = "feed" | "carrossel" | "reels" | "stories";
export type TipoRoteiro = "reels" | "stories";

export const ROTULO_FORMATO: Record<Formato, string> = {
  feed: "Post de feed",
  carrossel: "Carrossel",
  reels: "Reels",
  stories: "Stories",
};

export const ROTULO_TIPO_ROTEIRO: Record<TipoRoteiro, string> = { reels: "Roteiro de reels", stories: "Roteiro de stories" };

/** Nome de cada situação de um post, do jeito que o cliente entende. */
export const ROTULO_STATUS_CONTEUDO: Partial<Record<StatusItem, string>> = {
  em_andamento: "Em produção",
  aguardando_aprovacao: "Aguardando aprovação",
  ajuste_solicitado: "Ajuste solicitado",
  aprovado: "Aprovado",
  programado: "Programado",
  concluido: "Publicado",
};

export const ROTULO_STATUS_ROTEIRO: Partial<Record<StatusItem, string>> = {
  em_andamento: "Em produção",
  aguardando_aprovacao: "Para você ler e aprovar",
  ajuste_solicitado: "Ajuste solicitado",
  aprovado: "Aprovado",
  concluido: "Gravado",
};

export type Conteudo = {
  id: string;
  cliente_id: string;
  agencia_id: string;
  data_publicacao: string;
  horario: string | null;
  formato: Formato;
  titulo: string;
  legenda: string | null;
  arte_caminho: string | null;
  status: StatusItem;
  aprovado_em: string | null;
};

export type Roteiro = {
  id: string;
  cliente_id: string;
  agencia_id: string;
  tipo: TipoRoteiro;
  titulo: string;
  data_gravacao: string;
  objetivo: string | null;
  gancho: string | null;
  falas: string | null;
  cenas: string | null;
  referencias: string | null;
  o_que_levar: string | null;
  status: StatusItem;
  publicado_em: string | null;
  lido_em: string | null;
};

export type Comentario = {
  id: string;
  tipo: "comentario" | "ajuste" | "aprovacao" | "reenvio";
  texto: string;
  criado_em: string;
  autor: { nome: string; papel: string } | null;
};

/** Data AAAA-MM-DD por extenso curto, sem fuso (a data já é do calendário). */
export function diaCurto(data: string) {
  const [a, m, d] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, d)));
}

/** Mês corrente (AAAA-MM) em São Paulo, ou o mês pedido se for válido. */
export function mesDe(param?: string | null) {
  if (param && /^\d{4}-(0[1-9]|1[0-2])$/.test(param)) return param;
  const agora = new Date(Date.now() - 3 * 3600 * 1000);
  return agora.toISOString().slice(0, 7);
}

export function deslocarMes(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function nomeDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const t = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 1)));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function limitesDoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, "0")}`, dias: ultimo, primeiroDiaSemana: new Date(Date.UTC(a, m - 1, 1)).getUTCDay() };
}
