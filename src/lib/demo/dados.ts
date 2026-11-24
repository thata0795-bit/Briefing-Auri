/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dados fictícios da demonstração. Cada visitante recebe uma cópia nova.
 * Datas são relativas ao momento da criação, para a agenda sempre ter horários futuros.
 */
import { createHash } from "node:crypto";
import { comIdsPrevisiveis, inserirCru, type Banco, type Linha } from "./motor";

export const AG = "a0000000-0000-4000-8000-0000000000d1";
export const U = {
  taynara: "d0000000-0000-4000-8000-000000000001",
  julia: "d0000000-0000-4000-8000-000000000002",
  rafael: "d0000000-0000-4000-8000-000000000003",
  marina: "d0000000-0000-4000-8000-000000000011",
  carla: "d0000000-0000-4000-8000-000000000012",
  helena: "d0000000-0000-4000-8000-000000000013",
};
const C = {
  aurora: "c0000000-0000-4000-8000-0000000000d1",
  bravo: "c0000000-0000-4000-8000-0000000000d2",
  serena: "c0000000-0000-4000-8000-0000000000d3",
};

/** Token fixo do convite da Clínica Serena, para a demonstração começar do convite. */
export const TOKEN_CONVITE_DEMO = "demonstracao-convite-clinica-serena-0000000000000";

/**
 * Senhas de acesso da demonstração, guardadas como sha256("email:senha").
 * As senhas em si não ficam no código: são entregues a cada pessoa.
 */
export const SENHAS_DEMO: Record<string, string> = {
  "taynara@agencia-exemplo.com.br": "c90b131a0d0bbadca7d611440b1801b4033325b62ffc2b3d5dd407d7ddd10a53",
  "julia@agencia-exemplo.com.br": "394f5852a6b93893194a2b3a09b58b629cd458d6509c9c86d7a42008227886b9",
  "rafael@agencia-exemplo.com.br": "a131f96ce49d0dfbe6a12210b5e54c00068dfe3ff244a1f2edcddd8ae96149d8",
  "marina@padaria-exemplo.com.br": "a1da133bfcb0e2868c5003791560bd77317d9707350099bf8423af943fa41dce",
  "carla@estudio-exemplo.com.br": "157f7a89acbc006335e69f41816e7fe09fdbe7d5d1564cea1e59b57b8d522f0a",
  "helena@clinica-exemplo.com.br": "378053e18d14f962d64e222258ae281af15ab8929d249ce3f4473cedc5b8bc65",
};

/** Pessoas da demonstração (usado nos testes e na documentação). */
export const PERFIS_DEMO = [
  { id: U.taynara, nome: "Taynara Castro", papel: "Dona da agência", detalhe: "Vê tudo: clientes, equipe, contratos e modelos." },
  { id: U.julia, nome: "Júlia Martins", papel: "Equipe · Social media", detalhe: "Atende a Padaria Aurora e o Estúdio Bravo. Não vê valores." },
  { id: U.rafael, nome: "Rafael Souza", papel: "Equipe · Designer", detalhe: "Atende só o Estúdio Bravo." },
  { id: U.marina, nome: "Marina Lopes", papel: "Cliente · Padaria Aurora", detalhe: "Entrada concluída. Vê o painel do cliente." },
  { id: U.carla, nome: "Carla Mendes", papel: "Cliente · Estúdio Bravo", detalhe: "No meio da entrada, com o contrato para assinar." },
  { id: U.helena, nome: "Helena Prado", papel: "Cliente · Clínica Serena", detalhe: "Cliente novo. Melhor começar pelo convite, logo abaixo." },
];

const dia = 24 * 3600 * 1000;
/** Data em São Paulo (UTC-3) daqui a `d` dias, no horário hh:mm. */
function emDias(d: number, hhmm: string) {
  const base = new Date(Date.now() + d * dia);
  const data = new Date(base.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  return new Date(`${data}T${hhmm}:00-03:00`).toISOString();
}
const atras = (d: number) => new Date(Date.now() - d * dia).toISOString();

function usuario(db: Banco, id: string, email: string, meta: Linha) {
  db.usuarios.push({ id, email, app_metadata: meta });
  inserirCru(db, "perfis", { id, agencia_id: AG, papel: meta.papel, funcao: meta.funcao ?? null, nome: meta.nome, email, criado_em: atras(60) });
  if (meta.cliente_id) inserirCru(db, "cliente_usuarios", { cliente_id: meta.cliente_id, agencia_id: AG, user_id: id });
}

const RESPOSTAS_AURORA: Record<string, any> = {
  "negocio.nome": "Padaria Aurora",
  "negocio.segmento": "Alimentação",
  "negocio.oferta": "Pães de fermentação natural, bolos caseiros e café da manhã para encomenda.",
  "negocio.tempo": "Mais de 3 anos",
  "negocio.cidade": "Belo Horizonte, bairro Santa Tereza, com entrega na região",
  "negocio.historia": "Começou na cozinha de casa vendendo pão para vizinhos. Hoje tem loja própria e oito funcionários.",
  "produtos.principais": "Pão de fermentação natural, pão de queijo, bolos de festa, cestas de café da manhã.",
  "produtos.carro_chefe": "Pão de fermentação natural",
  "produtos.impulsionar": "Cestas de café da manhã para datas comemorativas e pedidos de empresas.",
  "produtos.ticket": "Até R$ 100",
  "produtos.diferenciais": "Fermentação de 24 horas, ingredientes de produtores de Minas e atendimento pelo nome.",
  "produtos.canais_venda": ["Loja física", "WhatsApp", "Direct do Instagram"],
  "publico.genero": "Ambos",
  "publico.faixa": ["25 a 34", "35 a 44"],
  "publico.classe": "Média (B)",
  "publico.cliente_ideal": "Moradores do bairro que valorizam comida de verdade e compram para a família no fim de semana.",
  "publico.percepcao": ["Acessível", "Confiável", "Natural"],
  "concorrencia.concorrentes": "Duas padarias tradicionais do bairro e uma rede de cafeterias no centro.",
  "concorrencia.admira": "Padarias artesanais de São Paulo com fotos de bastidor da produção.",
  "concorrencia.nao_quer": "Parecer cara ou distante. Nada de linguagem de restaurante sofisticado.",
  "concorrencia.referencia_link": "https://pinterest.com/exemplo-padaria",
  "identidade.possui": "Parcial (só logo ou só cores)",
  "identidade.paleta": ["Terrosos (terra, cobre, mostarda)"],
  "identidade.cor_proibida": "Azul",
  "identidade.estilo": "Orgânico e natural",
  "voz.tom": "Descontraído e próximo",
  "voz.tratamento": "Você",
  "voz.palavras_usa": "fornada, quentinho, feito aqui, bom dia",
  "voz.palavras_evita": "gourmet, premium",
  "voz.emojis": "Com moderação",
  "redes.quais": ["Instagram", "Status do WhatsApp"],
  "redes.perfil_instagram": "@padaria.aurora.exemplo",
  "redes.formatos": ["Reels e vídeos curtos", "Stories", "Carrossel"],
  "redes.frequencia": "5 vezes por semana",
  "redes.aparece": "Apareço se precisar",
  "objetivos.principal": "Vender mais",
  "objetivos.tres_meses": "Dobrar as encomendas de cestas e ter a agenda de pedidos de fim de ano cheia até novembro.",
  "objetivos.datas": "Dia das Mães, Páscoa, aniversário da padaria em setembro, Natal.",
  "materiais.fornece": "Tenho algum material",
  "materiais.local_captacao": "Na própria padaria, de preferência às 6h, durante a primeira fornada.",
  "materiais.dias_captacao": ["Terça", "Quinta"],
  "combinados.aprovacao": "Marina Lopes, sócia. Ela dá a palavra final.",
  "combinados.prazo_aprovacao": "Em até 24 horas",
};

export function criarBancoDemo(): Banco {
  return comIdsPrevisiveis(montarBanco);
}

function montarBanco(): Banco {
  const db: Banco = { tabelas: {}, usuarios: [] };

  inserirCru(db, "agencias", {
    id: AG,
    nome: "Agência Taynara Castro",
    slug: "taynara-castro",
    marca: {},
    email_contato: "contato@agencia-exemplo.com.br",
    telefone: null,
    ativa: true,
  });

  usuario(db, U.taynara, "taynara@agencia-exemplo.com.br", { papel: "admin", nome: "Taynara Castro" });
  usuario(db, U.julia, "julia@agencia-exemplo.com.br", { papel: "equipe", funcao: "social_media", nome: "Júlia Martins" });
  usuario(db, U.rafael, "rafael@agencia-exemplo.com.br", { papel: "equipe", funcao: "designer", nome: "Rafael Souza" });

  inserirCru(db, "clientes", { id: C.aurora, agencia_id: AG, nome: "Padaria Aurora", segmento: "Alimentação", status: "ativo", responsavel_id: U.julia, criado_em: atras(40), convidado_em: atras(40), entrada_concluida_em: atras(33) });
  inserirCru(db, "clientes", { id: C.bravo, agencia_id: AG, nome: "Estúdio Bravo", segmento: "Beleza e bem-estar", status: "onboarding", responsavel_id: U.julia, criado_em: atras(3), convidado_em: atras(3) });
  inserirCru(db, "clientes", { id: C.serena, agencia_id: AG, nome: "Clínica Serena", segmento: "Saúde", status: "convidado", responsavel_id: U.taynara, criado_em: atras(0.2), convidado_em: atras(0.2) });

  usuario(db, U.marina, "marina@padaria-exemplo.com.br", { papel: "cliente", nome: "Marina Lopes", cliente_id: C.aurora });
  usuario(db, U.carla, "carla@estudio-exemplo.com.br", { papel: "cliente", nome: "Carla Mendes", cliente_id: C.bravo });
  usuario(db, U.helena, "helena@clinica-exemplo.com.br", { papel: "cliente", nome: "Helena Prado", cliente_id: C.serena });

  for (const [cliente, user] of [[C.aurora, U.julia], [C.bravo, U.julia], [C.bravo, U.rafael]]) {
    inserirCru(db, "equipe_clientes", { cliente_id: cliente, agencia_id: AG, user_id: user });
  }

  for (const [cliente, plano, valor, venc] of [
    [C.aurora, "Plano Essencial", 1800, 10],
    [C.bravo, "Plano Completo", 2900, 5],
    [C.serena, "Plano Essencial", 1800, 15],
  ] as const) {
    inserirCru(db, "financeiro_clientes", { cliente_id: cliente, agencia_id: AG, plano, valor_mensal: valor, dia_vencimento: venc, forma_pagamento: "boleto", inicio_contrato: null });
  }

  // Aurora: entrada concluída, briefing completo, acessos confirmados, agenda com reunião e captação
  for (const e of db.tabelas.etapas_entrada.filter((x) => x.cliente_id === C.aurora)) Object.assign(e, { status: "concluido", concluido_em: atras(33) });
  for (const a of db.tabelas.acessos_cliente.filter((x) => x.cliente_id === C.aurora)) a.status = a.tipo === "dominio" ? "nao_tenho" : "confirmado";
  Object.assign(db.tabelas.briefings.find((b) => b.cliente_id === C.aurora)!, { respostas: RESPOSTAS_AURORA, concluido_em: atras(34) });
  db.tabelas.perfis.find((p) => p.id === U.marina)!.termos_aceitos_em = atras(36);
  inserirCru(db, "compromissos", { cliente_id: C.aurora, agencia_id: AG, tipo: "reuniao", titulo: "Reunião de planejamento do mês", inicio: emDias(3, "10:00"), fim: emDias(3, "11:00"), formato: "online", link: "https://meet.google.com/exemplo", responsavel_id: U.julia });
  inserirCru(db, "compromissos", { cliente_id: C.aurora, agencia_id: AG, tipo: "captacao", titulo: "Captação de reels na padaria", inicio: emDias(6, "06:00"), fim: emDias(6, "08:00"), formato: "presencial", local: "Padaria Aurora", o_que_levar: "Avental da marca e a cesta de Natal montada.", responsavel_id: U.julia });

  // Bravo: boas-vindas feitas, contrato enviado aguardando assinatura
  concluirBoasVindasDemo(db, C.bravo, U.carla);

  // Modelo de contrato
  inserirCru(db, "modelos_contrato", {
    agencia_id: AG,
    nome: "Prestação de serviços de social media (exemplo)",
    padrao: true,
    corpo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL

MODELO DE EXEMPLO. Este texto existe só para a demonstração e será substituído pelo contrato real da agência.

CONTRATANTE: {{cliente.nome}}, representada por {{contato.nome}} ({{contato.email}}).
CONTRATADA: {{agencia.nome}}.

1. OBJETO
A CONTRATADA prestará serviços de gestão de redes sociais conforme o {{plano.nome}}.

2. VALOR E PAGAMENTO
O valor mensal é de {{plano.valor}}, com vencimento todo dia {{plano.vencimento}}, por {{plano.forma_pagamento}}.

3. VIGÊNCIA
Início em {{contrato.inicio}}.

4. DADOS PESSOAIS
As partes tratam os dados pessoais envolvidos conforme a Lei 13.709/2018 (LGPD).

Data de emissão: {{hoje}}.`,
  });
  inserirCru(db, "contratos", {
    cliente_id: C.bravo,
    agencia_id: AG,
    titulo: "Prestação de serviços de social media (exemplo)",
    status: "enviado",
    provedor: "simulado",
    provedor_ref: "sim_demo_bravo",
    link_assinatura: "/assinatura-simulada/sim_demo_bravo",
    enviado_em: atras(2),
    conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL

MODELO DE EXEMPLO. Este texto existe só para a demonstração e será substituído pelo contrato real da agência.

CONTRATANTE: Estúdio Bravo, representada por Carla Mendes (carla@estudio-exemplo.com.br).
CONTRATADA: Agência Taynara Castro.

1. OBJETO
A CONTRATADA prestará serviços de gestão de redes sociais conforme o Plano Completo.

2. VALOR E PAGAMENTO
O valor mensal é de R$ 2.900,00, com vencimento todo dia 5, por boleto.`,
  });
  db.tabelas.etapas_entrada.find((e) => e.cliente_id === C.bravo && e.etapa === "contrato")!.status = "aguardando_aprovacao";

  // Serena: contrato enviado junto com o convite
  inserirCru(db, "contratos", {
    cliente_id: C.serena,
    agencia_id: AG,
    titulo: "Prestação de serviços de social media (exemplo)",
    status: "enviado",
    provedor: "simulado",
    provedor_ref: "sim_demo_serena",
    link_assinatura: "/assinatura-simulada/sim_demo_serena",
    enviado_em: atras(0.2),
    conteudo: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL

MODELO DE EXEMPLO. Este texto existe só para a demonstração e será substituído pelo contrato real da agência.

CONTRATANTE: Clínica Serena, representada por Helena Prado (helena@clinica-exemplo.com.br).
CONTRATADA: Agência Taynara Castro.

1. OBJETO
A CONTRATADA prestará serviços de gestão de redes sociais conforme o Plano Essencial.

2. VALOR E PAGAMENTO
O valor mensal é de R$ 1.800,00, com vencimento todo dia 15, por boleto.

3. DADOS PESSOAIS
As partes tratam os dados pessoais envolvidos conforme a Lei 13.709/2018 (LGPD).`,
  });

  // Serena: convite pendente com token fixo
  inserirCru(db, "convites", {
    agencia_id: AG,
    cliente_id: C.serena,
    user_id: U.helena,
    email: "helena@clinica-exemplo.com.br",
    token_hash: createHash("sha256").update(TOKEN_CONVITE_DEMO).digest("hex"),
    token_demo: TOKEN_CONVITE_DEMO,
    expira_em: new Date(Date.now() + 7 * dia).toISOString(),
    criado_por: U.taynara,
  });

  // Horários livres para a primeira reunião
  for (let d = 2; d <= 8; d++) {
    if (new Date(Date.now() + d * dia).getUTCDay() % 6 === 0) continue;
    inserirCru(db, "horarios_livres", { agencia_id: AG, responsavel_id: U.julia, inicio: emDias(d, "10:00"), fim: emDias(d, "11:00"), formato: "online", link: "https://meet.google.com/exemplo" });
    inserirCru(db, "horarios_livres", { agencia_id: AG, responsavel_id: U.taynara, inicio: emDias(d, "15:00"), fim: emDias(d, "16:00"), formato: "presencial", local: "Escritório da agência" });
  }
  semearConteudos(db);
  return db;
}

function concluirBoasVindasDemo(db: Banco, cliente: string, user: string) {
  db.tabelas.perfis.find((p) => p.id === user)!.termos_aceitos_em = atras(2);
  const etapas = db.tabelas.etapas_entrada.filter((e) => e.cliente_id === cliente);
  Object.assign(etapas.find((e) => e.etapa === "boas_vindas")!, { status: "concluido", concluido_em: atras(2) });
}

/** Data (AAAA-MM-DD) em São Paulo, daqui a `d` dias. */
function diaRel(d: number) {
  return new Date(Date.now() + d * dia - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function semearConteudos(db: Banco) {
  const posts: [string, number, string, string, string, string][] = [
    // cliente, dias a partir de hoje, formato, título, situação, legenda
    [C.aurora, -12, "feed", "Bom dia com pão quentinho", "concluido", "A primeira fornada sai às 6h. Quem chega cedo leva o pão ainda quente."],
    [C.aurora, -9, "reels", "Bastidores da fermentação de 24 horas", "concluido", "Por que o nosso pão leva um dia inteiro para ficar pronto. Spoiler: vale a espera."],
    [C.aurora, -5, "carrossel", "4 jeitos de servir o pão de fermentação natural", "concluido", "Do café da manhã ao jantar: salve este post para não esquecer."],
    [C.aurora, -2, "stories", "Enquete: doce ou salgado no café da manhã?", "concluido", "Enquete nos stories com resultado no dia seguinte."],
    [C.aurora, 1, "feed", "Cesta de café da manhã para presentear", "programado", "Encomende até quinta e receba no sábado. Link na bio."],
    [C.aurora, 3, "reels", "Da massa ao forno em 30 segundos", "aprovado", "O caminho do pão de queijo, do jeito que a vovó fazia."],
    [C.aurora, 5, "carrossel", "Ingredientes de produtores de Minas", "aguardando_aprovacao", "Conheça quem planta o trigo, produz o queijo e a manteiga que usamos aqui."],
    [C.aurora, 7, "feed", "Promoção da semana: bolo de fubá", "aguardando_aprovacao", "Toda quarta, bolo de fubá com 15% de desconto no balcão."],
    [C.aurora, 9, "reels", "Pergunta do cliente: o pão engorda?", "ajuste_solicitado", "Respondemos a dúvida que mais aparece no direct, com a nossa nutricionista parceira."],
    [C.aurora, 12, "stories", "Bastidores da entrega das cestas", "aguardando_aprovacao", "Sequência de 4 stories mostrando a montagem e a entrega."],
    [C.aurora, 14, "feed", "Depoimento de cliente", "em_andamento", "Rascunho: aguardando foto da cliente."],
    [C.aurora, 18, "carrossel", "Calendário de encomendas de fim de ano", "em_andamento", "Rascunho: datas limite para Natal e Ano-Novo."],
    [C.bravo, 4, "feed", "Apresentação do Estúdio Bravo", "aguardando_aprovacao", "Prazer, somos o Estúdio Bravo. Cuidamos de você do cabelo à pele."],
    [C.bravo, 8, "reels", "Antes e depois: corte e coloração", "em_andamento", "Rascunho."],
  ];
  const ids: Record<string, string> = {};
  for (const [cliente, d, formato, titulo, status, legenda] of posts) {
    const linha = inserirCru(db, "conteudos", {
      cliente_id: cliente,
      agencia_id: AG,
      data_publicacao: diaRel(d),
      horario: formato === "stories" ? null : "18:00",
      formato,
      titulo,
      legenda,
      status,
      criado_por: U.julia,
      aprovado_em: ["aprovado", "programado", "concluido"].includes(status) ? atras(Math.max(1, -d + 3)) : null,
      aprovado_por: ["aprovado", "programado", "concluido"].includes(status) ? (cliente === C.aurora ? U.marina : U.carla) : null,
    });
    ids[titulo] = linha.id;
  }
  const comentario = (item: string, autor: string, tipo: string, texto: string, quando: number) =>
    inserirCru(db, "comentarios", { cliente_id: C.aurora, agencia_id: AG, item_tipo: "conteudo", item_id: item, autor_id: autor, tipo, texto, criado_em: atras(quando) });
  comentario(ids["Pergunta do cliente: o pão engorda?"], U.marina, "ajuste", "Gostei, mas troca a trilha. Essa música não combina com a padaria. E pode citar o nome da nutricionista na legenda?", 1);
  comentario(ids["Da massa ao forno em 30 segundos"], U.marina, "aprovacao", "Aprovado. Ficou lindo!", 2);
  comentario(ids["Ingredientes de produtores de Minas"], U.julia, "comentario", "Marina, as fotos dos produtores chegaram ontem. Usei as três melhores.", 0.5);

  const roteiros: [string, number, string, string, string, boolean, Record<string, string>][] = [
    [C.aurora, 6, "reels", "Da massa ao forno em 30 segundos", "aprovado", true, {
      objetivo: "Mostrar que o pão de queijo é feito ali, na hora.",
      gancho: "Close no queijo sendo ralado, com o som bem alto.",
      falas: "Marina: Aqui o pão de queijo não vem congelado de fábrica. A gente rala o queijo, sova a massa e assa na hora.\nMarina: Quer ver?",
      cenas: "1. Queijo sendo ralado\n2. Massa sendo sovada\n3. Bandeja entrando no forno\n4. Pão de queijo saindo, mordida",
      o_que_levar: "Avental da padaria, queijo meia cura, bandeja limpa.",
    }],
    [C.aurora, 6, "stories", "Um dia na padaria", "aguardando_aprovacao", true, {
      objetivo: "Aproximar o público da rotina da equipe.",
      gancho: "Relógio marcando 5h30 e as luzes acendendo.",
      falas: "Sequência sem fala. Textos curtos na tela: 5h30 a gente chega. 6h sai a primeira fornada. 7h fila na porta.",
      cenas: "1. Porta abrindo\n2. Forno ligando\n3. Primeira fornada\n4. Primeiro cliente do dia",
      o_que_levar: "Celular carregado, tripé pequeno.",
    }],
    [C.aurora, 10, "reels", "Pergunta do cliente: o pão engorda?", "aguardando_aprovacao", true, {
      objetivo: "Responder a dúvida mais frequente do direct e gerar autoridade.",
      gancho: "Pão engorda? A resposta curta é: depende.",
      falas: "Nutricionista: Não existe alimento que engorda sozinho. O que conta é a quantidade e o que acompanha.\nMarina: E o nosso, de fermentação natural, ainda é mais fácil de digerir.",
      cenas: "1. Pergunta na tela\n2. Nutricionista no balcão\n3. Marina cortando o pão\n4. Prato montado",
      referencias: "@exemplo.nutri",
      o_que_levar: "Pão de fermentação natural inteiro, tábua de madeira.",
    }],
    [C.aurora, 16, "reels", "Encomendas de Natal", "em_andamento", false, { objetivo: "Abrir as encomendas de fim de ano." }],
    [C.bravo, 9, "reels", "Antes e depois: corte e coloração", "aguardando_aprovacao", true, {
      objetivo: "Mostrar o resultado do serviço mais procurado.",
      gancho: "Começar pelo depois, voltar para o antes.",
      cenas: "1. Resultado final\n2. Volta no tempo\n3. Processo acelerado\n4. Reação da cliente",
    }],
  ];
  for (const [cliente, d, tipo, titulo, status, publicado, campos] of roteiros) {
    inserirCru(db, "roteiros", {
      cliente_id: cliente,
      agencia_id: AG,
      tipo,
      titulo,
      data_gravacao: diaRel(d),
      status,
      publicado_em: publicado ? atras(2) : null,
      lido_em: status === "aprovado" ? atras(1.5) : null,
      criado_por: U.julia,
      ...campos,
    });
  }
}
