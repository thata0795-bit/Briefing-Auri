export type Papel = "admin" | "equipe" | "cliente";
export type FuncaoEquipe = "social_media" | "designer" | "captador" | "gestor" | "outro";
export type StatusCliente = "convidado" | "onboarding" | "ativo" | "pausado" | "encerrado";

export type Perfil = {
  id: string;
  agencia_id: string;
  papel: Papel;
  funcao: FuncaoEquipe | null;
  nome: string;
  email: string;
  ativo: boolean;
};

export type MarcaAgencia = {
  logo_url?: string;
  monograma_url?: string;
  cores?: Partial<Record<"bg" | "card" | "soft" | "brown" | "brown-dark" | "brown-mid" | "gold" | "gold-light" | "text" | "muted" | "line", string>>;
};

export type Agencia = {
  id: string;
  nome: string;
  slug: string;
  marca: MarcaAgencia;
  email_contato: string | null;
  telefone: string | null;
};

export const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Admin",
  equipe: "Equipe",
  cliente: "Cliente",
};

export const ROTULO_FUNCAO: Record<FuncaoEquipe, string> = {
  social_media: "Social media",
  designer: "Designer",
  captador: "Captação",
  gestor: "Gestão",
  outro: "Equipe",
};

export const ROTULO_STATUS_CLIENTE: Record<StatusCliente, string> = {
  convidado: "Convidado",
  onboarding: "Em entrada",
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};
