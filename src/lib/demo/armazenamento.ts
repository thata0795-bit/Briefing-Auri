import "server-only";
import { criarBancoDemo } from "./dados";
import type { Banco } from "./motor";

/**
 * Banco da demonstração, compartilhado por todos os acessos, na memória do servidor.
 * Não depende de serviço externo: quando o servidor da Netlify fica parado e
 * reinicia, a demonstração volta aos dados iniciais (que são sempre os mesmos).
 * Cada gravação confere a versão lida, para duas pessoas não apagarem o
 * trabalho uma da outra.
 */
type Estado = { texto: string; versao: number };
const global = globalThis as { __portalDemo?: Estado };
const versoes = new WeakMap<Banco, number>();

function estado(): Estado {
  return (global.__portalDemo ??= { texto: JSON.stringify(criarBancoDemo()), versao: 1 });
}

export class ConflitoDemo extends Error {
  constructor() {
    super("Outra pessoa salvou ao mesmo tempo. Tente de novo.");
  }
}

export async function carregarBanco(): Promise<Banco> {
  const e = estado();
  const db = JSON.parse(e.texto) as Banco;
  versoes.set(db, e.versao);
  return db;
}

export async function salvarBanco(db: Banco) {
  const e = estado();
  const lida = versoes.get(db);
  if (lida !== undefined && lida !== e.versao) throw new ConflitoDemo();
  global.__portalDemo = { texto: JSON.stringify(db), versao: e.versao + 1 };
  versoes.set(db, e.versao + 1);
}

export async function recomecarBanco() {
  global.__portalDemo = { texto: JSON.stringify(criarBancoDemo()), versao: estado().versao + 1 };
}
