import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { clienteDaPagina } from "@/lib/cliente-da-pagina";
import { deslocarMes, mesDe, nomeDoMes } from "@/lib/conteudos";
import { dataCurta } from "@/lib/datas";
import {
  COLUNAS_RELATORIO,
  METRICAS,
  TEXTOS,
  engajamento,
  mesCurto,
  mesesEntre,
  numero,
  porcentagem,
  variacao,
  type Relatorio,
} from "@/lib/relatorios";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeletorCliente } from "@/components/conteudos/seletor-cliente";
import { GraficoEvolucao } from "@/components/relatorios/grafico";
import { FormRelatorio } from "@/components/relatorios/form-relatorio";

export const metadata: Metadata = { title: "Relatórios" };

function Variacao({ valor, sufixo = "sobre o mês anterior" }: { valor: number | null; sufixo?: string }) {
  if (valor == null) return null;
  const Icone = valor > 0.05 ? ArrowUpRight : valor < -0.05 ? ArrowDownRight : Minus;
  const sinal = valor > 0 ? "+" : "";
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
      <Icone aria-hidden className="size-3.5 shrink-0 text-brown" />
      <span>
        <span className="font-semibold text-text tabular-nums">{sinal}{valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span> {sufixo}
      </span>
    </p>
  );
}

function Destaque({ rotulo, valor, children }: { rotulo: string; valor: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <p className="text-xs font-semibold tracking-[0.1em] text-muted uppercase">{rotulo}</p>
      <p className="mt-1 font-serif text-3xl leading-none text-brown-dark tabular-nums lining-nums sm:text-4xl">{valor}</p>
      {children}
    </div>
  );
}

const soma = (lista: Relatorio[], campo: "alcance" | "interacoes" | "publicacoes") => lista.reduce((t, r) => t + (r[campo] ?? 0), 0);

export default async function RelatoriosPagina({ searchParams }: { searchParams: Promise<{ mes?: string; cliente?: string }> }) {
  const sessao = await obterSessao();
  const { mes: mesParam, cliente: clienteParam } = await searchParams;
  const { cliente, clientes, agencia, supabase } = await clienteDaPagina(sessao, clienteParam);
  if (!cliente) return <Vazio titulo="Nenhum cliente por aqui" />;

  const [{ data: dados }, { data: ficha }] = await Promise.all([
    supabase.from("relatorios").select(COLUNAS_RELATORIO).eq("cliente_id", cliente.id).order("mes"),
    supabase.from("clientes").select("criado_em").eq("id", cliente.id).maybeSingle(),
  ]);
  const todos = (dados ?? []) as unknown as Relatorio[];
  // O cliente só recebe do banco o que foi publicado; a agência vê também os rascunhos.
  const publicados = todos.filter((r) => r.publicado_em);
  const porMes = new Map(todos.map((r) => [r.mes, r]));

  const hoje = mesDe();
  const mesEntrada = ficha?.criado_em ? new Date(new Date(ficha.criado_em).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 7) : hoje;
  const inicio = [mesEntrada, ...todos.map((r) => r.mes)].sort()[0];
  const fim = agencia ? hoje : (publicados.at(-1)?.mes ?? hoje);
  const meses = mesesEntre(inicio, fim);

  const padrao = agencia ? deslocarMes(hoje, -1) : (publicados.at(-1)?.mes ?? hoje);
  const mes = mesParam ? mesDe(mesParam) : padrao;
  const doMes = porMes.get(mes) ?? null;
  const anterior = porMes.get(deslocarMes(mes, -1)) ?? null;
  const q = agencia ? `&cliente=${cliente.id}` : "";

  // Visão "desde a entrada": usa só o que o cliente vê (publicado).
  const base = agencia ? todos : publicados;
  const comSeguidores = base.filter((r) => r.seguidores != null);
  const primeiro = comSeguidores[0];
  const ultimo = comSeguidores.at(-1);
  const ganho = primeiro && ultimo ? ultimo.seguidores! - primeiro.seguidores! : null;

  return (
    <>
      <CabecalhoPagina numero="07" titulo="Relatórios" texto="Os resultados do perfil mês a mês, desde a entrada na agência." />
      {agencia && clientes.length > 0 && (
        <div className="mb-6">
          <SeletorCliente clientes={clientes} atual={cliente.id} />
        </div>
      )}

      {base.length === 0 && !agencia ? (
        <Vazio titulo="O primeiro relatório está em preparação" texto="Ao fim de cada mês, a agência publica aqui os números do seu perfil e o que eles mostram." />
      ) : (
        <div className="flex flex-col gap-6">
          {base.length > 0 && (
            <section aria-labelledby="t-desde">
              <h2 id="t-desde" className="mb-1 text-2xl">Desde a entrada</h2>
              <p className="mb-4 text-sm text-muted">
                De {nomeDoMes(base[0].mes).toLowerCase()} a {nomeDoMes(base.at(-1)!.mes).toLowerCase()}, {base.length} {base.length === 1 ? "mês" : "meses"} de acompanhamento.
              </p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Destaque rotulo="Seguidores hoje" valor={numero(ultimo?.seguidores)}>
                  {ganho != null && primeiro !== ultimo && (
                    <Variacao valor={variacao(ultimo!.seguidores, primeiro!.seguidores)} sufixo={`(${ganho >= 0 ? "+" : ""}${numero(ganho)}) desde ${mesCurto(primeiro!.mes)}`} />
                  )}
                </Destaque>
                <Destaque rotulo="Alcance somado" valor={numero(soma(base, "alcance"))} />
                <Destaque rotulo="Interações somadas" valor={numero(soma(base, "interacoes"))} />
                <Destaque rotulo="Publicações" valor={numero(soma(base, "publicacoes"))} />
              </div>
            </section>
          )}

          {base.length > 1 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Cartao titulo="Seguidores">
                <GraficoEvolucao titulo="Seguidores" tipo="linha" pontos={meses.map((m) => ({ mes: m, valor: base.find((r) => r.mes === m)?.seguidores ?? null }))} />
              </Cartao>
              <Cartao titulo="Alcance por mês">
                <GraficoEvolucao titulo="Alcance por mês" tipo="barras" pontos={meses.map((m) => ({ mes: m, valor: base.find((r) => r.mes === m)?.alcance ?? null }))} />
              </Cartao>
            </div>
          )}

          <Cartao titulo="Mês a mês">
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th scope="col" className="px-5 py-3 font-semibold">Mês</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Seguidores</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Alcance</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Interações</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Engajamento</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Publicações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...meses].reverse().map((m) => {
                    const r = porMes.get(m);
                    const visivel = r && (agencia || r.publicado_em);
                    return (
                      <tr key={m} className={`border-b border-line last:border-0 ${m === mes ? "bg-soft" : ""}`}>
                        <th scope="row" className="px-5 py-2.5 text-left font-medium">
                          <Link href={`/relatorios?mes=${m}${q}`} className="inline-flex min-h-8 items-center text-brown underline-offset-2 hover:underline" aria-current={m === mes ? "true" : undefined}>
                            <span className="sm:hidden">{mesCurto(m)}</span>
                            <span className="hidden sm:inline">{nomeDoMes(m)}</span>
                          </Link>
                          {agencia && r && !r.publicado_em && <span className="ml-2 text-xs text-muted">rascunho</span>}
                        </th>
                        {visivel ? (
                          <>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(r.seguidores)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(r.alcance)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(r.interacoes)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{porcentagem(engajamento(r))}</td>
                            <td className="px-5 py-2.5 text-right tabular-nums">{numero(r.publicacoes)}</td>
                          </>
                        ) : (
                          <td colSpan={5} className="px-5 py-2.5 text-right text-xs text-muted">
                            {agencia ? "Sem relatório" : m === hoje ? "Mês em andamento" : "Em preparação"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Cartao>

          <section aria-labelledby="t-mes">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Link href={`/relatorios?mes=${deslocarMes(mes, -1)}${q}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
                <ChevronLeft aria-hidden className="size-5" />
                <span className="sr-only">Mês anterior</span>
              </Link>
              <h2 id="t-mes" className="text-center text-xl sm:text-3xl">Relatório de {nomeDoMes(mes).toLowerCase()}</h2>
              <Link href={`/relatorios?mes=${deslocarMes(mes, 1)}${q}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
                <ChevronRight aria-hidden className="size-5" />
                <span className="sr-only">Próximo mês</span>
              </Link>
            </div>

            {doMes && (agencia || doMes.publicado_em) ? (
              <div className="flex flex-col gap-6">
                {doMes.publicado_em ? (
                  <p className="text-xs text-muted">Publicado em {dataCurta(doMes.publicado_em)}.</p>
                ) : (
                  <p className="text-xs text-muted">Rascunho: o cliente ainda não vê este relatório.</p>
                )}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {METRICAS.filter((m) => doMes[m.campo] != null).map((m) => (
                    <Destaque key={m.campo} rotulo={m.rotulo} valor={numero(doMes[m.campo])}>
                      <Variacao valor={variacao(doMes[m.campo], anterior?.[m.campo])} />
                    </Destaque>
                  ))}
                  {engajamento(doMes) != null && (
                    <Destaque rotulo="Engajamento" valor={porcentagem(engajamento(doMes))}>
                      <p className="mt-1 text-xs text-muted">Interações sobre o alcance.</p>
                    </Destaque>
                  )}
                </div>
                {TEXTOS.some((t) => doMes[t.campo]) && (
                  <Cartao titulo="O que os números mostram">
                    <div className="flex flex-col gap-5">
                      {TEXTOS.filter((t) => doMes[t.campo]).map((t) => (
                        <section key={t.campo}>
                          <h3 className="text-xl">{t.rotulo}</h3>
                          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-text">{doMes[t.campo]}</p>
                        </section>
                      ))}
                    </div>
                  </Cartao>
                )}
              </div>
            ) : (
              !agencia && (
                <Vazio
                  titulo={mes === hoje ? "Este mês ainda está em andamento" : "Relatório em preparação"}
                  texto="Os números entram aqui quando o mês fecha e a agência publica o relatório."
                />
              )
            )}

            {agencia && (
              <Cartao titulo={doMes ? "Editar relatório" : "Preencher relatório"} className="mt-6">
                <FormRelatorio key={`${cliente.id}-${mes}`} clienteId={cliente.id} mes={mes} atual={doMes} />
              </Cartao>
            )}
          </section>
        </div>
      )}
    </>
  );
}
