/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Motor da demonstração: imita o pedaço do Supabase que o portal usa
 * (consultas, funções do banco, login e arquivos) sobre um banco em memória.
 *
 * As regras de quem vê o quê espelham as do banco real (migrações em
 * supabase/migrations). Cada visitante tem uma cópia própria dos dados.
 */
import { randomUUID } from "node:crypto";

// Gerador de ids. Na criação dos dados iniciais ele fica previsível, para que
// qualquer servidor monte exatamente o mesmo banco de partida.
let gerarId: () => string = () => randomUUID();
export function comIdsPrevisiveis<T>(fn: () => T): T {
  let n = 0;
  const anterior = gerarId;
  gerarId = () => `e0000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  try {
    return fn();
  } finally {
    gerarId = anterior;
  }
}

export type Linha = Record<string, any>;
export type Banco = { tabelas: Record<string, Linha[]>; usuarios: { id: string; email: string; app_metadata: Linha }[] };
type Resultado = { data: any; error: any; count?: number | null };

const ERRO_PERMISSAO = { code: "42501", message: "Sem permissão." };
const agora = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Regras de acesso (espelho das funções do schema "privado")
// ---------------------------------------------------------------------------
export class Regras {
  constructor(private db: Banco, private uid: string | null) {}

  get eu(): Linha | undefined {
    return this.db.tabelas.perfis.find((p) => p.id === this.uid && p.ativo);
  }
  private t(nome: string) {
    return this.db.tabelas[nome] ?? [];
  }
  eAdminDa(agencia: string) {
    const e = this.eu;
    return !!e && e.papel === "admin" && e.agencia_id === agencia;
  }
  eDaAgencia(agencia: string) {
    const e = this.eu;
    return !!e && e.agencia_id === agencia && (e.papel === "admin" || e.papel === "equipe");
  }
  eUsuarioDoCliente(cliente: string) {
    return !!this.eu && this.t("cliente_usuarios").some((u) => u.cliente_id === cliente && u.user_id === this.uid);
  }
  podeVerCliente(cliente: string) {
    const e = this.eu;
    const c = this.t("clientes").find((x) => x.id === cliente);
    if (!e || !c || c.agencia_id !== e.agencia_id) return false;
    if (e.papel === "admin") return true;
    if (e.papel === "equipe") return this.t("equipe_clientes").some((x) => x.cliente_id === cliente && x.user_id === e.id);
    return this.eUsuarioDoCliente(cliente);
  }
  podeEditarCliente(cliente: string) {
    const e = this.eu;
    const c = this.t("clientes").find((x) => x.id === cliente);
    if (!e || !c || c.agencia_id !== e.agencia_id) return false;
    if (e.papel === "admin") return true;
    return e.papel === "equipe" && this.t("equipe_clientes").some((x) => x.cliente_id === cliente && x.user_id === e.id);
  }
  podeVerFinanceiro(cliente: string) {
    const c = this.t("clientes").find((x) => x.id === cliente);
    return (!!c && this.eAdminDa(c.agencia_id)) || this.eUsuarioDoCliente(cliente);
  }
  podeVerPerfil(alvo: string) {
    const e = this.eu;
    const ele = this.t("perfis").find((p) => p.id === alvo);
    if (!e || !ele || e.agencia_id !== ele.agencia_id) return false;
    if (e.id === ele.id || e.papel === "admin") return true;
    if (e.papel === "equipe") {
      if (ele.papel !== "cliente") return true;
      const meus = this.t("equipe_clientes").filter((x) => x.user_id === e.id).map((x) => x.cliente_id);
      return this.t("cliente_usuarios").some((u) => u.user_id === ele.id && meus.includes(u.cliente_id));
    }
    const minhas = this.t("cliente_usuarios").filter((u) => u.user_id === e.id).map((u) => u.cliente_id);
    return minhas.some(
      (c) =>
        this.t("cliente_usuarios").some((u) => u.cliente_id === c && u.user_id === ele.id) ||
        this.t("equipe_clientes").some((x) => x.cliente_id === c && x.user_id === ele.id) ||
        this.t("clientes").some((x) => x.id === c && x.responsavel_id === ele.id),
    );
  }

  /** Pode ler esta linha desta tabela? */
  ler(tabela: string, r: Linha): boolean {
    const e = this.eu;
    if (!e) return false;
    switch (tabela) {
      case "agencias":
        return r.id === e.agencia_id;
      case "plataforma_admins":
        return r.user_id === e.id;
      case "perfis":
        return this.podeVerPerfil(r.id);
      case "clientes":
        return this.podeVerCliente(r.id);
      case "financeiro_clientes":
      case "contratos":
        return this.podeVerFinanceiro(r.cliente_id);
      case "modelos_contrato":
      case "convites":
      case "auditoria":
        return this.eAdminDa(r.agencia_id);
      case "horarios_livres":
        return this.eDaAgencia(r.agencia_id) || (r.agencia_id === e.agencia_id && !r.cliente_id && r.inicio > agora());
      case "roteiros":
        return this.podeEditarCliente(r.cliente_id) || (this.eUsuarioDoCliente(r.cliente_id) && !!r.publicado_em);
      default:
        return r.cliente_id ? this.podeVerCliente(r.cliente_id) : false;
    }
  }

  /** Pode gravar (inserir, mudar ou apagar) esta linha? */
  gravar(tabela: string, r: Linha): boolean {
    const e = this.eu;
    if (!e) return false;
    switch (tabela) {
      case "perfis":
        return r.id === e.id || this.eAdminDa(r.agencia_id);
      case "clientes":
      case "cliente_usuarios":
      case "equipe_clientes":
      case "financeiro_clientes":
      case "contratos":
      case "modelos_contrato":
      case "etapas_entrada":
      case "agencias":
        return this.eAdminDa(r.agencia_id ?? r.id);
      case "horarios_livres":
        return this.eDaAgencia(r.agencia_id);
      case "conteudos":
      case "roteiros":
        return this.podeEditarCliente(r.cliente_id);
      case "comentarios":
        return this.podeVerCliente(r.cliente_id) && r.autor_id === e.id && r.tipo === "comentario";
      case "compromissos":
      case "briefings":
        return this.podeEditarCliente(r.cliente_id) || (tabela === "briefings" && this.eUsuarioDoCliente(r.cliente_id));
      case "arquivos":
        return this.eUsuarioDoCliente(r.cliente_id) || this.podeEditarCliente(r.cliente_id);
      default:
        return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Relações para os "embeds" do PostgREST (alias:tabela!dica(colunas))
// ---------------------------------------------------------------------------
type Relacao = { tipo: "um" | "muitos"; chaveLocal: string; chaveAlvo: string };
const RELACOES: Record<string, Relacao> = {
  "clientes>perfis": { tipo: "um", chaveLocal: "responsavel_id", chaveAlvo: "id" },
  "clientes>equipe_clientes": { tipo: "muitos", chaveLocal: "id", chaveAlvo: "cliente_id" },
  "equipe_clientes>perfis": { tipo: "um", chaveLocal: "user_id", chaveAlvo: "id" },
  "equipe_clientes>clientes": { tipo: "um", chaveLocal: "cliente_id", chaveAlvo: "id" },
  "perfis>equipe_clientes": { tipo: "muitos", chaveLocal: "id", chaveAlvo: "user_id" },
  "cliente_usuarios>perfis": { tipo: "um", chaveLocal: "user_id", chaveAlvo: "id" },
  "compromissos>perfis": { tipo: "um", chaveLocal: "responsavel_id", chaveAlvo: "id" },
  "horarios_livres>clientes": { tipo: "um", chaveLocal: "cliente_id", chaveAlvo: "id" },
  "horarios_livres>perfis": { tipo: "um", chaveLocal: "responsavel_id", chaveAlvo: "id" },
  "convites>agencias": { tipo: "um", chaveLocal: "agencia_id", chaveAlvo: "id" },
  "comentarios>perfis": { tipo: "um", chaveLocal: "autor_id", chaveAlvo: "id" },
};

type Campo = { nome: string } | { alias: string; tabela: string; filhos: Campo[] } | { todos: true };

function dividir(s: string) {
  const partes: string[] = [];
  let nivel = 0;
  let atual = "";
  for (const ch of s) {
    if (ch === "(") nivel++;
    if (ch === ")") nivel--;
    if (ch === "," && nivel === 0) {
      partes.push(atual.trim());
      atual = "";
    } else atual += ch;
  }
  if (atual.trim()) partes.push(atual.trim());
  return partes;
}

function analisar(colunas: string): Campo[] {
  return dividir(colunas.replace(/\s+/g, " ")).map((p) => {
    if (p === "*") return { todos: true };
    const m = p.match(/^(?:([a-z_]+):)?([a-z_]+)(?:![a-z_]+)?\((.*)\)$/);
    if (m) return { alias: m[1] ?? m[2], tabela: m[2], filhos: analisar(m[3]) };
    return { nome: p };
  });
}

// ---------------------------------------------------------------------------
// Valores padrão e gatilhos
// ---------------------------------------------------------------------------
const PADROES: Record<string, () => Linha> = {
  clientes: () => ({ status: "convidado", segmento: null, responsavel_id: null, convidado_em: null, entrada_concluida_em: null }),
  perfis: () => ({ ativo: true, funcao: null, termos_aceitos_em: null, termos_versao: null, telefone: null }),
  briefings: () => ({ respostas: {}, puladas: [], concluido_em: null }),
  contratos: () => ({ status: "rascunho", provedor: null, provedor_ref: null, link_assinatura: null, enviado_em: null, assinado_em: null, assinado_por: null }),
  horarios_livres: () => ({ cliente_id: null, compromisso_id: null, local: null, link: null, formato: "online" }),
  compromissos: () => ({ status: "agendado", formato: "online", local: null, link: null, descricao: null }),
  acessos_cliente: () => ({ status: "pendente", observacao: null }),
  etapas_entrada: () => ({ status: "a_fazer", concluido_em: null, concluido_por: null }),
  modelos_contrato: () => ({ padrao: false }),
  convites: () => ({ usado_em: null }),
  auditoria: () => ({ detalhes: {} }),
  conteudos: () => ({ status: "em_andamento", horario: null, legenda: null, arte_caminho: null, aprovado_em: null, aprovado_por: null }),
  roteiros: () => ({
    status: "em_andamento", objetivo: null, gancho: null, falas: null, cenas: null, referencias: null, o_que_levar: null,
    publicado_em: null, lido_em: null, aprovado_em: null, aprovado_por: null,
  }),
  comentarios: () => ({ tipo: "comentario" }),
};

const ETAPAS = ["boas_vindas", "contrato", "briefing", "acessos", "reuniao"] as const;
const TIPOS_ACESSO = ["instagram", "meta_business", "google_meu_negocio", "dominio"];

function novaLinha(tabela: string, dados: Linha): Linha {
  const base: Linha = { ...(PADROES[tabela]?.() ?? {}), criado_em: agora(), atualizado_em: agora(), ...dados };
  if (!("id" in base) && !["cliente_usuarios", "equipe_clientes", "etapas_entrada", "acessos_cliente", "financeiro_clientes", "plataforma_admins"].includes(tabela)) {
    base.id = gerarId();
  }
  return base;
}

export function inserirCru(db: Banco, tabela: string, dados: Linha) {
  const linha = novaLinha(tabela, dados);
  (db.tabelas[tabela] ??= []).push(linha);
  if (tabela === "clientes") prepararEntrada(db, linha);
  return linha;
}

function prepararEntrada(db: Banco, c: Linha) {
  for (const e of ETAPAS) {
    inserirCru(db, "etapas_entrada", { cliente_id: c.id, agencia_id: c.agencia_id, etapa: e, status: e === "boas_vindas" ? "em_andamento" : "a_fazer" });
  }
  inserirCru(db, "briefings", { cliente_id: c.id, agencia_id: c.agencia_id });
  for (const t of TIPOS_ACESSO) inserirCru(db, "acessos_cliente", { cliente_id: c.id, agencia_id: c.agencia_id, tipo: t });
}

function auditar(db: Banco, dados: Linha) {
  inserirCru(db, "auditoria", dados);
}

function concluirEtapa(db: Banco, cliente: string, etapa: string, quem: string | null) {
  const etapas = db.tabelas.etapas_entrada.filter((e) => e.cliente_id === cliente);
  const alvo = etapas.find((e) => e.etapa === etapa);
  if (!alvo || alvo.status === "concluido") return;
  Object.assign(alvo, { status: "concluido", concluido_em: agora(), concluido_por: quem, atualizado_em: agora() });
  auditar(db, { agencia_id: alvo.agencia_id, cliente_id: cliente, user_id: quem, acao: "entrada.etapa_concluida", entidade: "etapas_entrada", entidade_id: etapa });
  const proxima = ETAPAS.map((n) => etapas.find((e) => e.etapa === n)!).find((e) => e && e.status === "a_fazer");
  if (proxima) proxima.status = "em_andamento";
  if (etapas.every((e) => e.status === "concluido")) {
    const c = db.tabelas.clientes.find((x) => x.id === cliente);
    if (c && (c.status === "convidado" || c.status === "onboarding")) Object.assign(c, { status: "ativo", entrada_concluida_em: agora() });
  }
}

const etapaLiberada = (db: Banco, cliente: string, etapa: string) => {
  const i = ETAPAS.indexOf(etapa as (typeof ETAPAS)[number]);
  return db.tabelas.etapas_entrada.filter((e) => e.cliente_id === cliente && ETAPAS.indexOf(e.etapa) < i).every((e) => e.status === "concluido");
};

const erro = (code: string, message: string) => ({ data: null, error: { code, message } });

// ---------------------------------------------------------------------------
// Funções do banco (rpc)
// ---------------------------------------------------------------------------
export function executarRpc(db: Banco, uid: string | null, servico: boolean, nome: string, a: Linha): Resultado {
  const r = new Regras(db, uid);
  switch (nome) {
    case "concluir_boas_vindas": {
      if (!r.eUsuarioDoCliente(a.p_cliente)) return erro("42501", "Sem acesso a este cliente.");
      const p = db.tabelas.perfis.find((x) => x.id === uid)!;
      Object.assign(p, { termos_aceitos_em: agora(), termos_versao: a.p_termos_versao });
      const c = db.tabelas.clientes.find((x) => x.id === a.p_cliente)!;
      auditar(db, { agencia_id: c.agencia_id, cliente_id: c.id, user_id: uid, acao: "lgpd.termos_aceitos", detalhes: { versao: a.p_termos_versao } });
      if (c.status === "convidado") c.status = "onboarding";
      concluirEtapa(db, c.id, "boas_vindas", uid);
      return { data: null, error: null };
    }
    case "marcar_acesso": {
      const equipe = r.podeEditarCliente(a.p_cliente);
      if (!equipe && !r.eUsuarioDoCliente(a.p_cliente)) return erro("42501", "Sem acesso a este cliente.");
      if (a.p_status === "confirmado" && !equipe) return erro("42501", "Só a agência confirma o acesso.");
      const item = db.tabelas.acessos_cliente.find((x) => x.cliente_id === a.p_cliente && x.tipo === a.p_tipo);
      if (!item) return erro("P0002", "Item não encontrado.");
      Object.assign(item, { status: a.p_status, observacao: (a.p_observacao ?? "").trim() || null, atualizado_por: uid, atualizado_em: agora() });
      return { data: null, error: null };
    }
    case "concluir_acessos": {
      if (!r.eUsuarioDoCliente(a.p_cliente)) return erro("42501", "Sem acesso a este cliente.");
      if (!etapaLiberada(db, a.p_cliente, "acessos")) return erro("55000", "Conclua as etapas anteriores primeiro.");
      if (db.tabelas.acessos_cliente.some((x) => x.cliente_id === a.p_cliente && x.status === "pendente")) {
        return erro("55000", "Responda todos os itens do checklist.");
      }
      concluirEtapa(db, a.p_cliente, "acessos", uid);
      return { data: null, error: null };
    }
    case "reservar_primeira_reuniao": {
      if (!r.eUsuarioDoCliente(a.p_cliente)) return erro("42501", "Sem acesso a este cliente.");
      if (!etapaLiberada(db, a.p_cliente, "reuniao")) return erro("55000", "Conclua as etapas anteriores primeiro.");
      if (db.tabelas.etapas_entrada.some((e) => e.cliente_id === a.p_cliente && e.etapa === "reuniao" && e.status === "concluido")) {
        return erro("55000", "Sua primeira reunião já está marcada.");
      }
      const c = db.tabelas.clientes.find((x) => x.id === a.p_cliente)!;
      const h = db.tabelas.horarios_livres.find((x) => x.id === a.p_horario);
      if (!h || h.agencia_id !== c.agencia_id) return erro("P0002", "Horário não encontrado.");
      if (h.cliente_id) return erro("55000", "Esse horário acabou de ser reservado. Escolha outro.");
      const comp = inserirCru(db, "compromissos", {
        cliente_id: c.id,
        agencia_id: c.agencia_id,
        tipo: "reuniao",
        titulo: "Primeira reunião",
        inicio: h.inicio,
        fim: h.fim,
        formato: h.formato,
        local: h.local,
        link: h.link,
        responsavel_id: h.responsavel_id,
        criado_por: uid,
        descricao: "Conversa inicial para alinhar objetivos, briefing e a primeira estratégia.",
      });
      Object.assign(h, { cliente_id: c.id, compromisso_id: comp.id });
      concluirEtapa(db, c.id, "reuniao", uid);
      return { data: comp.id, error: null };
    }
    case "salvar_resposta_briefing":
    case "pular_pergunta_briefing": {
      if (!/^[a-z_]+\.[a-z_]+$/.test(a.p_chave)) return erro("22023", "Pergunta inválida.");
      const b = db.tabelas.briefings.find((x) => x.cliente_id === a.p_cliente);
      if (!b || !(r.eUsuarioDoCliente(a.p_cliente) || r.podeEditarCliente(a.p_cliente))) return erro("42501", "Sem acesso a este briefing.");
      if (nome === "salvar_resposta_briefing") {
        if (a.p_valor == null) delete b.respostas[a.p_chave];
        else b.respostas[a.p_chave] = a.p_valor;
        b.puladas = b.puladas.filter((c: string) => c !== a.p_chave);
      } else {
        b.puladas = b.puladas.filter((c: string) => c !== a.p_chave);
        if (a.p_pular) b.puladas.push(a.p_chave);
      }
      b.atualizado_em = agora();
      return { data: null, error: null };
    }
    case "confirmar_assinatura_contrato": {
      const k = db.tabelas.contratos.find((x) => x.id === a.p_contrato);
      if (!k) return erro("P0002", "Contrato não encontrado.");
      if (!servico && !r.eAdminDa(k.agencia_id)) return erro("42501", "Sem permissão.");
      if (k.status === "assinado") return { data: null, error: null };
      Object.assign(k, { status: "assinado", assinado_em: agora(), assinado_por: a.p_assinado_por, atualizado_em: agora() });
      auditar(db, { agencia_id: k.agencia_id, cliente_id: k.cliente_id, user_id: uid, acao: "contrato.assinado", entidade: "contratos", entidade_id: k.id, detalhes: { origem: a.p_origem } });
      concluirEtapa(db, k.cliente_id, "contrato", uid);
      return { data: null, error: null };
    }
    case "responder_item": {
      if (!["conteudo", "roteiro"].includes(a.p_tipo) || !["aprovar", "ajuste"].includes(a.p_acao)) return erro("22023", "Ação inválida.");
      const tabela = a.p_tipo === "conteudo" ? "conteudos" : "roteiros";
      const item = db.tabelas[tabela]?.find((x) => x.id === a.p_id && (a.p_tipo === "conteudo" || x.publicado_em));
      if (!item || !r.eUsuarioDoCliente(item.cliente_id)) return erro("P0002", "Item não encontrado.");
      if (item.status !== "aguardando_aprovacao") return erro("55000", "Este item não está esperando a sua aprovação.");
      const texto = String(a.p_texto ?? "").trim();
      if (a.p_acao === "ajuste" && texto.length < 3) return erro("22023", "Descreva o ajuste que você precisa.");
      const aprovou = a.p_acao === "aprovar";
      Object.assign(item, {
        status: aprovou ? "aprovado" : "ajuste_solicitado",
        aprovado_em: aprovou ? agora() : null,
        aprovado_por: aprovou ? uid : null,
        atualizado_em: agora(),
        ...(a.p_tipo === "roteiro" ? { lido_em: item.lido_em ?? agora() } : {}),
      });
      inserirCru(db, "comentarios", {
        cliente_id: item.cliente_id,
        agencia_id: item.agencia_id,
        item_tipo: a.p_tipo,
        item_id: item.id,
        autor_id: uid,
        tipo: aprovou ? "aprovacao" : "ajuste",
        texto: aprovou ? texto || "Aprovado." : texto,
      });
      auditar(db, { agencia_id: item.agencia_id, cliente_id: item.cliente_id, user_id: uid, acao: `${a.p_tipo}.${a.p_acao}`, entidade: tabela, entidade_id: item.id });
      return { data: null, error: null };
    }
    case "marcar_roteiro_lido": {
      const item = db.tabelas.roteiros?.find((x) => x.id === a.p_id);
      if (item && !item.lido_em && item.publicado_em && r.eUsuarioDoCliente(item.cliente_id)) item.lido_em = agora();
      return { data: null, error: null };
    }
    case "concluir_etapa_servico": {
      if (!servico) return erro("42501", "Sem permissão.");
      concluirEtapa(db, a.p_cliente, a.p_etapa, a.p_quem);
      return { data: null, error: null };
    }
    default:
      return erro("42883", `Função ${nome} não existe na demonstração.`);
  }
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------
type Filtro = (r: Linha) => boolean;

export type Contexto = {
  carregar: () => Promise<Banco>;
  salvar: (db: Banco) => Promise<void>;
  uid: () => Promise<string | null>;
  servico: boolean;
};

export class Consulta implements PromiseLike<Resultado> {
  private filtros: Filtro[] = [];
  private ordens: { col: string; asc: boolean }[] = [];
  private limite?: number;
  private modo: "um" | "talvez" | null = null;
  private colunas = "*";
  private contagem = false;
  private soCabeca = false;
  private acao: "ler" | "inserir" | "atualizar" | "apagar" = "ler";
  private dados: Linha | Linha[] | null = null;
  private devolver = false;

  constructor(private ctx: Contexto, private tabela: string) {}

  select(colunas = "*", opcoes?: { count?: string; head?: boolean }) {
    this.colunas = colunas;
    if (this.acao !== "ler") this.devolver = true;
    if (opcoes?.count) this.contagem = true;
    if (opcoes?.head) this.soCabeca = true;
    return this;
  }
  insert(dados: Linha | Linha[]) {
    this.acao = "inserir";
    this.dados = dados;
    return this;
  }
  update(dados: Linha) {
    this.acao = "atualizar";
    this.dados = dados;
    return this;
  }
  delete() {
    this.acao = "apagar";
    return this;
  }
  eq(c: string, v: unknown) {
    this.filtros.push((r) => r[c] === v);
    return this;
  }
  neq(c: string, v: unknown) {
    this.filtros.push((r) => r[c] !== v);
    return this;
  }
  in(c: string, vs: unknown[]) {
    this.filtros.push((r) => vs.includes(r[c]));
    return this;
  }
  is(c: string, v: null) {
    this.filtros.push((r) => (r[c] ?? null) === v);
    return this;
  }
  gt(c: string, v: any) {
    this.filtros.push((r) => r[c] != null && r[c] > v);
    return this;
  }
  gte(c: string, v: any) {
    this.filtros.push((r) => r[c] != null && r[c] >= v);
    return this;
  }
  lte(c: string, v: any) {
    this.filtros.push((r) => r[c] != null && r[c] <= v);
    return this;
  }
  order(c: string, o?: { ascending?: boolean }) {
    this.ordens.push({ col: c, asc: o?.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.limite = n;
    return this;
  }
  single() {
    this.modo = "um";
    return this;
  }
  maybeSingle() {
    this.modo = "talvez";
    return this;
  }

  then<A = Resultado, B = never>(ok?: ((v: Resultado) => A | PromiseLike<A>) | null, falha?: ((e: any) => B | PromiseLike<B>) | null) {
    return this.executar().then(ok, falha);
  }

  private projetar(db: Banco, regras: Regras, tabela: string, r: Linha, campos: Campo[]): Linha {
    const saida: Linha = {};
    for (const c of campos) {
      if ("todos" in c) Object.assign(saida, r);
      else if ("nome" in c) saida[c.nome] = r[c.nome] ?? null;
      else {
        const rel = RELACOES[`${tabela}>${c.tabela}`];
        if (!rel) throw new Error(`Relação ${tabela}>${c.tabela} não mapeada na demonstração`);
        const visiveis = (db.tabelas[c.tabela] ?? []).filter(
          (x) => x[rel.chaveAlvo] === r[rel.chaveLocal] && (this.ctx.servico || regras.ler(c.tabela, x)),
        );
        saida[c.alias] =
          rel.tipo === "um"
            ? visiveis[0]
              ? this.projetar(db, regras, c.tabela, visiveis[0], c.filhos)
              : null
            : visiveis.map((x) => this.projetar(db, regras, c.tabela, x, c.filhos));
      }
    }
    return saida;
  }

  private async executar(): Promise<Resultado> {
    const db = await this.ctx.carregar();
    const uid = await this.ctx.uid();
    const regras = new Regras(db, uid);
    const pode = (op: "ler" | "gravar", r: Linha) => this.ctx.servico || (op === "ler" ? regras.ler(this.tabela, r) : regras.gravar(this.tabela, r));
    const tabela = (db.tabelas[this.tabela] ??= []);
    const casa = (r: Linha) => this.filtros.every((f) => f(r));
    let linhas: Linha[];

    if (this.acao === "inserir") {
      const novos = (Array.isArray(this.dados) ? this.dados : [this.dados!]).map((d) => novaLinha(this.tabela, d));
      if (!novos.every((n) => pode("gravar", n))) return { data: null, error: ERRO_PERMISSAO };
      for (const n of novos) {
        tabela.push(n);
        if (this.tabela === "clientes") prepararEntrada(db, n);
      }
      await this.ctx.salvar(db);
      linhas = novos;
    } else if (this.acao === "atualizar") {
      linhas = tabela.filter((r) => casa(r) && pode("ler", r) && pode("gravar", r));
      for (const r of linhas) Object.assign(r, this.dados, { atualizado_em: agora() });
      if (linhas.length) await this.ctx.salvar(db);
    } else if (this.acao === "apagar") {
      linhas = tabela.filter((r) => casa(r) && pode("ler", r) && pode("gravar", r));
      db.tabelas[this.tabela] = tabela.filter((r) => !linhas.includes(r));
      if (this.tabela === "clientes") {
        const ids = new Set(linhas.map((l) => l.id));
        for (const t of Object.keys(db.tabelas)) if (t !== "clientes") db.tabelas[t] = db.tabelas[t].filter((r) => !ids.has(r.cliente_id) || t === "horarios_livres");
      }
      if (linhas.length) await this.ctx.salvar(db);
    } else {
      linhas = tabela.filter((r) => casa(r) && pode("ler", r));
    }

    if (this.acao !== "ler" && !this.devolver) return { data: null, error: null };

    for (const o of [...this.ordens].reverse()) {
      linhas = [...linhas].sort((a, b) => {
        const x = a[o.col] ?? "";
        const y = b[o.col] ?? "";
        const cmp = typeof x === "string" ? x.localeCompare(y, "pt-BR") : x === y ? 0 : x > y ? 1 : -1;
        return o.asc ? cmp : -cmp;
      });
    }
    const total = linhas.length;
    if (this.limite != null) linhas = linhas.slice(0, this.limite);
    if (this.soCabeca) return { data: null, error: null, count: total };

    const campos = analisar(this.colunas);
    const dados = linhas.map((r) => this.projetar(db, regras, this.tabela, r, campos));
    if (this.modo) {
      if (dados.length > 1 || (this.modo === "um" && dados.length === 0)) {
        return { data: null, error: { code: "PGRST116", message: "Esperava uma linha." } };
      }
      return { data: dados[0] ?? null, error: null, count: this.contagem ? total : null };
    }
    return { data: dados, error: null, count: this.contagem ? total : null };
  }
}
