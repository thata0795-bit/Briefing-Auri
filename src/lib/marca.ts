import type { MarcaAgencia } from "@/lib/tipos";

const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Gera as variáveis de CSS da marca da agência. Só aceita cores hexadecimais
 * em chaves conhecidas, então nada do banco vira CSS arbitrário.
 */
export function estiloDaMarca(marca: MarcaAgencia | null | undefined): Record<string, string> {
  const estilo: Record<string, string> = {};
  const cores = marca?.cores ?? {};
  for (const [chave, valor] of Object.entries(cores)) {
    if (typeof valor === "string" && HEX.test(valor) && /^[a-z-]+$/.test(chave)) {
      estilo[`--${chave}`] = valor;
    }
  }
  return estilo;
}

const CAMINHO_SEGURO = /^\/brand\/[a-z0-9._-]+\.(png|svg|webp)$/i;

export function logoDaMarca(marca: MarcaAgencia | null | undefined) {
  const logo = marca?.logo_url && CAMINHO_SEGURO.test(marca.logo_url) ? marca.logo_url : "/brand/logo-dourado.png";
  const monograma =
    marca?.monograma_url && CAMINHO_SEGURO.test(marca.monograma_url)
      ? marca.monograma_url
      : "/brand/monograma-dourado.png";
  return { logo, monograma };
}
