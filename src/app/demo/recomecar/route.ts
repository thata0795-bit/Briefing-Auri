import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, COOKIE_USUARIO, DEMO } from "@/lib/demo/config";
import { recomecarBanco } from "@/lib/demo/armazenamento";

/** Demonstração: volta os dados fictícios ao início e sai do perfil. */
export async function POST(request: NextRequest) {
  if (!DEMO) return new NextResponse(null, { status: 404 });
  const sessao = request.cookies.get(COOKIE_SESSAO)?.value;
  if (sessao) await recomecarBanco(sessao);
  const destino = request.nextUrl.clone();
  destino.pathname = "/entrar";
  destino.search = "";
  const r = NextResponse.redirect(destino, { status: 303 });
  r.cookies.delete(COOKIE_USUARIO);
  return r;
}
