export const FUSO = "America/Sao_Paulo";

/** Saudação conforme a hora em São Paulo. */
export function saudacao(agora = new Date()) {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO }).format(agora));
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export function dataCurta(iso: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: FUSO }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

export function mesAtual(agora = new Date()) {
  const texto = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: FUSO }).format(agora);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? "";
}
