import "server-only";
import { getStore } from "@netlify/blobs";
import { criarBancoDemo } from "./dados";
import type { Banco } from "./motor";

/**
 * Cada visitante da demonstração tem um banco próprio, guardado no Netlify Blobs
 * (consistência forte). Fora da Netlify, fica na memória do processo.
 * A escolha é feita uma vez: leitura e gravação sempre usam o mesmo lugar.
 */
// No globalThis: o Next.js pode carregar este módulo mais de uma vez no mesmo processo.
const global = globalThis as { __portalDemoMemoria?: Map<string, string> };
const memoria = (global.__portalDemoMemoria ??= new Map<string, string>());
const naNetlify = () =>
  !!process.env.NETLIFY_BLOBS_CONTEXT || !!(globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext;

async function ler(chave: string): Promise<string | null> {
  if (!naNetlify()) return memoria.get(chave) ?? null;
  const texto = await getStore({ name: "portal-demo", consistency: "strong" }).get(chave, { type: "text" });
  return (texto as string | null) ?? null;
}

async function gravar(chave: string, valor: string) {
  if (!naNetlify()) {
    memoria.set(chave, valor);
    return;
  }
  await getStore({ name: "portal-demo", consistency: "strong" }).set(chave, valor);
}

const valida = (sessao: string) => /^[a-z0-9-]{8,64}$/.test(sessao);

export async function carregarBanco(sessao: string): Promise<Banco> {
  if (!valida(sessao)) return criarBancoDemo();
  const texto = await ler(sessao);
  if (texto) return JSON.parse(texto) as Banco;
  const db = criarBancoDemo();
  await gravar(sessao, JSON.stringify(db));
  return db;
}

export async function salvarBanco(sessao: string, db: Banco) {
  if (valida(sessao)) await gravar(sessao, JSON.stringify(db));
}

export async function recomecarBanco(sessao: string) {
  if (valida(sessao)) await gravar(sessao, JSON.stringify(criarBancoDemo()));
}
