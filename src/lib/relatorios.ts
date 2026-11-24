import { deslocarMes } from "@/lib/conteudos";

export const METRICAS = [
  { campo: "seguidores", rotulo: "Seguidores", dica: "Total no último dia do mês." },
  { campo: "alcance", rotulo: "Alcance", dica: "Contas únicas que viram o perfil no mês." },
  { campo: "impressoes", rotulo: "Visualizações", dica: "Quantas vezes os conteúdos foram vistos." },
  { campo: "interacoes", rotulo: "Interações", dica: "Curtidas, comentários, salvamentos e compartilhamentos." },
  { campo: "visitas_perfil", rotulo: "Visitas ao perfil", dica: "" },
  { campo: "cliques_link", rotulo: "Cliques no link", dica: "Link da bio, WhatsApp e site." },
  { campo: "publicacoes", rotulo: "Publicações", dica: "Posts, carrosséis e reels publicados no mês." },
] as const;

export type CampoMetrica = (typeof METRICAS)[number]["campo"];

export const TEXTOS = [
  { campo: "destaques", rotulo: "Destaques do mês", dica: "O que mais funcionou. Um por linha." },
  { campo: "analise", rotulo: "Análise", dica: "O que os números mostram, em poucas linhas." },
  { campo: "proximos_passos", rotulo: "Próximos passos", dica: "O que muda no mês seguinte. Um por linha." },
] as const;

export type CampoTexto = (typeof TEXTOS)[number]["campo"];

export type Relatorio = { id: string; mes: string; publicado_em: string | null } & Record<CampoMetrica, number | null> &
  Record<CampoTexto, string | null>;

export const COLUNAS_RELATORIO = `id, mes, publicado_em, ${METRICAS.map((m) => m.campo).join(", ")}, ${TEXTOS.map((t) => t.campo).join(", ")}`;

const fmt = new Intl.NumberFormat("pt-BR");
const fmtCurto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function numero(n: number | null | undefined) {
  return n == null ? "Sem dado" : fmt.format(n);
}
export function numeroCurto(n: number) {
  return fmtCurto.format(n);
}

/** Taxa de engajamento: interações sobre alcance. */
export function engajamento(r: Pick<Relatorio, "interacoes" | "alcance">) {
  if (r.interacoes == null || !r.alcance) return null;
  return (r.interacoes / r.alcance) * 100;
}
export function porcentagem(n: number | null) {
  return n == null ? "Sem dado" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Variação percentual de a para b (null quando não dá para comparar). */
export function variacao(atual: number | null | undefined, anterior: number | null | undefined) {
  if (atual == null || anterior == null || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}

/** Todos os meses de "inicio" até "fim", inclusive. */
export function mesesEntre(inicio: string, fim: string) {
  const lista: string[] = [];
  for (let m = inicio; m <= fim && lista.length < 120; m = deslocarMes(m, 1)) lista.push(m);
  return lista;
}

export function mesCurto(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const t = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, 1))).replace(".", "");
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}/${String(a).slice(2)}`;
}
