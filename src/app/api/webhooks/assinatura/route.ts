import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { webhookValido } from "@/lib/contratos/assinatura";
import { criarClienteAdmin } from "@/lib/supabase/admin";

const Evento = z.object({
  evento: z.enum(["assinado", "recusado"]),
  ref: z.string().min(4).max(200),
  assinado_por: z.string().max(200).optional(),
});

/**
 * Webhook da ferramenta de assinatura. Sem assinatura HMAC válida no cabeçalho
 * x-assinatura-hmac, a chamada é ignorada. Quando a Autentique ou a ZapSign
 * forem integradas, cada uma traduz o próprio formato para este evento.
 */
export async function POST(request: NextRequest) {
  const corpo = await request.text();
  if (corpo.length > 20000 || !webhookValido(corpo, request.headers.get("x-assinatura-hmac"))) {
    return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  }

  let evento: z.infer<typeof Evento>;
  try {
    evento = Evento.parse(JSON.parse(corpo));
  } catch {
    return NextResponse.json({ erro: "formato inválido" }, { status: 400 });
  }

  const admin = criarClienteAdmin();
  const { data: contrato } = await admin.from("contratos").select("id, status").eq("provedor_ref", evento.ref).maybeSingle();
  if (!contrato) return NextResponse.json({ erro: "contrato não encontrado" }, { status: 404 });

  if (evento.evento === "assinado") {
    const { error } = await admin.rpc("confirmar_assinatura_contrato", {
      p_contrato: contrato.id,
      p_assinado_por: evento.assinado_por ?? "",
      p_origem: "webhook",
    });
    if (error) {
      console.error("[webhook assinatura]", error);
      return NextResponse.json({ erro: "falha ao registrar" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
