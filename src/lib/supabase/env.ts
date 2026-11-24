function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}. Veja o .env.example.`);
  return valor;
}

export const SUPABASE_URL = () =>
  obrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = () =>
  obrigatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const SUPABASE_SERVICE_ROLE_KEY = () =>
  obrigatoria("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
// Na demonstração os links ficam relativos ao endereço em que o site estiver.
export const SITE_URL = () =>
  process.env.NEXT_PUBLIC_DEMO === "1" ? "" : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
