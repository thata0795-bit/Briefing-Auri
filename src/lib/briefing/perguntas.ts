/**
 * Perguntas do briefing. A chave salva no banco é "secao.pergunta".
 * As seções 1, 3, 5, 7 e 10 vêm do protótipo da Auri Studio (referencia/);
 * as demais completam o briefing de 10 seções da agência.
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
    id: "negocio",
    titulo: "Sobre o negócio",
    descricao: "O essencial para entender quem é a sua marca.",
    perguntas: [
      { id: "nome", rotulo: "Nome do negócio ou da marca", tipo: "texto", obrigatoria: true },
      {
        id: "segmento",
        rotulo: "Segmento de atuação",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Moda e estilo", "Beleza e bem-estar", "Alimentação", "Saúde", "Educação", "Serviços", "Tecnologia", "Varejo", "Outro"],
      },
      { id: "segmento_outro", rotulo: "Qual segmento?", tipo: "texto", mostrarSe: { pergunta: "negocio.segmento", valores: ["Outro"] } },
      { id: "oferta", rotulo: "O que a marca vende ou oferece?", dica: "Em uma ou duas frases.", tipo: "texto_longo", obrigatoria: true },
      {
        id: "tempo",
        rotulo: "Há quanto tempo o negócio existe?",
        tipo: "escolha",
        opcoes: ["Ainda não existe (lançamento)", "Menos de 1 ano", "De 1 a 3 anos", "Mais de 3 anos"],
      },
      { id: "cidade", rotulo: "Cidade e região onde atende", tipo: "texto", dica: "Ou se atende o Brasil todo pela internet." },
      { id: "historia", rotulo: "Conte a história da marca", dica: "Como começou e o que mudou desde então.", tipo: "texto_longo" },
    ],
  },
  {
    id: "produtos",
    titulo: "Produtos e serviços",
    descricao: "O que mais vende e o que você quer vender mais.",
    perguntas: [
      { id: "principais", rotulo: "Principais produtos ou serviços", tipo: "texto_longo", obrigatoria: true },
      { id: "carro_chefe", rotulo: "Qual é o carro-chefe?", tipo: "texto" },
      { id: "impulsionar", rotulo: "O que você quer vender mais nos próximos meses?", tipo: "texto_longo" },
      {
        id: "ticket",
        rotulo: "Ticket médio por venda",
        tipo: "escolha",
        opcoes: ["Até R$ 100", "De R$ 100 a R$ 500", "De R$ 500 a R$ 2.000", "Acima de R$ 2.000", "Prefiro não informar"],
      },
      { id: "diferenciais", rotulo: "O que diferencia você da concorrência?", tipo: "texto_longo", obrigatoria: true },
      {
        id: "canais_venda",
        rotulo: "Onde a venda acontece?",
        tipo: "multipla",
        opcoes: ["Loja física", "Site ou loja virtual", "WhatsApp", "Direct do Instagram", "Marketplace", "Indicação"],
      },
    ],
  },
  {
    id: "publico",
    titulo: "Público e posicionamento",
    descricao: "Para quem a marca fala e como quer ser vista.",
    perguntas: [
      { id: "genero", rotulo: "Gênero predominante do público", tipo: "escolha", obrigatoria: true, opcoes: ["Feminino", "Masculino", "Ambos"] },
      {
        id: "faixa",
        rotulo: "Faixa etária do público",
        tipo: "multipla",
        obrigatoria: true,
        opcoes: ["18 a 24", "25 a 34", "35 a 44", "45 a 54", "55 ou mais", "Variada"],
      },
      { id: "classe", rotulo: "Classe social predominante", tipo: "escolha", opcoes: ["Popular (C/D)", "Média (B)", "Alta (A)", "Mista"] },
      { id: "cliente_ideal", rotulo: "Descreva seu cliente ideal", dica: "Rotina, desejos, o que faz ele comprar.", tipo: "texto_longo" },
      {
        id: "percepcao",
        rotulo: "Como a marca quer ser percebida?",
        dica: "Escolha até 3.",
        tipo: "multipla",
        max: 3,
        obrigatoria: true,
        opcoes: ["Sofisticada", "Acessível", "Jovem", "Séria", "Divertida", "Confiável", "Exclusiva", "Natural", "Moderna", "Minimalista"],
      },
    ],
  },
  {
    id: "concorrencia",
    titulo: "Concorrência e referências",
    descricao: "Quem disputa o mesmo cliente e quem inspira você.",
    perguntas: [
      { id: "concorrentes", rotulo: "Concorrentes diretos", dica: "Nomes ou @ do Instagram.", tipo: "texto_longo" },
      { id: "admira", rotulo: "Marcas que você admira", dica: "Do seu segmento ou de fora dele.", tipo: "texto_longo" },
      { id: "nao_quer", rotulo: "O que você não quer parecer de jeito nenhum?", tipo: "texto_longo" },
      { id: "referencia_link", rotulo: "Link de referência visual", dica: "Pinterest, perfil, site.", tipo: "url" },
    ],
  },
  {
    id: "identidade",
    titulo: "Identidade visual",
    descricao: "Cores, estilo e os arquivos da sua marca.",
    perguntas: [
      {
        id: "possui",
        rotulo: "Já tem identidade visual?",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Sim, completa (logo, cores e fontes)", "Parcial (só logo ou só cores)", "Não tenho"],
      },
      {
        id: "logo",
        rotulo: "Envie a logo",
        dica: "PNG, SVG ou PDF. Se tiver versão com fundo transparente, melhor.",
        tipo: "arquivo",
        aceita: "image/png,image/svg+xml,image/jpeg,application/pdf",
        mostrarSe: { pergunta: "identidade.possui", valores: ["Sim, completa (logo, cores e fontes)", "Parcial (só logo ou só cores)"] },
      },
      {
        id: "manual",
        rotulo: "Envie o manual de marca, se tiver",
        tipo: "arquivo",
        aceita: "application/pdf,image/png,image/jpeg",
        mostrarSe: { pergunta: "identidade.possui", valores: ["Sim, completa (logo, cores e fontes)"] },
      },
      {
        id: "paleta",
        rotulo: "Paleta de cores preferida",
        tipo: "multipla",
        max: 2,
        opcoes: [
          "Neutros (bege, off white, cinza)",
          "Terrosos (terra, cobre, mostarda)",
          "Frios (azul, verde, lilás)",
          "Vibrantes (laranja, vermelho, pink)",
          "Escuros (preto, verde escuro, vinho)",
          "Pastéis",
        ],
      },
      { id: "cor_proibida", rotulo: "Alguma cor que não pode ser usada?", tipo: "texto" },
      {
        id: "estilo",
        rotulo: "Estilo visual desejado",
        tipo: "escolha",
        opcoes: ["Clean e minimalista", "Orgânico e natural", "Editorial e sofisticado", "Colorido e expressivo", "Retrô", "Tecnológico"],
      },
    ],
  },
  {
    id: "voz",
    titulo: "Tom de voz",
    descricao: "Como a marca fala com o público.",
    perguntas: [
      {
        id: "tom",
        rotulo: "Tom da comunicação escrita",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Formal e profissional", "Descontraído e próximo", "Motivacional", "Informativo e educativo", "Bem-humorado"],
      },
      { id: "tratamento", rotulo: "Como a marca chama o cliente?", tipo: "escolha", opcoes: ["Você", "Tu", "Senhor ou senhora", "Pelo nome"] },
      { id: "palavras_usa", rotulo: "Palavras e expressões que a marca usa", tipo: "texto_longo" },
      { id: "palavras_evita", rotulo: "Palavras ou assuntos que a marca evita", tipo: "texto_longo" },
      { id: "emojis", rotulo: "Uso de emojis", tipo: "escolha", opcoes: ["Pode usar à vontade", "Com moderação", "Não usar"] },
    ],
  },
  {
    id: "redes",
    titulo: "Redes sociais e conteúdo",
    descricao: "Onde vamos atuar e o que vamos publicar.",
    perguntas: [
      {
        id: "quais",
        rotulo: "Quais redes vamos trabalhar?",
        tipo: "multipla",
        obrigatoria: true,
        opcoes: ["Instagram", "TikTok", "Facebook", "LinkedIn", "YouTube", "Pinterest", "Status do WhatsApp"],
      },
      { id: "perfil_instagram", rotulo: "@ do Instagram", tipo: "texto", mostrarSe: { pergunta: "redes.quais", valores: ["Instagram"] } },
      {
        id: "formatos",
        rotulo: "Formatos prioritários",
        tipo: "multipla",
        opcoes: ["Posts de feed", "Stories", "Reels e vídeos curtos", "Carrossel", "Destaques do perfil", "Anúncios"],
      },
      {
        id: "frequencia",
        rotulo: "Frequência de postagem que você imagina",
        tipo: "escolha",
        opcoes: ["3 vezes por semana", "5 vezes por semana", "Todo dia", "A definir com a agência"],
      },
      { id: "aparece", rotulo: "Você aparece nos vídeos?", tipo: "escolha", opcoes: ["Sim, gosto de aparecer", "Apareço se precisar", "Prefiro não aparecer"] },
    ],
  },
  {
    id: "objetivos",
    titulo: "Objetivos e metas",
    descricao: "O que conta como sucesso para você.",
    perguntas: [
      {
        id: "principal",
        rotulo: "Objetivo principal nas redes",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Vender mais", "Atrair novos seguidores", "Autoridade e reconhecimento", "Engajar a comunidade", "Levar tráfego para o site ou a loja"],
      },
      { id: "tres_meses", rotulo: "Onde você quer estar daqui a 3 meses?", tipo: "texto_longo", obrigatoria: true },
      { id: "numeros", rotulo: "Algum número que você acompanha hoje?", dica: "Seguidores, vendas pelo Instagram, mensagens por semana.", tipo: "texto_longo" },
      { id: "datas", rotulo: "Datas importantes do ano para o seu negócio", dica: "Lançamentos, sazonalidade, aniversário da marca.", tipo: "texto_longo" },
    ],
  },
  {
    id: "materiais",
    titulo: "Materiais e captação",
    descricao: "Fotos, vídeos e onde gravar.",
    perguntas: [
      {
        id: "fornece",
        rotulo: "Vai fornecer fotos e vídeos próprios?",
        tipo: "escolha",
        obrigatoria: true,
        opcoes: ["Sim, tenho material próprio", "Tenho algum material", "Não, vamos produzir juntos"],
      },
      {
        id: "fotos",
        rotulo: "Envie algumas fotos que representem a marca",
        dica: "Até 50 MB por arquivo. Vídeos grandes você manda depois na área de arquivos.",
        tipo: "arquivo",
        aceita: "image/png,image/jpeg,image/webp,video/mp4,video/quicktime",
        mostrarSe: { pergunta: "materiais.fornece", valores: ["Sim, tenho material próprio", "Tenho algum material"] },
      },
      {
        id: "local_captacao",
        rotulo: "Onde as captações podem acontecer?",
        dica: "Endereço da loja, escritório ou espaço.",
        tipo: "texto_longo",
      },
      {
        id: "dias_captacao",
        rotulo: "Melhores dias para captação",
        tipo: "multipla",
        opcoes: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
      },
    ],
  },
  {
    id: "combinados",
    titulo: "Combinados",
    descricao: "Últimos detalhes para começar bem.",
    perguntas: [
      {
        id: "aprovacao",
        rotulo: "Quem aprova os conteúdos?",
        dica: "Nome e função. Se forem duas pessoas, diga quem dá a palavra final.",
        tipo: "texto",
        obrigatoria: true,
      },
      { id: "prazo_aprovacao", rotulo: "Em quanto tempo você consegue aprovar um conteúdo?", tipo: "escolha", opcoes: ["No mesmo dia", "Em até 24 horas", "Em até 48 horas"] },
      { id: "experiencia", rotulo: "Já trabalhou com agência antes? O que funcionou e o que não funcionou?", tipo: "texto_longo" },
      { id: "adicional", rotulo: "Algo mais que a gente precisa saber?", tipo: "texto_longo" },
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
