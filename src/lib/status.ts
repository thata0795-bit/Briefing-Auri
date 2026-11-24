export type StatusItem =
  | "a_fazer"
  | "em_andamento"
  | "aguardando_aprovacao"
  | "ajuste_solicitado"
  | "aprovado"
  | "programado"
  | "concluido"
  | "atrasado";

export const ROTULO_STATUS: Record<StatusItem, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  aguardando_aprovacao: "Aguardando aprovação",
  ajuste_solicitado: "Ajuste solicitado",
  aprovado: "Aprovado",
  programado: "Programado",
  concluido: "Concluído",
  atrasado: "Atrasado",
};
