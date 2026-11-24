import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { provedorSimuladoAtivo } from "@/lib/contratos/assinatura";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { assinarSimulado } from "./acoes";

export const metadata: Metadata = { title: "Assinatura (simulação)" };

/** Tela que faz o papel da Autentique ou ZapSign enquanto nenhuma é integrada. Só existe fora de produção. */
export default async function AssinaturaSimulada({ params }: { params: Promise<{ ref: string }> }) {
  if (!provedorSimuladoAtivo()) notFound();
  const { ref } = await params;
  const { data: contrato } = await criarClienteAdmin()
    .from("contratos")
    .select("titulo, conteudo, status")
    .eq("provedor_ref", ref)
    .maybeSingle();
  if (!contrato) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <p className="rounded-md border border-st-doing bg-st-doing/15 px-4 py-3 text-sm text-text">
        Ambiente de teste. Esta tela simula a ferramenta de assinatura eletrônica.
      </p>
      <h1 className="mt-6 text-3xl">{contrato.titulo}</h1>
      <pre className="mt-6 max-h-[50vh] overflow-auto rounded-md border border-line bg-card p-5 font-sans text-sm whitespace-pre-wrap text-text">
        {contrato.conteudo}
      </pre>
      {contrato.status === "assinado" ? (
        <p className="mt-6 text-sm text-success">Contrato assinado.</p>
      ) : (
        <form action={assinarSimulado} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="ref" value={ref} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
            Nome completo de quem assina
            <input name="nome" required minLength={3} className="min-h-11 rounded-md border border-line bg-bg px-3 text-base" />
          </label>
          <BotaoEnviar textoEnviando="Assinando...">Assinar contrato</BotaoEnviar>
        </form>
      )}
    </main>
  );
}
