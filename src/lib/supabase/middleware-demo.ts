import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_USUARIO } from "@/lib/demo/config";

/**
 * Demonstração: sem cookie de acesso, vai para a entrada. A assinatura do cookie
 * é conferida no servidor (que guarda o segredo); cookie inválido cai na entrada lá.
 */
export function sessaoDemo(request: NextRequest, rotasPublicas: string[]) {
  const temAcesso = !!request.cookies.get(COOKIE_USUARIO)?.value;
  const caminho = request.nextUrl.pathname;
  const publica = rotasPublicas.some((r) => caminho === r || caminho.startsWith(`${r}/`)) || caminho.startsWith("/demo");
  if (!temAcesso && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request });
}
