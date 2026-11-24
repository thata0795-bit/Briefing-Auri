import { Client } from "pg";

export const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export const ID = {
  agencia: {
    plataforma: "a0000000-0000-4000-8000-000000000000",
    tc: "a0000000-0000-4000-8000-000000000001",
    norte: "a0000000-0000-4000-8000-000000000002",
  },
  cliente: {
    aurora: "c0000000-0000-4000-8000-00000000000a",
    bravo: "c0000000-0000-4000-8000-00000000000b",
    cedro: "c0000000-0000-4000-8000-00000000000c",
  },
  user: {
    dono: "10000000-0000-4000-8000-000000000001",
    adminTc: "20000000-0000-4000-8000-000000000001",
    social: "20000000-0000-4000-8000-000000000002",
    designer: "20000000-0000-4000-8000-000000000003",
    aurora: "30000000-0000-4000-8000-00000000000a",
    socioAurora: "30000000-0000-4000-8000-0000000000a2",
    bravo: "30000000-0000-4000-8000-00000000000b",
    adminNorte: "40000000-0000-4000-8000-000000000001",
    cedro: "30000000-0000-4000-8000-00000000000c",
  },
} as const;

export async function conectar() {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}

/**
 * Executa `fn` numa transação como se fosse o usuário `userId` chamando pela API
 * (papel "authenticated" com o JWT simulado). A transação é sempre desfeita.
 */
export async function como<T>(
  db: Client,
  userId: string | null,
  fn: (q: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>,
): Promise<T> {
  await db.query("begin");
  try {
    const role = userId ? "authenticated" : "anon";
    const claims = userId ? { sub: userId, role } : { role };
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await db.query(`set local role ${role}`);
    return await fn(consultaIsolada(db));
  } finally {
    await db.query("rollback");
  }
}

/** Retorna o código de erro do Postgres, ou null se a consulta passou. */
export async function erroDe(p: Promise<unknown>): Promise<string | null> {
  try {
    await p;
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? "erro";
  }
}

/**
 * Cada consulta roda num ponto de restauração: um erro esperado não aborta
 * a transação do teste, e as consultas seguintes continuam valendo.
 */
export function consultaIsolada(db: Client) {
  return async (sql: string, params?: unknown[]) => {
    await db.query("savepoint consulta");
    try {
      const r = await db.query(sql, params);
      await db.query("release savepoint consulta");
      return r.rows as Record<string, unknown>[];
    } catch (e) {
      await db.query("rollback to savepoint consulta");
      throw e;
    }
  };
}
