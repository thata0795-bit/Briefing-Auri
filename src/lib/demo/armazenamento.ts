import "server-only";
import { getStore } from "@netlify/blobs";
import { criarBancoDemo } from "./dados";
import type { Banco } from "./motor";

/**
 * Banco da demonstração, compartilhado por todos os acessos (como no app real).
 * Na Netlify fica no Netlify Blobs; fora dela, na memória do processo.
 * Cada gravação confere a versão lida, para duas pessoas não apagarem o
 * trabalho uma da outra.
 */
const CHAVE = "banco-compartilhado-v1";
const LIMITE_MS = 5000;

type Global = { __portalDemoMemoria?: { texto: string; versao: number } | null };
const global = globalThis as Global;
const versoes = new WeakMap<Banco, string>();

const naNetlify = () =>
  !!process.env.NETLIFY_BLOBS_CONTEXT || !!(globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext;

function comLimite<T>(p: Promise<T>, oQue: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`[demo] ${oQue} passou de ${LIMITE_MS} ms`)), LIMITE_MS)),
  ]);
}

// Consistência forte por padrão; se ela não responder, o modo padrão da Netlify assume.
let modoForte = true;
const loja = () => getStore(modoForte ? { name: "portal-demo", consistency: "strong" } : { name: "portal-demo" });

async function tentar<T>(op: () => Promise<T>, oQue: string): Promise<T> {
  try {
    return await comLimite(op(), oQue);
  } catch (e) {
    if (!modoForte || e instanceof ConflitoDemo) throw e;
    console.error(`[demo] ${oQue} com consistência forte falhou, usando o modo padrão:`, e);
    modoForte = false;
    return comLimite(op(), oQue);
  }
}

async function ler(): Promise<{ texto: string; versao: string } | null> {
  if (!naNetlify()) {
    const m = global.__portalDemoMemoria;
    return m ? { texto: m.texto, versao: String(m.versao) } : null;
  }
  try {
    const r = await tentar(() => loja().getWithMetadata(CHAVE, { type: "text" }), "leitura");
    return r ? { texto: r.data as string, versao: r.etag ?? "" } : null;
  } catch (e) {
    console.error("[demo] falha ao ler o banco:", e);
    throw e;
  }
}

async function gravar(texto: string, versaoLida: string | null) {
  if (!naNetlify()) {
    const atual = global.__portalDemoMemoria;
    if (versaoLida !== null && atual && String(atual.versao) !== versaoLida) throw new ConflitoDemo();
    global.__portalDemoMemoria = { texto, versao: (atual?.versao ?? 0) + 1 };
    return;
  }
  try {
    const opcoes = versaoLida ? { onlyIfMatch: versaoLida } : { onlyIfNew: true as const };
    const r = await tentar(() => loja().set(CHAVE, texto, opcoes), "gravação");
    if (r && r.modified === false) throw new ConflitoDemo();
  } catch (e) {
    if (!(e instanceof ConflitoDemo)) console.error("[demo] falha ao gravar o banco:", e);
    throw e;
  }
}

export class ConflitoDemo extends Error {
  constructor() {
    super("Outra pessoa salvou ao mesmo tempo. Tente de novo.");
  }
}

export async function carregarBanco(): Promise<Banco> {
  const lido = await ler();
  if (lido) {
    const db = JSON.parse(lido.texto) as Banco;
    versoes.set(db, lido.versao);
    return db;
  }
  const db = criarBancoDemo();
  try {
    await gravar(JSON.stringify(db), null);
  } catch (e) {
    // Outra requisição criou o banco primeiro: usa o dela.
    if (e instanceof ConflitoDemo) return carregarBanco();
    throw e;
  }
  return carregarBanco();
}

export async function salvarBanco(db: Banco) {
  const versao = versoes.get(db) ?? null;
  await gravar(JSON.stringify(db), versao);
  // Depois de gravar, a versão muda: quem continuar usando este objeto precisa reler.
  versoes.delete(db);
}

export async function recomecarBanco() {
  const lido = await ler();
  await gravar(JSON.stringify(criarBancoDemo()), lido?.versao ?? null);
}
