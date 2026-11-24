/** Aceita só caminhos internos, para o parâmetro "voltar" não virar redirecionamento aberto. */
export function caminhoSeguro(valor: string | null | undefined, padrao = "/inicio") {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return padrao;
  return valor;
}
