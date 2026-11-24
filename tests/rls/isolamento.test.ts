import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { ID, como, conectar, erroDe } from "./helpers";

let db: Client;
beforeAll(async () => {
  db = await conectar();
});
afterAll(async () => {
  await db.end();
});

// Considera só os registros fixos do seed: o roteiro de navegador cria clientes extras.
const DO_SEED = new Set<unknown>([...Object.values(ID.cliente), ...Object.values(ID.user), ...Object.values(ID.agencia)]);
const ids = (rows: Record<string, unknown>[], col = "id") =>
  rows.map((r) => r[col]).filter((v) => DO_SEED.has(v)).sort();

describe("visitante sem login", () => {
  it("não lê nenhuma tabela", async () => {
    for (const t of ["agencias", "perfis", "clientes", "financeiro_clientes", "briefings", "auditoria"]) {
      const code = await como(db, null, (q) => erroDe(q(`select * from public.${t}`)));
      expect(code, t).toBe("42501");
    }
  });
});

describe("cliente", () => {
  it("vê só a própria conta de cliente", async () => {
    const rows = await como(db, ID.user.aurora, (q) => q("select id from public.clientes"));
    expect(ids(rows)).toEqual([ID.cliente.aurora]);
  });

  it("não enxerga briefing, financeiro nem usuários de outro cliente da mesma agência", async () => {
    await como(db, ID.user.aurora, async (q) => {
      expect(ids(await q("select cliente_id from public.briefings"), "cliente_id")).toEqual([ID.cliente.aurora]);
      expect(ids(await q("select cliente_id from public.financeiro_clientes"), "cliente_id")).toEqual([ID.cliente.aurora]);
      const perfis = ids(await q("select id from public.perfis"));
      expect(perfis).not.toContain(ID.user.bravo);
      expect(perfis).not.toContain(ID.user.cedro);
      expect(perfis).not.toContain(ID.user.designer); // designer não atende Aurora
      expect(perfis).toEqual([ID.user.adminTc, ID.user.social, ID.user.aurora, ID.user.socioAurora].sort());
    });
  });

  it("busca direta pelo id de outro cliente volta vazia", async () => {
    const rows = await como(db, ID.user.aurora, (q) =>
      q("select * from public.clientes where id = $1", [ID.cliente.bravo]),
    );
    expect(rows).toHaveLength(0);
  });

  it("sócio da mesma conta vê os mesmos dados", async () => {
    const rows = await como(db, ID.user.socioAurora, (q) => q("select id from public.clientes"));
    expect(ids(rows)).toEqual([ID.cliente.aurora]);
  });

  it("não escreve no briefing de outro cliente", async () => {
    const n = await como(db, ID.user.aurora, async (q) => {
      const r = await q("update public.briefings set respostas = '{}' where cliente_id = $1 returning id", [ID.cliente.bravo]);
      return r.length;
    });
    expect(n).toBe(0);
  });

  it("escreve no próprio briefing", async () => {
    const n = await como(db, ID.user.aurora, async (q) =>
      (await q("update public.briefings set respostas = '{\"x\":1}' where cliente_id = $1 returning id", [ID.cliente.aurora])).length,
    );
    expect(n).toBe(1);
  });

  it("não altera o próprio papel nem cria cliente", async () => {
    await como(db, ID.user.aurora, async (q) => {
      expect(await erroDe(q("update public.perfis set papel = 'admin' where id = $1", [ID.user.aurora]))).toBe("42501");
    });
    await como(db, ID.user.aurora, async (q) => {
      expect(
        await erroDe(q("insert into public.clientes (agencia_id, nome) values ($1, 'Invasor')", [ID.agencia.tc])),
      ).toBe("42501");
    });
  });

  it("não lê auditoria", async () => {
    const rows = await como(db, ID.user.aurora, (q) => q("select * from public.auditoria"));
    expect(rows).toHaveLength(0);
  });
});

describe("equipe", () => {
  it("vê só os clientes atribuídos", async () => {
    expect(ids(await como(db, ID.user.social, (q) => q("select id from public.clientes")))).toEqual(
      [ID.cliente.aurora, ID.cliente.bravo].sort(),
    );
    expect(ids(await como(db, ID.user.designer, (q) => q("select id from public.clientes")))).toEqual([ID.cliente.bravo]);
  });

  it("nunca vê o financeiro", async () => {
    const rows = await como(db, ID.user.social, (q) => q("select * from public.financeiro_clientes"));
    expect(rows).toHaveLength(0);
  });

  it("edita briefing só de cliente atribuído", async () => {
    await como(db, ID.user.designer, async (q) => {
      expect((await q("update public.briefings set respostas = '{}' where cliente_id = $1 returning id", [ID.cliente.aurora])).length).toBe(0);
      expect((await q("update public.briefings set respostas = '{}' where cliente_id = $1 returning id", [ID.cliente.bravo])).length).toBe(1);
    });
  });

  it("não se atribui a um cliente", async () => {
    const code = await como(db, ID.user.designer, (q) =>
      erroDe(
        q("insert into public.equipe_clientes (cliente_id, agencia_id, user_id) values ($1, $2, $3)", [
          ID.cliente.aurora,
          ID.agencia.tc,
          ID.user.designer,
        ]),
      ),
    );
    expect(code).toBe("42501");
  });
});

describe("admin", () => {
  it("vê todos os clientes e o financeiro da própria agência, e nada da outra", async () => {
    await como(db, ID.user.adminTc, async (q) => {
      expect(ids(await q("select id from public.clientes"))).toEqual([ID.cliente.aurora, ID.cliente.bravo].sort());
      expect(ids(await q("select cliente_id from public.financeiro_clientes"), "cliente_id")).toEqual(
        [ID.cliente.aurora, ID.cliente.bravo].sort(),
      );
      expect(ids(await q("select id from public.agencias"))).toEqual([ID.agencia.tc]);
      const perfis = ids(await q("select id from public.perfis"));
      expect(perfis).not.toContain(ID.user.adminNorte);
      expect(perfis).not.toContain(ID.user.cedro);
    });
  });

  it("não cria cliente em outra agência", async () => {
    const code = await como(db, ID.user.adminTc, (q) =>
      erroDe(q("insert into public.clientes (agencia_id, nome) values ($1, 'Teste')", [ID.agencia.norte])),
    );
    expect(code).toBe("42501");
  });

  it("não vincula usuário de outra agência a um cliente seu", async () => {
    const code = await como(db, ID.user.adminTc, (q) =>
      erroDe(
        q("insert into public.cliente_usuarios (cliente_id, agencia_id, user_id) values ($1, $2, $3)", [
          ID.cliente.aurora,
          ID.agencia.tc,
          ID.user.cedro,
        ]),
      ),
    );
    expect(code).not.toBeNull();
  });

  it("registra e lê auditoria só da própria agência", async () => {
    await como(db, ID.user.adminTc, async (q) => {
      await q("select public.registrar_auditoria('teste', 'clientes', null, $1, '{}')", [ID.cliente.aurora]);
      const rows = await q("select agencia_id from public.auditoria");
      expect(rows.length).toBeGreaterThan(0);
      expect(new Set(rows.map((r) => r.agencia_id))).toEqual(new Set([ID.agencia.tc]));
    });
    await como(db, ID.user.adminNorte, async (q) => {
      await q("select public.registrar_auditoria('teste')");
      const rows = await q("select agencia_id from public.auditoria");
      expect(new Set(rows.map((r) => r.agencia_id))).toEqual(new Set([ID.agencia.norte]));
    });
  });

  it("não registra auditoria sobre cliente de outra agência", async () => {
    const code = await como(db, ID.user.adminNorte, (q) =>
      erroDe(q("select public.registrar_auditoria('teste', null, null, $1)", [ID.cliente.aurora])),
    );
    expect(code).toBe("42501");
  });
});

describe("dono da plataforma", () => {
  it("vê as agências, mas nenhum cliente, briefing ou financeiro delas", async () => {
    await como(db, ID.user.dono, async (q) => {
      expect((await q("select id from public.agencias")).length).toBe(3);
      expect(await q("select id from public.clientes")).toHaveLength(0);
      expect(await q("select id from public.briefings")).toHaveLength(0);
      expect(await q("select * from public.financeiro_clientes")).toHaveLength(0);
    });
  });
});

describe("perfil inativo", () => {
  it("perde o acesso na hora", async () => {
    await db.query("begin");
    try {
      await db.query("update public.perfis set ativo = false where id = $1", [ID.user.social]);
      await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: ID.user.social, role: "authenticated" })]);
      await db.query("set local role authenticated");
      const r = await db.query("select id from public.clientes");
      expect(r.rows).toHaveLength(0);
    } finally {
      await db.query("rollback");
    }
  });
});

describe("verificação em duas etapas no banco", () => {
  async function comFator<T>(aal: "aal1" | "aal2", fn: (q: (sql: string) => Promise<Record<string, unknown>[]>) => Promise<T>) {
    await db.query("begin");
    try {
      await db.query(
        `insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret)
         values (gen_random_uuid(), $1, 'teste', 'totp', 'verified', now(), now(), 'segredo')`,
        [ID.user.adminTc],
      );
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: ID.user.adminTc, role: "authenticated", aal }),
      ]);
      await db.query("set local role authenticated");
      return await fn(async (sql) => (await db.query(sql)).rows);
    } finally {
      await db.query("rollback");
    }
  }

  it("admin com autenticador e sem código confirmado não lê nada", async () => {
    const rows = await comFator("aal1", (q) => q("select id from public.clientes"));
    expect(rows).toHaveLength(0);
  });

  it("depois do código confirmado, lê normalmente", async () => {
    const rows = await comFator("aal2", (q) => q("select id from public.clientes"));
    expect(ids(rows)).toEqual([ID.cliente.aurora, ID.cliente.bravo].sort());
  });
});
