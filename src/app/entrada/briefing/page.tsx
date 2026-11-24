import type { Metadata } from "next";
import { exigirEtapaLiberada } from "@/lib/entrada";
import { FormularioBriefing } from "@/components/entrada/formulario-briefing";

export const metadata: Metadata = { title: "Briefing" };

export default async function Briefing() {
  const { supabase, cliente, estados } = await exigirEtapaLiberada("briefing");
  const [{ data: briefing, error }, { data: arquivos }] = await Promise.all([
    supabase.from("briefings").select("respostas, puladas, concluido_em").eq("cliente_id", cliente.id).single(),
    supabase.from("arquivos").select("id, nome").eq("cliente_id", cliente.id).eq("pasta", "briefing"),
  ]);
  if (error) throw error;
  const concluida = estados.find((e) => e.etapa === "briefing")?.status === "concluido";

  return (
    <div>
      <span aria-hidden className="num-secao text-7xl">04</span>
      <h1 className="mt-2 text-4xl">Briefing</h1>
      <p className="mt-3 max-w-2xl text-base text-text">
        São 10 partes curtas. Cada resposta salva sozinha: pode fechar e voltar quando quiser. Se não souber algo agora, toque em
        &ldquo;Responder depois&rdquo;.
      </p>
      <FormularioBriefing
        clienteId={cliente.id}
        agenciaId={cliente.agencia_id}
        respostasIniciais={(briefing.respostas ?? {}) as Record<string, unknown>}
        puladasIniciais={briefing.puladas ?? []}
        arquivosIniciais={Object.fromEntries((arquivos ?? []).map((a) => [a.id, a.nome]))}
        concluida={concluida}
      />
    </div>
  );
}
