export type TipoAcesso = "instagram" | "meta_business" | "google_meu_negocio" | "dominio";
export type StatusAcesso = "pendente" | "liberado" | "nao_tenho" | "ajuda" | "confirmado";

/** Instruções curtas. Nenhuma pede senha: o acesso é sempre por convite. */
export const ACESSOS: { tipo: TipoAcesso; titulo: string; passos: string[] }[] = [
  {
    tipo: "instagram",
    titulo: "Instagram",
    passos: [
      "Confira se o perfil está como conta profissional (Configurações, Tipo de conta e ferramentas).",
      "Ligue o Instagram a uma página do Facebook, se ainda não estiver ligado.",
      "O acesso da agência entra pelo Meta Business, no item abaixo. Não envie a senha do Instagram.",
    ],
  },
  {
    tipo: "meta_business",
    titulo: "Meta Business (Facebook e Instagram)",
    passos: [
      "Abra business.facebook.com e entre em Configurações do negócio.",
      "Em Usuários, Parceiros, toque em Adicionar e informe o ID do portfólio da agência (a agência envia esse número).",
      "Marque acesso à página do Facebook e à conta do Instagram, com permissão de conteúdo, mensagens e anúncios.",
    ],
  },
  {
    tipo: "google_meu_negocio",
    titulo: "Perfil da Empresa no Google",
    passos: [
      "No Google, pesquise o nome da sua empresa e abra o painel do seu perfil.",
      "Toque nos três pontos, Configurações do perfil, Pessoas e acesso.",
      "Adicione o e-mail da agência como Gerente.",
    ],
  },
  {
    tipo: "dominio",
    titulo: "Domínio do site",
    passos: [
      "Conte onde o domínio está registrado (Registro.br, GoDaddy, Hostinger ou outro) no campo de observação.",
      "Não envie senha por aqui. Se a agência precisar mexer no domínio, combinamos o acesso com você na primeira reunião.",
    ],
  },
];

export const ROTULO_ACESSO: Record<StatusAcesso, string> = {
  pendente: "Pendente",
  liberado: "Liberado",
  nao_tenho: "Não tenho",
  ajuda: "Preciso de ajuda",
  confirmado: "Confirmado pela agência",
};
