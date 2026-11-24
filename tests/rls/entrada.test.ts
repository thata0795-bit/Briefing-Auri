import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Client } from "pg";
import { ID, como, conectar, consultaIsolada, erroDe } from "./helpers";

let db: Client;
beforeAll(async () => {
  db = await conectar();
});
afterAll(async () => {
  await db.end();
});

/** Roda como superusuário dentro da mesma transação, antes de trocar de papel. */
async function comoApos<T>(
  preparar: string[],
  userId: string,
  fn: (q: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>,
) {
  await db.query("begin");
  try {
    for (const sql of preparar) await db.query(sql);
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: userId, role: "authenticated" })]);
    await db.query("set local role authenticated");
    return await fn(consultaIsolada(db));
  } finally {
    await db.query("rollback");
  }
}

const liberarAteReuniao = `update public.etapas_entrada set status = 'concluido'
  where cliente_id = '${ID.cliente.bravo}' and etapa <> 'reuniao'`;
const liberarAcessos = `update public.etapas_entrada set status = 'concluido'
  where cliente_id = '${ID.cliente.bravo}' and etapa in ('boas_vindas', 'contrato', 'manual', 'briefing')`;

describe("etapas da entrada", () => {
  it("cliente novo nasce com as 6 etapas, briefing e checklist de acessos", async () => {
    const r = await db.query("select count(*)::int n from public.etapas_entrada where cliente_id = $1", [ID.cliente.bravo]);
    expect(r.rows[0].n).toBe(6);
    const a = await db.query("select count(*)::int n from public.acessos_cliente where cliente_id = $1", [ID.cliente.bravo]);
    expect(a.rows[0].n).toBe(4);
  });

  it("cliente não chama a função interna que conclui etapas", async () => {
    const code = await como(db, ID.user.bravo, (q) =>
      erroDe(q("select privado.concluir_etapa($1, 'contrato', $2)", [ID.cliente.bravo, ID.user.bravo])),
    );
    expect(code).toBe("42501");
  });

  it("cliente não altera etapas direto na tabela", async () => {
    const n = await como(db, ID.user.bravo, async (q) =>
      (await q("update public.etapas_entrada set status = 'concluido' where cliente_id = $1 returning etapa", [ID.cliente.bravo])).length,
    );
    expect(n).toBe(0);
  });

  it("boas-vindas registra o aceite dos termos e avança", async () => {
    await como(db, ID.user.bravo, async (q) => {
      await q("select public.concluir_boas_vindas($1, 'v1')", [ID.cliente.bravo]);
      const [e] = await q("select status from public.etapas_entrada where cliente_id = $1 and etapa = 'boas_vindas'", [ID.cliente.bravo]);
      expect(e.status).toBe("concluido");
      const [p] = await q("select termos_versao from public.perfis where id = $1", [ID.user.bravo]);
      expect(p.termos_versao).toBe("v1");
      const [prox] = await q("select status from public.etapas_entrada where cliente_id = $1 and etapa = 'contrato'", [ID.cliente.bravo]);
      expect(prox.status).toBe("em_andamento");
    });
  });

  it("outro cliente não conclui as boas-vindas de Bravo", async () => {
    const code = await como(db, ID.user.aurora, (q) => erroDe(q("select public.concluir_boas_vindas($1, 'v1')", [ID.cliente.bravo])));
    expect(code).toBe("42501");
  });
});

describe("contrato", () => {
  const novoContrato = `insert into public.contratos (id, cliente_id, agencia_id, titulo, conteudo, status)
    values ('d0000000-0000-4000-8000-000000000001', '${ID.cliente.bravo}', '${ID.agencia.tc}', 'Contrato', 'Texto', 'enviado')`;

  it("equipe não vê contratos (têm valor)", async () => {
    const rows = await comoApos([novoContrato], ID.user.social, (q) => q("select id from public.contratos"));
    expect(rows).toHaveLength(0);
  });

  it("cliente vê o próprio contrato, mas não confirma a assinatura sozinho", async () => {
    await comoApos([novoContrato], ID.user.bravo, async (q) => {
      expect(await q("select id from public.contratos")).toHaveLength(1);
      const code = await erroDe(q("select public.confirmar_assinatura_contrato('d0000000-0000-4000-8000-000000000001', 'x', 'teste')"));
      expect(code).toBe("42501");
    });
  });

  it("cliente de outra conta não vê o contrato", async () => {
    const rows = await comoApos([novoContrato], ID.user.aurora, (q) => q("select id from public.contratos"));
    expect(rows).toHaveLength(0);
  });

  it("admin confirma assinatura feita fora do sistema e a etapa conclui", async () => {
    await comoApos([novoContrato], ID.user.adminTc, async (q) => {
      await q("select public.confirmar_assinatura_contrato('d0000000-0000-4000-8000-000000000001', 'Cliente Bravo', 'manual')");
      const [e] = await q("select status from public.etapas_entrada where cliente_id = $1 and etapa = 'contrato'", [ID.cliente.bravo]);
      expect(e.status).toBe("concluido");
    });
  });
});

describe("briefing", () => {
  it("cliente salva resposta no próprio briefing", async () => {
    await como(db, ID.user.bravo, async (q) => {
      await q(`select public.salvar_resposta_briefing($1, 'negocio.nome', '"Estúdio Bravo"')`, [ID.cliente.bravo]);
      const [b] = await q("select respostas from public.briefings where cliente_id = $1", [ID.cliente.bravo]);
      expect((b.respostas as Record<string, unknown>)["negocio.nome"]).toBe("Estúdio Bravo");
    });
  });

  it("cliente não salva no briefing de outro", async () => {
    const code = await como(db, ID.user.aurora, (q) =>
      erroDe(q(`select public.salvar_resposta_briefing($1, 'negocio.nome', '"x"')`, [ID.cliente.bravo])),
    );
    expect(code).toBe("42501");
  });

  it("chave fora do padrão é recusada", async () => {
    const code = await como(db, ID.user.bravo, (q) =>
      erroDe(q(`select public.salvar_resposta_briefing($1, 'x;drop', '"x"')`, [ID.cliente.bravo])),
    );
    expect(code).toBe("22023");
  });

  it("pular e voltar a responder", async () => {
    await como(db, ID.user.bravo, async (q) => {
      await q("select public.pular_pergunta_briefing($1, 'publico.faixa', true)", [ID.cliente.bravo]);
      let [b] = await q("select puladas from public.briefings where cliente_id = $1", [ID.cliente.bravo]);
      expect(b.puladas).toEqual(["publico.faixa"]);
      await q(`select public.salvar_resposta_briefing($1, 'publico.faixa', '["25-34"]')`, [ID.cliente.bravo]);
      [b] = await q("select puladas from public.briefings where cliente_id = $1", [ID.cliente.bravo]);
      expect(b.puladas).toEqual([]);
    });
  });
});

describe("acessos", () => {
  it("cliente marca liberado, mas não confirmado", async () => {
    await como(db, ID.user.bravo, async (q) => {
      await q("select public.marcar_acesso($1, 'instagram', 'liberado')", [ID.cliente.bravo]);
      expect(await erroDe(q("select public.marcar_acesso($1, 'instagram', 'confirmado')", [ID.cliente.bravo]))).toBe("42501");
    });
  });

  it("equipe atribuída confirma", async () => {
    await como(db, ID.user.designer, async (q) => {
      await q("select public.marcar_acesso($1, 'instagram', 'confirmado')", [ID.cliente.bravo]);
    });
  });

  it("checklist só conclui com todos os itens respondidos e etapas anteriores feitas", async () => {
    await comoApos([liberarAcessos], ID.user.bravo, async (q) => {
      expect(await erroDe(q("select public.concluir_acessos($1)", [ID.cliente.bravo]))).toBe("55000");
      for (const t of ["instagram", "meta_business", "google_meu_negocio"]) {
        await q("select public.marcar_acesso($1, $2, 'liberado')", [ID.cliente.bravo, t]);
      }
      await q("select public.marcar_acesso($1, 'dominio', 'nao_tenho')", [ID.cliente.bravo]);
      await q("select public.concluir_acessos($1)", [ID.cliente.bravo]);
    });
  });
});

describe("primeira reunião", () => {
  it("cliente vê só horários livres da própria agência", async () => {
    const tc = await como(db, ID.user.bravo, (q) => q("select agencia_id from public.horarios_livres"));
    expect(tc.length).toBeGreaterThan(0);
    expect(new Set(tc.map((r) => r.agencia_id))).toEqual(new Set([ID.agencia.tc]));
    const norte = await como(db, ID.user.cedro, (q) => q("select id from public.horarios_livres"));
    expect(norte).toHaveLength(0);
  });

  it("não reserva antes de concluir as etapas anteriores", async () => {
    const code = await como(db, ID.user.bravo, async (q) => {
      const [h] = await q("select id from public.horarios_livres limit 1");
      return erroDe(q("select public.reservar_primeira_reuniao($1, $2)", [ID.cliente.bravo, h.id]));
    });
    expect(code).toBe("55000");
  });

  it("reserva cria o compromisso, conclui a entrada e o horário some da lista", async () => {
    await comoApos([liberarAteReuniao], ID.user.bravo, async (q) => {
      const antes = await q("select id from public.horarios_livres order by inicio");
      await q("select public.reservar_primeira_reuniao($1, $2)", [ID.cliente.bravo, antes[0].id]);
      const depois = await q("select id from public.horarios_livres");
      expect(depois.length).toBe(antes.length - 1);
      const comp = await q("select tipo, titulo from public.compromissos where cliente_id = $1", [ID.cliente.bravo]);
      expect(comp).toEqual([{ tipo: "reuniao", titulo: "Primeira reunião" }]);
      const [c] = await q("select status from public.clientes where id = $1", [ID.cliente.bravo]);
      expect(c.status).toBe("ativo");
      // Nem o mesmo horário nem outro: a primeira reunião já está marcada
      expect(await erroDe(q("select public.reservar_primeira_reuniao($1, $2)", [ID.cliente.bravo, antes[0].id]))).toBe("55000");
      expect(await erroDe(q("select public.reservar_primeira_reuniao($1, $2)", [ID.cliente.bravo, antes[1].id]))).toBe("55000");
    });
  });

  it("cliente não cria horário livre", async () => {
    const code = await como(db, ID.user.bravo, (q) =>
      erroDe(
        q("insert into public.horarios_livres (agencia_id, responsavel_id, inicio, fim) values ($1, $2, now() + interval '3 days', now() + interval '3 days 1 hour')", [
          ID.agencia.tc,
          ID.user.social,
        ]),
      ),
    );
    expect(code).toBe("42501");
  });
});

describe("convites e arquivos", () => {
  it("cliente e equipe não leem convites", async () => {
    await comoApos(
      [
        `insert into public.convites (agencia_id, cliente_id, user_id, email, token_hash, expira_em)
         values ('${ID.agencia.tc}', '${ID.cliente.bravo}', '${ID.user.bravo}', 'x@exemplo.teste', 'hash', now() + interval '7 days')`,
      ],
      ID.user.social,
      async (q) => expect(await q("select * from public.convites")).toHaveLength(0),
    );
  });

  it("cliente não envia arquivo para a pasta de outro cliente", async () => {
    const code = await como(db, ID.user.aurora, (q) =>
      erroDe(
        q("insert into storage.objects (bucket_id, name, owner_id) values ('arquivos', $1, $2)", [
          `${ID.agencia.tc}/${ID.cliente.bravo}/briefing/x.png`,
          ID.user.aurora,
        ]),
      ),
    );
    expect(code).toBe("42501");
  });

  it("cliente envia arquivo para a própria pasta", async () => {
    const code = await como(db, ID.user.aurora, (q) =>
      erroDe(
        q("insert into storage.objects (bucket_id, name, owner_id) values ('arquivos', $1, $2)", [
          `${ID.agencia.tc}/${ID.cliente.aurora}/briefing/x.png`,
          ID.user.aurora,
        ]),
      ),
    );
    expect(code).toBeNull();
  });

  it("caminho com agência trocada não passa", async () => {
    const code = await como(db, ID.user.aurora, (q) =>
      erroDe(
        q("insert into storage.objects (bucket_id, name, owner_id) values ('arquivos', $1, $2)", [
          `${ID.agencia.norte}/${ID.cliente.aurora}/briefing/x.png`,
          ID.user.aurora,
        ]),
      ),
    );
    expect(code).toBe("42501");
  });
});

describe("criação do perfil pelo Auth", () => {
  it("perfil nasce quando o app_metadata chega num segundo passo, e não muda depois", async () => {
    await db.query("begin");
    try {
      const id = "50000000-0000-4000-8000-000000000001";
      await db.query(
        `insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, created_at, updated_at)
         values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', 'novo@exemplo.teste',
                 '{"provider":"email"}', now(), now())`,
        [id],
      );
      let r = await db.query("select count(*)::int n from public.perfis where id = $1", [id]);
      expect(r.rows[0].n).toBe(0);
      await db.query(
        `update auth.users set raw_app_meta_data = raw_app_meta_data || $2::jsonb where id = $1`,
        [id, JSON.stringify({ agencia_id: ID.agencia.tc, papel: "cliente", cliente_id: ID.cliente.bravo, nome: "Novo" })],
      );
      r = await db.query("select papel, agencia_id from public.perfis where id = $1", [id]);
      expect(r.rows[0]).toEqual({ papel: "cliente", agencia_id: ID.agencia.tc });
      await db.query(
        `update auth.users set raw_app_meta_data = raw_app_meta_data || $2::jsonb where id = $1`,
        [id, JSON.stringify({ agencia_id: ID.agencia.norte, papel: "admin" })],
      );
      r = await db.query("select papel, agencia_id from public.perfis where id = $1", [id]);
      expect(r.rows[0]).toEqual({ papel: "cliente", agencia_id: ID.agencia.tc });
    } finally {
      await db.query("rollback");
    }
  });
});
