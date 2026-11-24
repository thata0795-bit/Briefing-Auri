/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { COOKIE_USUARIO } from "./config";
import { assinarUsuario, lerUsuarioAssinado } from "./assinatura-cookie";
import { carregarBanco, salvarBanco } from "./armazenamento";
import { Consulta, executarRpc, inserirCru, type Contexto } from "./motor";

async function jarro() {
  return cookies();
}

function contexto(servico: boolean): Contexto {
  return {
    servico,
    carregar: () => carregarBanco(),
    salvar: (db) => salvarBanco(db),
    uid: async () => lerUsuarioAssinado((await jarro()).get(COOKIE_USUARIO)?.value),
  };
}

function definirCookie(nome: string, valor: string | null) {
  return jarro().then((j) => {
    try {
      if (valor === null) j.delete(nome);
      else j.set(nome, valor, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
    } catch {
      // Em componentes de servidor não dá para gravar cookie; só em ações e rotas.
    }
  });
}

/** Substituto do cliente do Supabase na demonstração. `servico` imita a chave de serviço. */
export function criarClienteDemo(servico = false): any {
  const ctx = contexto(servico);
  return {
    from: (tabela: string) => new Consulta(ctx, tabela),
    rpc: async (nome: string, args: Record<string, any>) => {
      const db = await ctx.carregar();
      const r = executarRpc(db, await ctx.uid(), servico, nome, args ?? {});
      if (!r.error) await ctx.salvar(db);
      return r;
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: {}, error: null }),
        remove: async () => ({ data: [], error: null }),
        createSignedUrls: async (caminhos: string[]) => ({
          data: caminhos.map((p) => ({ path: p, signedUrl: `/demo/arquivo?nome=${encodeURIComponent(p.split("/").pop() ?? "arquivo")}`, error: null })),
          error: null,
        }),
      }),
    },
    auth: {
      getUser: async () => {
        const uid = await ctx.uid();
        if (!uid) return { data: { user: null }, error: null };
        const db = await ctx.carregar();
        const u = db.usuarios.find((x) => x.id === uid);
        return { data: { user: u ? { id: u.id, email: u.email } : null }, error: null };
      },
      signOut: async () => {
        await definirCookie(COOKIE_USUARIO, null);
        return { error: null };
      },
      verifyOtp: async ({ token_hash }: { token_hash: string }) => {
        const uid = token_hash.startsWith("demo:") ? token_hash.slice(5) : null;
        if (!uid) return { data: null, error: { message: "Link inválido." } };
        await definirCookie(COOKIE_USUARIO, await assinarUsuario(uid));
        return { data: {}, error: null };
      },
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null }) },
      admin: {
        createUser: async ({ email, app_metadata }: { email: string; app_metadata: Record<string, any> }) => {
          const db = await ctx.carregar();
          if (db.usuarios.some((u) => u.email === email)) {
            return { data: null, error: { code: "email_exists", message: "already registered" } };
          }
          const id = randomUUID();
          db.usuarios.push({ id, email, app_metadata });
          inserirCru(db, "perfis", { id, agencia_id: app_metadata.agencia_id, papel: app_metadata.papel, funcao: app_metadata.funcao ?? null, nome: app_metadata.nome ?? "", email });
          if (app_metadata.cliente_id && app_metadata.papel === "cliente") {
            inserirCru(db, "cliente_usuarios", { cliente_id: app_metadata.cliente_id, agencia_id: app_metadata.agencia_id, user_id: id });
          }
          await ctx.salvar(db);
          return { data: { user: { id, email } }, error: null };
        },
        deleteUser: async (id: string) => {
          const db = await ctx.carregar();
          db.usuarios = db.usuarios.filter((u) => u.id !== id);
          db.tabelas.perfis = db.tabelas.perfis.filter((p) => p.id !== id);
          db.tabelas.cliente_usuarios = db.tabelas.cliente_usuarios.filter((u) => u.user_id !== id);
          await ctx.salvar(db);
          return { error: null };
        },
        generateLink: async ({ email }: { email: string }) => {
          const db = await ctx.carregar();
          const u = db.usuarios.find((x) => x.email === email);
          if (!u) return { data: null, error: { message: "Usuário não encontrado." } };
          return { data: { properties: { hashed_token: `demo:${u.id}` } }, error: null };
        },
      },
    },
  };
}
