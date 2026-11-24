import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_USUARIO, DEMO } from "@/lib/demo/config";
import { SENHAS_DEMO } from "@/lib/demo/dados";
import { assinarUsuario } from "@/lib/demo/assinatura-cookie";
import { carregarBanco } from "@/lib/demo/armazenamento";

/** Demonstração: entrada com e-mail e senha próprios de cada pessoa. */
export async function POST(request: NextRequest) {
  if (!DEMO) return new NextResponse(null, { status: 404 });
  const dados = await request.formData();
  const email = String(dados.get("email") ?? "").trim().toLowerCase();
  const senha = String(dados.get("senha") ?? "").trim();
  const destino = request.nextUrl.clone();
  destino.search = "";

  const esperado = SENHAS_DEMO[email];
  const recebido = createHash("sha256").update(`${email}:${senha}`).digest("hex");
  const db = esperado && esperado === recebido ? await carregarBanco() : null;
  const usuario = db?.usuarios.find((u) => u.email === email);
  const perfil = usuario && db?.tabelas.perfis.find((p) => p.id === usuario.id && p.ativo);

  if (!perfil) {
    // Pequena espera para dificultar tentativas em sequência.
    await new Promise((r) => setTimeout(r, 600));
    destino.pathname = "/entrar";
    destino.searchParams.set("erro", "senha");
    return NextResponse.redirect(destino, { status: 303 });
  }

  destino.pathname = "/inicio";
  const r = NextResponse.redirect(destino, { status: 303 });
  r.cookies.set(COOKIE_USUARIO, await assinarUsuario(perfil.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: request.nextUrl.protocol === "https:",
  });
  return r;
}
