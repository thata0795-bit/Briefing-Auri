/** Texto padrão do Manual da Parceria, usado enquanto a agência não escreve o dela. */
export const MANUAL_PADRAO = `## Comunicação
- O chat do portal é o canal oficial com a agência. Respondemos em dias úteis, das 9h às 18h, em até 1 dia útil.
- Assuntos urgentes no dia de uma captação podem ser tratados por telefone com o responsável.

## Prazos e aprovações
- Os conteúdos do mês ficam disponíveis para aprovação com pelo menos 3 dias de antecedência.
- Pedimos a resposta em até 48 horas. Sem resposta, o post é reprogramado para não sair sem a sua aprovação.

## Materiais e captações
- Fotos, vídeos e informações para campanhas devem chegar com 5 dias úteis de antecedência.
- Captações são marcadas no portal e você recebe o lembrete dois dias antes.

## Escopo
- O que está incluso no plano aparece no seu contrato.
- Pedidos fora do pacote são feitos pelo portal e recebem prazo e orçamento antes de começar.`;

export type BlocoManual = { titulo: string; itens: string[]; paragrafos: string[] };

/** Lê o texto simples do manual: "## Título" abre um bloco, "- item" vira lista. */
export function lerManual(texto: string | null | undefined): BlocoManual[] {
  const blocos: BlocoManual[] = [];
  let atual: BlocoManual | null = null;
  for (const bruta of (texto || MANUAL_PADRAO).split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha) continue;
    if (linha.startsWith("## ")) {
      atual = { titulo: linha.slice(3).trim(), itens: [], paragrafos: [] };
      blocos.push(atual);
      continue;
    }
    if (!atual) {
      atual = { titulo: "", itens: [], paragrafos: [] };
      blocos.push(atual);
    }
    if (linha.startsWith("- ")) atual.itens.push(linha.slice(2).trim());
    else atual.paragrafos.push(linha);
  }
  return blocos;
}
