import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Só aceita o pedido vindo do próprio site.
  const origem = request.headers.get("origin");
  if (origem && new URL(origem).host !== request.nextUrl.host) {
    return new NextResponse(null, { status: 403 });
  }
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  const url = request.nextUrl.clone();
  url.pathname = "/entrar";
  url.search = "";
  return NextResponse.redirect(url, { status: 303 });
}
