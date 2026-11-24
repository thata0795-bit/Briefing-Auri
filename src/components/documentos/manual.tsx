import { lerManual } from "@/lib/manual";

/** Manual da Parceria em blocos com título e lista. Texto simples, sem HTML do banco. */
export function Manual({ texto }: { texto: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-6">
      {lerManual(texto).map((b, i) => (
        <section key={i} className="flex flex-col gap-2">
          {b.titulo && <h3 className="text-xl">{b.titulo}</h3>}
          {b.paragrafos.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed text-text">{p}</p>
          ))}
          {b.itens.length > 0 && (
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-text">
              {b.itens.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
