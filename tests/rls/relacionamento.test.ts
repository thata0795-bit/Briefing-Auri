import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { ID, conectar, consultaIsolada, erroDe } from "./helpers";

let db: Client;
beforeAll(async () => {
  db = await conectar();
});
afterAll(async () => {
  await db.end();
});

const PREPARO = [
  `insert into public.mensagens (cliente_id, agencia_id, autor_id, texto) values ('${ID.cliente.aurora}', '${ID.agencia.tc}', '${ID.user.aurora}', 'Oi agência')`,
  `insert into public.mensagens (cliente_id, agencia_id, autor_id, texto) values ('${ID.cliente.bravo}', '${ID.agencia.tc}', '${ID.user.bravo}', 'Oi do Bravo')`,
  `insert into public.estrategias (cliente_id, agencia_id, mes, foco, publicado_em) values ('${ID.cliente.aurora}', '${ID.agencia.tc}', '2026-11', 'Publicada', now())`,
  `insert into public.estrategias (cliente_id, agencia_id, mes, versao, foco) values ('${ID.cliente.aurora}', '${ID.agencia.tc}', '2026-11', 2, 'Rascunho')`,
  `insert into public.mensalidades (cliente_id, agencia_id, competencia, valor, vencimento) values ('${ID.cliente.aurora}', '${ID.agencia.tc}', '2026-11', 1500, '2026-11-10')`,
];

async function como<T>(userId: string, fn: (q: ReturnType<typeof consultaIsolada>) => Promise<T>) {
  await db.query("begin");
  try {
    for (const sql of PREPARO) await db.query(sql);
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    await db.query("set local role authenticated");
    return await fn(consultaIsolada(db));
  } finally {
    await db.query("rollback");
  }
}

describe("chat", () => {
  it("cliente lê só a própria conversa", async () => {
    await como(ID.user.aurora, async (q) => {
      expect((await q("select texto from public.mensagens")).map((m) => m.texto)).toEqual(["Oi agência"]);
    });
  });
  it("equipe atribuída lê; equipe não atribuída não", async () => {
    await como(ID.user.social, async (q) => expect(await q("select id from public.mensagens")).toHaveLength(2));
    await como(ID.user.designer, async (q) => expect((await q("select texto from public.mensagens")).map((m) => m.texto)).toEqual(["Oi do Bravo"]));
  });
  it("ninguém escreve em nome de outra pessoa nem na conversa de outro cliente", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(
        await erroDe(q(`insert into public.mensagens (cliente_id, agencia_id, autor_id, texto) values ($1, $2, $3, 'x')`, [ID.cliente.aurora, ID.agencia.tc, ID.user.social])),
      ).toBe("42501");
      expect(
        await erroDe(q(`insert into public.mensagens (cliente_id, agencia_id, autor_id, texto) values ($1, $2, $3, 'x')`, [ID.cliente.bravo, ID.agencia.tc, ID.user.aurora])),
      ).toBe("42501");
    });
  });
  it("mensagem não pode ser editada nem apagada", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(await q(`update public.mensagens set texto = 'editado' returning id`)).toHaveLength(0);
      expect(await q(`delete from public.mensagens returning id`)).toHaveLength(0);
    });
  });
  it("cliente vê o nome de quem é admin da agência", async () => {
    await como(ID.user.aurora, async (q) => expect(await q(`select nome from public.perfis where id = '${ID.user.adminTc}'`)).toHaveLength(1));
  });
});

describe("estratégia e mensalidades", () => {
  it("cliente vê só a versão publicada", async () => {
    await como(ID.user.aurora, async (q) => expect((await q("select foco from public.estrategias")).map((e) => e.foco)).toEqual(["Publicada"]));
  });
  it("equipe atribuída vê o rascunho", async () => {
    await como(ID.user.social, async (q) => expect(await q("select id from public.estrategias")).toHaveLength(2));
  });
  it("mensalidade: cliente e admin veem, equipe não; cliente não marca como paga", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(await q("select id from public.mensalidades")).toHaveLength(1);
      expect(await q("update public.mensalidades set status = 'pago' returning id")).toHaveLength(0);
    });
    await como(ID.user.social, async (q) => expect(await q("select id from public.mensalidades")).toHaveLength(0));
    await como(ID.user.adminTc, async (q) => expect(await q("update public.mensalidades set status = 'pago' returning id")).toHaveLength(1));
  });
});
