/**
 * Perguntas do briefing. A chave salva no banco é "secao.pergunta".
 * As 10 seções seguem o protótipo do portal aprovado pela agência, com o envio
 * de logo, manual de marca e fotos na seção de produção de conteúdo.
 */

export type TipoPergunta = "texto" | "texto_longo" | "url" | "escolha" | "multipla" | "arquivo";

export type Pergunta = {
  id: string;
  rotulo: string;
  dica?: string;
  tipo: TipoPergunta;
  opcoes?: string[];
  max?: number;
  obrigatoria?: boolean;
  /** Mostra a pergunta só quando outra tem um destes valores. */
  mostrarSe?: { pergunta: string; valores: string[] };
  /** Para arquivos: tipos aceitos no seletor. */
  aceita?: string;
};

export type Secao = { id: string; titulo: string; descricao: string; perguntas: Pergunta[] };

export const SECOES: Secao[] = [
  {
    id: "empresa",
    titulo: "Sobre a empresa",
    descricao: "O essencial para entender quem é a sua marca.",
    perguntas: [
      { id: "nome", rotulo: "Nome da empresa ou da marca", tipo: "texto", obrigatoria: true },
      { id: "cidades_atuacao", rotulo: "Cidades de atuação", tipo: "texto" },
      {
        id: "segmento",
        rotulo: "Segmento",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Moda e vestuário", "Saúde e bem-estar", "Alimentação", "Beleza e estética", "Educação", "Tecnologia", "Serviços", "Varejo", "Outro"],
      },
      { id: "segmento_outro", rotulo: "Qual segmento?", tipo: "texto", mostrarSe: { pergunta: "empresa.segmento", valores: ["Outro"] } },
      { id: "tempo_existencia", rotulo: "Há quanto tempo existe?", tipo: "escolha", opcoes: ["Menos de 1 ano", "De 1 a 3 anos", "De 3 a 5 anos", "De 5 a 10 anos", "Mais de 10 anos"] },
      { id: "historia", rotulo: "Conte a história da empresa", tipo: "texto_longo" },
      {
        id: "canais_venda",
        rotulo: "Quais canais de venda são utilizados?",
        tipo: "multipla",
        opcoes: ["Loja física", "Instagram", "WhatsApp", "Site ou loja virtual", "Marketplace", "Indicação", "Outro"],
      },
    ],
  },
  {
    id: "posicionamento",
    titulo: "Posicionamento",
    descricao: "O que a marca entrega e como quer ser vista.",
    perguntas: [
      { id: "alem_produto", rotulo: "Além do produto ou serviço, o que você acredita que entrega para seus clientes?", tipo: "texto_longo" },
      { id: "diferencial", rotulo: "Qual o principal diferencial da sua empresa?", tipo: "texto_longo", obrigatoria: true },
      { id: "tres_palavras", rotulo: "Se pudesse escolher apenas 3 palavras para definir sua marca, quais seriam?", tipo: "texto" },
      {
        id: "valores",
        rotulo: "Quais são os valores da marca?",
        tipo: "multipla",
        opcoes: ["Qualidade", "Inovação", "Transparência", "Exclusividade", "Proximidade", "Sustentabilidade", "Tradição", "Acessibilidade", "Cuidado"],
      },
      { id: "descricao_desejada", rotulo: "Como você gostaria que o cliente descrevesse sua empresa?", tipo: "texto_longo" },
    ],
  },
  {
    id: "cliente_ideal",
    titulo: "Cliente ideal",
    descricao: "Para quem a marca fala.",
    perguntas: [
      { id: "genero", rotulo: "Gênero predominante", tipo: "escolha", obrigatoria: true, opcoes: ["Principalmente mulheres", "Principalmente homens", "Equilibrado"] },
      { id: "faixa_etaria", rotulo: "Faixa etária", tipo: "escolha", obrigatoria: true, opcoes: ["18 a 24", "25 a 34", "35 a 44", "45 a 54", "55 ou mais"] },
      { id: "forma_compra", rotulo: "Como prefere comprar?", tipo: "escolha", opcoes: ["Online", "Presencial", "Ambos"] },
      { id: "classe_social", rotulo: "Classe social", tipo: "escolha", opcoes: ["Baixa", "Média", "Média-alta", "Alta"] },
      {
        id: "influencia_decisao",
        rotulo: "O que mais influencia na decisão de compra hoje?",
        tipo: "multipla",
        opcoes: ["Preço", "Qualidade", "Indicação", "Redes sociais", "Reputação da marca", "Atendimento", "Exclusividade"],
      },
      { id: "o_que_faz_voltar", rotulo: "O que faz o cliente voltar?", tipo: "texto_longo" },
      { id: "principal_objecao", rotulo: "Qual a principal dúvida ou objeção antes da compra?", tipo: "texto_longo" },
    ],
  },
  {
    id: "produtos",
    titulo: "Produtos e serviços",
    descricao: "O que mais vende e o que você quer vender mais.",
    perguntas: [
      { id: "principais", rotulo: "Quais são os principais produtos ou serviços?", tipo: "texto_longo", obrigatoria: true },
      { id: "mais_vendidos", rotulo: "Quais são os mais vendidos?", tipo: "texto_longo" },
      { id: "vender_mais", rotulo: "Existe algum produto ou serviço que você deseja vender mais?", tipo: "texto_longo" },
      { id: "marcas_trabalhadas", rotulo: "Quais marcas sua empresa trabalha?", tipo: "texto" },
      { id: "caracteristicas_encantam", rotulo: "Quais características mais encantam os clientes?", tipo: "texto_longo" },
      { id: "elogio_frequente", rotulo: "Qual o elogio mais frequente à empresa?", tipo: "texto_longo" },
      { id: "reclamacoes", rotulo: "Quais são as reclamações ou dificuldades mais recorrentes?", tipo: "texto_longo" },
    ],
  },
  {
    id: "redes",
    titulo: "Redes sociais",
    descricao: "Onde a marca está e o que funciona hoje.",
    perguntas: [
      { id: "perfil_instagram", rotulo: "@ do Instagram", tipo: "texto", dica: "Exemplo: @suamarca" },
      { id: "canal_funciona_melhor", rotulo: "Qual canal costuma funcionar melhor hoje?", tipo: "escolha", opcoes: ["Presencial", "Online", "Equilibrado"] },
      {
        id: "conteudo_nao_deseja",
        rotulo: "Existe algum tipo de conteúdo que você não deseja produzir?",
        tipo: "multipla",
        opcoes: ["Vídeos longos", "Danças e trends", "Exposição pessoal", "Comparação com concorrentes", "Humor", "Política ou religião"],
      },
      { id: "perfis_referencia", rotulo: "Quais perfis você admira ou usa como referência?", dica: "O @ das inspirações.", tipo: "texto" },
    ],
  },
  {
    id: "concorrencia",
    titulo: "Concorrência",
    descricao: "Quem disputa o mesmo cliente.",
    perguntas: [
      { id: "principais", rotulo: "Quais são os principais concorrentes?", tipo: "texto_longo" },
      { id: "fazem_melhor", rotulo: "O que eles fazem melhor que a sua empresa atualmente?", tipo: "texto_longo" },
      { id: "voce_faz_melhor", rotulo: "O que a sua empresa faz melhor que eles?", tipo: "texto_longo" },
      { id: "mercado_nao_percebe", rotulo: "O que o mercado ainda não percebe sobre a sua marca?", tipo: "texto_longo" },
    ],
  },
  {
    id: "producao",
    titulo: "Produção de conteúdo",
    descricao: "Quem participa e os materiais da marca.",
    perguntas: [
      { id: "cronograma_stories", rotulo: "Tem alguém que consegue seguir o cronograma de stories diariamente?", tipo: "escolha", opcoes: ["Sim", "Não", "Às vezes"] },
      { id: "parceiros_gravacao", rotulo: "Existem parceiros disponíveis para gravações?", tipo: "escolha", opcoes: ["Sim", "Não"] },
      { id: "influenciadores", rotulo: "Existem influenciadores divulgando a marca?", tipo: "escolha", opcoes: ["Sim", "Não"] },
      { id: "logo", rotulo: "Envie a logo", dica: "PNG, SVG ou PDF. Se tiver versão com fundo transparente, melhor.", tipo: "arquivo", aceita: "image/png,image/svg+xml,image/jpeg,application/pdf" },
      { id: "manual_marca", rotulo: "Envie o manual de marca, se tiver", tipo: "arquivo", aceita: "application/pdf,image/png,image/jpeg" },
      {
        id: "fotos",
        rotulo: "Envie algumas fotos que representem a marca",
        dica: "Até 50 MB por arquivo. Vídeos grandes podem ir depois, na área de arquivos.",
        tipo: "arquivo",
        aceita: "image/png,image/jpeg,image/webp,video/mp4,video/quicktime",
      },
    ],
  },
  {
    id: "estrategia",
    titulo: "Estratégia de conteúdo",
    descricao: "Os assuntos que movem a marca.",
    perguntas: [
      { id: "assuntos_frequentes", rotulo: "Quais assuntos precisam aparecer com frequência?", tipo: "texto_longo" },
      { id: "pouco_explorados", rotulo: "Quais assuntos são pouco explorados, mas deveriam receber mais atenção?", tipo: "texto_longo" },
      { id: "parar_de_comunicar", rotulo: "O que a empresa precisa parar de comunicar?", tipo: "texto_longo" },
      { id: "mensagens_recorrentes", rotulo: "Quais mensagens devem se tornar recorrentes nas redes sociais?", tipo: "texto_longo" },
      { id: "essencia", rotulo: "Existe algum conceito, frase, crença ou propósito que represente a essência da marca?", tipo: "texto_longo" },
    ],
  },
  {
    id: "objetivos",
    titulo: "Objetivos",
    descricao: "O que conta como sucesso para você.",
    perguntas: [
      {
        id: "seis_meses",
        rotulo: "Principal objetivo nos próximos 6 meses",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Vender mais", "Atrair novos clientes", "Fortalecer a marca", "Aumentar autoridade", "Lançar produto ou serviço"],
      },
      { id: "sucesso", rotulo: "O que faria você considerar o nosso trabalho um sucesso daqui a 6 meses?", tipo: "texto_longo", obrigatoria: true },
    ],
  },
  {
    id: "importantes",
    titulo: "Informações importantes",
    descricao: "Últimos detalhes para começar bem.",
    perguntas: [
      { id: "destaque", rotulo: "Existe alguma promoção, campanha, produto, serviço ou novidade que precisa de destaque nos próximos meses?", tipo: "texto_longo" },
      { id: "equipe_precisa_saber", rotulo: "Existe alguma informação que a equipe da agência precisa saber sobre a sua empresa?", tipo: "texto_longo" },
    ],
  },
];

export const TODAS_PERGUNTAS = SECOES.flatMap((s) => s.perguntas.map((p) => ({ ...p, chave: `${s.id}.${p.id}`, secao: s.id })));

export function acharPergunta(chave: string) {
  return TODAS_PERGUNTAS.find((p) => p.chave === chave);
}

export type Respostas = Record<string, unknown>;

export function visivel(p: Pergunta, respostas: Respostas) {
  if (!p.mostrarSe) return true;
  const valor = respostas[p.mostrarSe.pergunta];
  const valores = Array.isArray(valor) ? valor : [valor];
  return valores.some((v) => typeof v === "string" && p.mostrarSe!.valores.includes(v));
}

export function respondida(valor: unknown) {
  if (valor == null) return false;
  if (typeof valor === "string") return valor.trim().length > 0;
  if (Array.isArray(valor)) return valor.length > 0;
  return true;
}

/** Perguntas obrigatórias visíveis que não foram respondidas nem deixadas para depois. */
export function pendentes(respostas: Respostas, puladas: string[]) {
  return TODAS_PERGUNTAS.filter(
    (p) => p.obrigatoria && visivel(p, respostas) && !respondida(respostas[p.chave]) && !puladas.includes(p.chave),
  );
}

export function progressoSecao(secao: Secao, respostas: Respostas) {
  const vis = secao.perguntas.filter((p) => visivel(p, respostas));
  const feitas = vis.filter((p) => respondida(respostas[`${secao.id}.${p.id}`])).length;
  return { feitas, total: vis.length };
}

/** Valida e normaliza uma resposta conforme o tipo da pergunta. Devolve null para apagar. */
export function normalizarResposta(p: Pergunta, valor: unknown): { ok: true; valor: unknown } | { ok: false; erro: string } {
  if (valor == null || valor === "") return { ok: true, valor: null };
  switch (p.tipo) {
    case "texto":
    case "texto_longo": {
      if (typeof valor !== "string") return { ok: false, erro: "Resposta inválida." };
      const limite = p.tipo === "texto" ? 300 : 4000;
      if (valor.length > limite) return { ok: false, erro: `Use até ${limite} caracteres.` };
      return { ok: true, valor };
    }
    case "url": {
      if (typeof valor !== "string" || valor.length > 500) return { ok: false, erro: "Link inválido." };
      const comProtocolo = /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
      try {
        const u = new URL(comProtocolo);
        if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) throw new Error();
        return { ok: true, valor: u.toString() };
      } catch {
        return { ok: false, erro: "Confira o link. Exemplo: pinterest.com/suamarca" };
      }
    }
    case "escolha":
      return typeof valor === "string" && p.opcoes?.includes(valor) ? { ok: true, valor } : { ok: false, erro: "Opção inválida." };
    case "multipla": {
      if (!Array.isArray(valor) || !valor.every((v) => typeof v === "string" && p.opcoes?.includes(v))) {
        return { ok: false, erro: "Opção inválida." };
      }
      if (p.max && valor.length > p.max) return { ok: false, erro: `Escolha até ${p.max}.` };
      return { ok: true, valor: [...new Set(valor)] };
    }
    case "arquivo": {
      const uuid = /^[0-9a-f-]{36}$/;
      if (!Array.isArray(valor) || valor.length > 20 || !valor.every((v) => typeof v === "string" && uuid.test(v))) {
        return { ok: false, erro: "Arquivo inválido." };
      }
      return { ok: true, valor };
    }
  }
}
