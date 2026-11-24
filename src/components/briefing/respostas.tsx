import { Paperclip } from "lucide-react";
import { SECOES, respondida, visivel, type Respostas } from "@/lib/briefing/perguntas";
import { Vazio } from "@/components/ui/cartao";

/** Respostas do briefing, por seção, em blocos que abrem e fecham. */
export function BriefingRespostas({
  respostas,
  puladas,
  linkArquivo,
}: {
  respostas: Respostas;
  puladas: string[];
  linkArquivo: Map<string, { nome: string; url?: string | null }>;
}) {
  return (
    <>
        {Object.keys(respostas).length === 0 ? (
        <Vazio titulo="Briefing ainda não começou" texto="As respostas aparecem aqui assim que o cliente começar a preencher." />
      ) : (
        <div className="flex flex-col gap-3">
          {SECOES.map((s, i) => {
            const perguntas = s.perguntas.filter((p) => visivel(p, respostas));
            const feitas = perguntas.filter((p) => respondida(respostas[`${s.id}.${p.id}`])).length;
            return (
              <details key={s.id} className="group rounded-lg border border-line bg-card" open={i === 0}>
                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-5 py-3">
                  <span className="flex items-baseline gap-3">
                    <span aria-hidden className="num-secao text-2xl">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-medium text-text">{s.titulo}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {feitas} de {perguntas.length}
                  </span>
                </summary>
                <dl className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2">
                  {perguntas.map((p) => {
                    const chave = `${s.id}.${p.id}`;
                    const v = respostas[chave];
                    return (
                      <div key={chave} className="min-w-0">
                        <dt className="text-xs font-medium text-muted">{p.rotulo}</dt>
                        <dd className="mt-0.5 text-sm break-words whitespace-pre-wrap text-text">
                          {puladas.includes(chave) ? (
                            <span className="text-muted italic">Cliente vai responder depois</span>
                          ) : !respondida(v) ? (
                            <span className="text-muted">Sem resposta</span>
                          ) : p.tipo === "arquivo" ? (
                            <ul className="flex flex-col gap-1">
                              {(v as string[]).map((aid) => {
                                const a = linkArquivo.get(aid);
                                return (
                                  <li key={aid}>
                                    {a?.url ? (
                                      <a href={a.url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 text-brown underline underline-offset-2">
                                        <Paperclip aria-hidden className="size-3.5" /> {a.nome}
                                      </a>
                                    ) : (
                                      "Arquivo indisponível"
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : p.tipo === "url" ? (
                            <a href={String(v)} target="_blank" rel="noopener noreferrer" className="text-brown underline underline-offset-2">
                              {String(v)}
                            </a>
                          ) : Array.isArray(v) ? (
                            v.join(", ")
                          ) : (
                            String(v)
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
