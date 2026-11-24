import type { ReactNode } from "react";
import { CalendarClock, Check, CircleAlert, CircleDashed, Circle, Eye, PenLine, ThumbsUp } from "lucide-react";
import { ROTULO_STATUS, type StatusItem } from "@/lib/status";

/** Cores da seção 8. Classes completas para o Tailwind encontrar. */
const VISUAL: Record<StatusItem, { borda: string; fundo: string; ponto: string; Icone: typeof Check }> = {
  a_fazer: { borda: "border-st-todo", fundo: "bg-st-todo/35", ponto: "bg-st-todo", Icone: Circle },
  em_andamento: { borda: "border-st-doing", fundo: "bg-st-doing/15", ponto: "bg-st-doing", Icone: CircleDashed },
  aguardando_aprovacao: { borda: "border-st-review", fundo: "bg-st-review/12", ponto: "bg-st-review", Icone: Eye },
  ajuste_solicitado: { borda: "border-st-fix", fundo: "bg-st-fix/12", ponto: "bg-st-fix", Icone: PenLine },
  aprovado: { borda: "border-st-ok", fundo: "bg-st-ok/20", ponto: "bg-st-ok", Icone: ThumbsUp },
  programado: { borda: "border-st-sched", fundo: "bg-st-sched/12", ponto: "bg-st-sched", Icone: CalendarClock },
  concluido: { borda: "border-st-done", fundo: "bg-st-done/12", ponto: "bg-st-done", Icone: Check },
  atrasado: { borda: "border-st-late", fundo: "bg-st-late/10", ponto: "bg-st-late", Icone: CircleAlert },
};

/** Selo de status: cor, ícone e texto juntos. */
export function SeloStatus({ status, rotulo }: { status: StatusItem; rotulo?: string }) {
  const { borda, fundo, Icone } = VISUAL[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium whitespace-nowrap text-text ${borda} ${fundo}`}>
      <Icone aria-hidden className="size-3.5" />
      {rotulo ?? ROTULO_STATUS[status]}
    </span>
  );
}

/**
 * Cartão que muda de cor conforme o status. Concluído ganha o tom oliva suave,
 * check e texto levemente esmaecido. Transição de 200 ms.
 */
export function CartaoStatus({ status, children, className = "" }: { status: StatusItem; children: ReactNode; className?: string }) {
  const { borda } = VISUAL[status];
  const concluido = status === "concluido";
  return (
    <div
      data-status={status}
      className={`relative rounded-lg border border-l-4 transition-[background-color,border-color,opacity] duration-200 ${borda} ${
        concluido ? "bg-st-done/10 [&_.texto-status]:opacity-75" : "bg-card"
      } ${className}`}
    >
      {children}
    </div>
  );
}
