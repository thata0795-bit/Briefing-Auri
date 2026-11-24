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

const POST = "e1000000-0000-4000-8000-000000000001";
const ROT_PUB = "e2000000-0000-4000-8000-000000000001";
const ROT_RASC = "e2000000-0000-4000-8000-000000000002";
const PREPARO = [
  `insert into public.conteudos (id, cliente_id, agencia_id, data_publicacao, formato, titulo, status)
   values ('${POST}', '${ID.cliente.aurora}', '${ID.agencia.tc}', current_date + 3, 'feed', 'Post teste', 'aguardando_aprovacao')`,
  `insert into public.roteiros (id, cliente_id, agencia_id, tipo, titulo, data_gravacao, status, publicado_em)
   values ('${ROT_PUB}', '${ID.cliente.aurora}', '${ID.agencia.tc}', 'reels', 'Roteiro publicado', current_date + 5, 'aguardando_aprovacao', now())`,
  `insert into public.roteiros (id, cliente_id, agencia_id, tipo, titulo, data_gravacao)
   values ('${ROT_RASC}', '${ID.cliente.aurora}', '${ID.agencia.tc}', 'stories', 'Roteiro rascunho', current_date + 6)`,
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

describe("conteúdos e roteiros", () => {
  it("cliente vê os próprios posts e só roteiros publicados", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(await q("select id from public.conteudos")).toHaveLength(1);
      const r = await q("select id from public.roteiros");
      expect(r.map((x) => x.id)).toEqual([ROT_PUB]);
    });
  });

  it("outro cliente e equipe não atribuída não veem nada", async () => {
    await como(ID.user.bravo, async (q) => {
      expect(await q("select id from public.conteudos")).toHaveLength(0);
      expect(await q("select id from public.roteiros")).toHaveLength(0);
    });
    await como(ID.user.designer, async (q) => {
      expect(await q("select id from public.conteudos")).toHaveLength(0);
    });
  });

  it("equipe atribuída vê roteiro em rascunho e edita o post", async () => {
    await como(ID.user.social, async (q) => {
      expect(await q("select id from public.roteiros")).toHaveLength(2);
      expect(await q(`update public.conteudos set titulo = 'Novo' where id = '${POST}' returning id`)).toHaveLength(1);
    });
  });

  it("cliente não muda o post direto na tabela", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(await q(`update public.conteudos set status = 'aprovado' where id = '${POST}' returning id`)).toHaveLength(0);
    });
  });

  it("cliente aprova e o histórico registra", async () => {
    await como(ID.user.aurora, async (q) => {
      await q(`select public.responder_item('conteudo', '${POST}', 'aprovar', null)`);
      const [c] = await q(`select status, aprovado_por from public.conteudos where id = '${POST}'`);
      expect(c).toEqual({ status: "aprovado", aprovado_por: ID.user.aurora });
      const h = await q(`select tipo from public.comentarios where item_id = '${POST}'`);
      expect(h.map((x) => x.tipo)).toEqual(["aprovacao"]);
      // Já aprovado: não aceita nova resposta
      expect(await erroDe(q(`select public.responder_item('conteudo', '${POST}', 'ajuste', 'mudar tudo')`))).toBe("55000");
    });
  });

  it("pedido de ajuste exige texto e muda a situação", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(await erroDe(q(`select public.responder_item('roteiro', '${ROT_PUB}', 'ajuste', '')`))).toBe("22023");
      await q(`select public.responder_item('roteiro', '${ROT_PUB}', 'ajuste', 'Trocar o gancho')`);
      const [r] = await q(`select status, lido_em is not null as lido from public.roteiros where id = '${ROT_PUB}'`);
      expect(r).toEqual({ status: "ajuste_solicitado", lido: true });
    });
  });

  it("outro cliente não responde item que não é dele", async () => {
    await como(ID.user.bravo, async (q) => {
      expect(await erroDe(q(`select public.responder_item('conteudo', '${POST}', 'aprovar', null)`))).toBe("P0002");
    });
  });

  it("cliente não responde roteiro ainda não publicado", async () => {
    await como(ID.user.aurora, async (q) => {
      expect(await erroDe(q(`select public.responder_item('roteiro', '${ROT_RASC}', 'aprovar', null)`))).toBe("P0002");
    });
  });

  it("comentário só em nome próprio e do tipo comentário", async () => {
    await como(ID.user.aurora, async (q) => {
      await q(
        `insert into public.comentarios (cliente_id, agencia_id, item_tipo, item_id, autor_id, texto) values ($1, $2, 'conteudo', $3, $4, 'Oi')`,
        [ID.cliente.aurora, ID.agencia.tc, POST, ID.user.aurora],
      );
      expect(
        await erroDe(
          q(`insert into public.comentarios (cliente_id, agencia_id, item_tipo, item_id, autor_id, tipo, texto) values ($1, $2, 'conteudo', $3, $4, 'aprovacao', 'Aprovado')`, [
            ID.cliente.aurora,
            ID.agencia.tc,
            POST,
            ID.user.aurora,
          ]),
        ),
      ).toBe("42501");
      expect(
        await erroDe(
          q(`insert into public.comentarios (cliente_id, agencia_id, item_tipo, item_id, autor_id, texto) values ($1, $2, 'conteudo', $3, $4, 'Falso')`, [
            ID.cliente.aurora,
            ID.agencia.tc,
            POST,
            ID.user.social,
          ]),
        ),
      ).toBe("42501");
    });
  });
});
