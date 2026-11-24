import type { Comentario } from "@/lib/conteudos";
import { dataCurta } from "@/lib/datas";
import { hora } from "@/lib/agenda";

const ROTULO: Record<Comentario["tipo"], string> = {
  comentario: "Comentário",
  ajuste: "Pedido de ajuste",
  aprovacao: "Aprovação",
  reenvio: "Reenviado",
};

const COR: Record<Comentario["tipo"], string> = {
  comentario: "border-line bg-bg",
  ajuste: "border-st-fix/50 bg-st-fix/8",
  aprovacao: "border-st-done/50 bg-st-done/8",
  reenvio: "border-st-review/50 bg-st-review/8",
};

export function Historico({ comentarios }: { comentarios: Comentario[] }) {
  if (comentarios.length === 0) return <p className="text-sm text-muted">Nenhum comentário ainda.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {comentarios.map((c) => (
        <li key={c.id} className={`rounded-md border px-3 py-2 ${COR[c.tipo]}`}>
          <p className="text-xs text-muted">
            <strong className="font-semibold text-text">{c.autor?.nome ?? "Alguém"}</strong>
            {c.autor?.papel === "cliente" ? " · cliente" : c.autor ? " · agência" : ""} · {ROTULO[c.tipo]} · {dataCurta(c.criado_em)}, {hora(c.criado_em)}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-text">{c.texto}</p>
        </li>
      ))}
    </ol>
  );
}
