import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { COOKIE_SESSAO, COOKIE_USUARIO, DEMO } from "@/lib/demo/config";

const ROTAS_PUBLICAS = ["/entrar", "/auth", "/privacidade", "/termos", "/convite", "/api/webhooks", "/assinatura-simulada"];

export async function atualizarSessao(request: NextRequest) {
  if (DEMO) return sessaoDemo(request);
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const publica = ROTAS_PUBLICAS.some((r) => caminho === r || caminho.startsWith(`${r}/`));

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    if (caminho !== "/") url.searchParams.set("voltar", caminho);
    return NextResponse.redirect(url);
  }

  // Verificação em duas etapas: quem tem fator cadastrado precisa confirmar o código.
  if (user && !caminho.startsWith("/entrar/verificacao") && !caminho.startsWith("/auth")) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar/verificacao";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (user && caminho === "/entrar") {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return resposta;
}

/** Demonstração: cada visitante ganha uma sessão própria; o login é a escolha de um perfil. */
function sessaoDemo(request: NextRequest) {
  const novaSessao = request.cookies.get(COOKIE_SESSAO)?.value ? null : crypto.randomUUID();
  if (novaSessao) request.cookies.set(COOKIE_SESSAO, novaSessao);
  const usuario = request.cookies.get(COOKIE_USUARIO)?.value;
  const caminho = request.nextUrl.pathname;
  const publica = ROTAS_PUBLICAS.some((r) => caminho === r || caminho.startsWith(`${r}/`)) || caminho.startsWith("/demo");

  let resposta: NextResponse;
  if (!usuario && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    resposta = NextResponse.redirect(url);
  } else if (usuario && caminho === "/entrar") {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    resposta = NextResponse.redirect(url);
  } else {
    resposta = NextResponse.next({ request });
  }
  if (novaSessao) {
    resposta.cookies.set(COOKIE_SESSAO, novaSessao, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: request.nextUrl.protocol === "https:" });
  }
  return resposta;
}
