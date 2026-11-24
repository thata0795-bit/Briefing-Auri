import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { caminhoSeguro } from "@/lib/redirecionamento";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const TIPOS: EmailOtpType[] = ["email", "magiclink", "invite", "recovery", "signup", "email_change"];

/** Recebe o link do e-mail (token_hash) e abre a sessão. Funciona em outro aparelho. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;

  const destino = request.nextUrl.clone();
  destino.search = "";
  const falhou = () => {
    destino.pathname = "/entrar";
    destino.searchParams.set("erro", "link");
    return NextResponse.redirect(destino);
  };

  if (!tokenHash || !tipo || !TIPOS.includes(tipo)) return falhou();

  destino.pathname = tipo === "recovery" ? "/conta/senha" : caminhoSeguro(url.searchParams.get("next"));
  const resposta = NextResponse.redirect(destino);

  // Os cookies da sessão vão direto na resposta do redirecionamento.
  const supabase = createServerClient(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options)),
    },
  });

  const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
  if (error) return falhou();
  return resposta;
}
