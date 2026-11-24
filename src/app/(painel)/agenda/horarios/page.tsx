import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { chaveDia, diaSemana, hora } from "@/lib/agenda";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { FormHorario } from "@/components/agencia/form-horario";
import { removerHorario } from "../acoes";

export const metadata: Metadata = { title: "Horários livres" };

export default async function Horarios() {
  const sessao = await exigirPapel("admin", "equipe");
  const supabase = await criarClienteServidor();
  const [{ data: horarios }, { data: pessoas }] = await Promise.all([
    supabase
      .from("horarios_livres")
      .select("id, inicio, fim, formato, local, cliente:clientes(nome), responsavel:perfis!horarios_livres_responsavel_id_fkey(nome)")
      .gt("inicio", new Date().toISOString())
      .order("inicio")
      .limit(200),
    supabase.from("perfis").select("id, nome").in("papel", ["admin", "equipe"]).eq("ativo", true).order("nome"),
  ]);

  const dias = new Map<string, { titulo: string; itens: NonNullable<typeof horarios> }>();
  for (const h of horarios ?? []) {
    const k = chaveDia(h.inicio);
    if (!dias.has(k)) dias.set(k, { titulo: diaSemana(h.inicio), itens: [] });
    dias.get(k)!.itens.push(h);
  }

  return (
    <>
      <CabecalhoPagina numero="05" titulo="Horários livres" texto="Horários que os clientes novos podem escolher para a primeira reunião. Horário de Brasília." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Cartao titulo="Abrir horário">
          <FormHorario pessoas={pessoas ?? []} eu={sessao.userId} />
        </Cartao>
        <Cartao titulo="Próximos horários">
          {dias.size === 0 ? (
            <Vazio titulo="Nenhum horário aberto" texto="Abra alguns horários para os clientes novos conseguirem marcar a primeira reunião." />
          ) : (
            <div className="flex flex-col gap-5">
              {[...dias.values()].map((d) => (
                <div key={d.titulo}>
                  <p className="font-serif text-lg text-brown-dark">{d.titulo}</p>
                  <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                    {d.itens.map((h) => {
                      const cliente = (h.cliente as unknown as { nome: string } | null)?.nome;
                      const resp = (h.responsavel as unknown as { nome: string } | null)?.nome;
                      return (
                        <li key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0 text-sm">
                            <p className="text-text">
                              {hora(h.inicio)} às {hora(h.fim)} · {h.formato === "online" ? "Online" : "Presencial"}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {resp}
                              {cliente ? ` · Reservado por ${cliente}` : " · Livre"}
                            </p>
                          </div>
                          {!cliente && (
                            <form action={removerHorario}>
                              <input type="hidden" name="id" value={h.id} />
                              <button type="submit" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-danger">
                                <Trash2 aria-hidden className="size-4" />
                                <span className="sr-only">Remover horário das {hora(h.inicio)}</span>
                              </button>
                            </form>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Cartao>
      </div>
    </>
  );
}
