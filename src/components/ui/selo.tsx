import { CircleCheck, CircleDashed, CirclePause, CircleX, Mail } from "lucide-react";
import type { StatusCliente } from "@/lib/tipos";
import { ROTULO_STATUS_CLIENTE } from "@/lib/tipos";

const estilo: Record<StatusCliente, { classe: string; Icone: typeof Mail }> = {
  convidado: { classe: "border-st-todo bg-st-todo/40", Icone: Mail },
  onboarding: { classe: "border-st-doing bg-st-doing/15", Icone: CircleDashed },
  ativo: { classe: "border-st-done bg-st-done/12", Icone: CircleCheck },
  pausado: { classe: "border-st-sched bg-st-sched/10", Icone: CirclePause },
  encerrado: { classe: "border-line bg-soft", Icone: CircleX },
};

/** Selo de status: cor, ícone e texto juntos (a cor nunca é o único sinal). */
export function SeloStatusCliente({ status }: { status: StatusCliente }) {
  const { classe, Icone } = estilo[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium text-text ${classe}`}>
      <Icone aria-hidden className="size-3.5" />
      {ROTULO_STATUS_CLIENTE[status]}
    </span>
  );
}
