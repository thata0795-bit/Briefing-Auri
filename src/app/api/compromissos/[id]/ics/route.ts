import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { gerarIcs } from "@/lib/agenda";

/** Baixa o compromisso como .ics. O RLS garante que só quem vê o cliente consegue. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const supabase = await criarClienteServidor();
  const { data: c } = await supabase
    .from("compromissos")
    .select("id, titulo, descricao, inicio, fim, local, link, agencia_id")
    .eq("id", id)
    .maybeSingle();
  if (!c) return new NextResponse(null, { status: 404 });
  const { data: ag } = await supabase.from("agencias").select("nome").eq("id", c.agencia_id).maybeSingle();
  const agencia = ag?.nome ?? "Agência";
  return new NextResponse(gerarIcs(c, agencia), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${c.titulo.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase()}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
