import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_USUARIO, DEMO } from "@/lib/demo/config";
import { PERFIS_DEMO } from "@/lib/demo/dados";

/** Demonstração: entra com o perfil escolhido, sem senha. */
export async function POST(request: NextRequest) {
  if (!DEMO) return new NextResponse(null, { status: 404 });
  const usuario = String((await request.formData()).get("usuario") ?? "");
  const destino = request.nextUrl.clone();
  destino.search = "";
  if (!PERFIS_DEMO.some((p) => p.id === usuario)) {
    destino.pathname = "/entrar";
    return NextResponse.redirect(destino, { status: 303 });
  }
  destino.pathname = "/inicio";
  const r = NextResponse.redirect(destino, { status: 303 });
  r.cookies.set(COOKIE_USUARIO, usuario, { httpOnly: true, sameSite: "lax", path: "/", secure: request.nextUrl.protocol === "https:" });
  return r;
}
