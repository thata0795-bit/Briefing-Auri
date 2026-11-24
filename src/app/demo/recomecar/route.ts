import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_USUARIO, DEMO } from "@/lib/demo/config";
import { carregarBanco, recomecarBanco } from "@/lib/demo/armazenamento";
import { lerUsuarioAssinado } from "@/lib/demo/assinatura-cookie";

/** Demonstração: só a dona da agência volta os dados ao início. */
export async function POST(request: NextRequest) {
  if (!DEMO) return new NextResponse(null, { status: 404 });
  const origem = request.headers.get("origin");
  if (origem && new URL(origem).host !== request.nextUrl.host) return new NextResponse(null, { status: 403 });
  const uid = await lerUsuarioAssinado(request.cookies.get(COOKIE_USUARIO)?.value);
  const db = uid ? await carregarBanco() : null;
  const perfil = db?.tabelas.perfis.find((p) => p.id === uid);
  if (perfil?.papel !== "admin") return new NextResponse(null, { status: 403 });
  await recomecarBanco();
  const destino = request.nextUrl.clone();
  destino.pathname = "/inicio";
  destino.search = "?recomecado=1";
  return NextResponse.redirect(destino, { status: 303 });
}
