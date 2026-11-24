import { FUSO } from "@/lib/datas";

export type Evento = {
  id: string;
  titulo: string;
  descricao?: string | null;
  inicio: string;
  fim: string;
  local?: string | null;
  link?: string | null;
};

const partes = (iso: string, opcoes: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes }).format(new Date(iso));

export const diaSemana = (iso: string) => {
  const t = partes(iso, { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const hora = (iso: string) => partes(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** Chave do dia em São Paulo, para agrupar horários. */
export const chaveDia = (iso: string) => partes(iso, { year: "numeric", month: "2-digit", day: "2-digit" });

const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function escaparIcs(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Arquivo .ics (RFC 5545) para adicionar à agenda pessoal. */
export function gerarIcs(e: Evento, organizador: string) {
  const descricao = [e.descricao, e.link ? `Link: ${e.link}` : null].filter(Boolean).join("\n");
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Portal do Cliente//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@portal-do-cliente`,
    `DTSTAMP:${utc(new Date().toISOString())}`,
    `DTSTART:${utc(e.inicio)}`,
    `DTEND:${utc(e.fim)}`,
    `SUMMARY:${escaparIcs(`${e.titulo} · ${organizador}`)}`,
    descricao ? `DESCRIPTION:${escaparIcs(descricao)}` : null,
    e.local || e.link ? `LOCATION:${escaparIcs(e.local ?? e.link ?? "")}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escaparIcs(e.titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return linhas.join("\r\n") + "\r\n";
}

export function linkGoogleAgenda(e: Evento, organizador: string) {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", `${e.titulo} · ${organizador}`);
  url.searchParams.set("dates", `${utc(e.inicio)}/${utc(e.fim)}`);
  url.searchParams.set("ctz", FUSO);
  const detalhes = [e.descricao, e.link ? `Link: ${e.link}` : null].filter(Boolean).join("\n");
  if (detalhes) url.searchParams.set("details", detalhes);
  if (e.local || e.link) url.searchParams.set("location", e.local ?? e.link ?? "");
  return url.toString();
}
