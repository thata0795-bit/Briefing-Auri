import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { deslocarMes, mesDe, nomeDoMes } from "@/lib/conteudos";
import { formatarMoeda } from "@/lib/contratos/modelo";
import type { StatusItem } from "@/lib/status";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { gerarMensalidades, marcarPago } from "./acoes";

export const metadata: Metadata = { title: "Financeiro" };

type Mensalidade = { id: string; cliente_id: string; competencia: string; valor: number; vencimento: string; status: string; pago_em: string | null; link_boleto: string | null };

const hojeSP = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

/** Pendente com vencimento passado aparece como atrasada. */
function situacao(m: Mensalidade): { status: StatusItem; rotulo: string; chave: "pago" | "aberto" | "atrasado" | "cancelado" } {
  if (m.status === "pago") return { status: "concluido", rotulo: "Pago", chave: "pago" };
  if (m.status === "cancelado") return { status: "a_fazer", rotulo: "Cancelado", chave: "cancelado" };
  if (m.status === "atrasado" || m.vencimento < hojeSP()) return { status: "atrasado", rotulo: "Atrasado", chave: "atrasado" };
  return { status: "aguardando_aprovacao", rotulo: "Em aberto", chave: "aberto" };
}

const data = (d: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

export default async function Financeiro({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sessao = await obterSessao();
  if (sessao.perfil.papel === "equipe") redirect("/inicio");
  const admin = sessao.perfil.papel === "admin";
  const supabase = await criarClienteServidor();

  if (!admin) {
    const [{ data: lista }, { data: plano }] = await Promise.all([
      supabase.from("mensalidades").select("*").order("vencimento", { ascending: false }),
      supabase.from("financeiro_clientes").select("plano, valor_mensal, dia_vencimento, forma_pagamento").maybeSingle(),
    ]);
    const mensalidades = (lista ?? []) as Mensalidade[];
    const proxima = [...mensalidades].reverse().find((m) => m.status !== "pago" && m.status !== "cancelado");
    return (
      <>
        <CabecalhoPagina numero="08" titulo="Financeiro" texto="Mensalidades e pagamentos. Só você e a dona da agência veem esta tela." />
        <div className="flex flex-col gap-6">
          <Cartao titulo="Próximo vencimento">
            {proxima ? (
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-serif text-4xl text-brown-dark">{formatarMoeda(Number(proxima.valor))}</p>
                  <p className="text-sm text-muted">Vence em {data(proxima.vencimento)} · referente a {nomeDoMes(proxima.competencia).toLowerCase()}</p>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <SeloStatus status={situacao(proxima).status} rotulo={situacao(proxima).rotulo} />
                  {proxima.link_boleto ? (
                    <a href={proxima.link_boleto} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center rounded-md bg-brown px-4 text-sm font-medium text-bg hover:bg-brown-dark">Abrir boleto</a>
                  ) : (
                    <p className="text-xs text-muted">O boleto e o Pix chegam por e-mail 10 dias antes do vencimento.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhuma mensalidade em aberto.</p>
            )}
          </Cartao>
          <Cartao titulo="Mensalidades">
            {mensalidades.length === 0 ? (
              <Vazio titulo="Nenhuma mensalidade ainda" />
            ) : (
              <div className="-mx-5 -my-5 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-soft text-xs tracking-wide text-muted uppercase">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">Mês</th>
                      <th scope="col" className="px-5 py-3 font-medium">Valor</th>
                      <th scope="col" className="px-5 py-3 font-medium">Vencimento</th>
                      <th scope="col" className="px-5 py-3 font-medium">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {mensalidades.map((m) => (
                      <tr key={m.id}>
                        <td className="px-5 py-3 text-text">{nomeDoMes(m.competencia)}</td>
                        <td className="px-5 py-3 tabular-nums text-text">{formatarMoeda(Number(m.valor))}</td>
                        <td className="px-5 py-3 tabular-nums text-muted">{data(m.vencimento)}</td>
                        <td className="px-5 py-3"><SeloStatus status={situacao(m).status} rotulo={situacao(m).rotulo} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Cartao>
          {plano && (
            <p className="text-sm text-muted">
              {plano.plano} · {formatarMoeda(Number(plano.valor_mensal))} por mês · vencimento todo dia {plano.dia_vencimento}
            </p>
          )}
        </div>
      </>
    );
  }

  const mes = mesDe((await searchParams).mes);
  const [{ data: lista }, { data: clientes }] = await Promise.all([
    supabase.from("mensalidades").select("*").eq("competencia", mes).order("vencimento"),
    supabase.from("clientes").select("id, nome"),
  ]);
  const nome = new Map((clientes ?? []).map((c) => [c.id, c.nome as string]));
  const mensalidades = (lista ?? []) as Mensalidade[];
  const soma = (f: (m: Mensalidade) => boolean) => mensalidades.filter(f).reduce((t, m) => t + Number(m.valor), 0);
  const numeros = [
    { rotulo: "Previsto", valor: soma((m) => m.status !== "cancelado") },
    { rotulo: "Recebido", valor: soma((m) => situacao(m).chave === "pago") },
    { rotulo: "Em aberto", valor: soma((m) => situacao(m).chave === "aberto") },
    { rotulo: "Atrasado", valor: soma((m) => situacao(m).chave === "atrasado") },
  ];

  return (
    <>
      <CabecalhoPagina numero="08" titulo="Financeiro" texto="Mensalidades de todos os clientes. A equipe não vê esta tela." />
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href={`/financeiro?mes=${deslocarMes(mes, -1)}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
          <ChevronLeft aria-hidden className="size-5" />
          <span className="sr-only">Mês anterior</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl">{nomeDoMes(mes)}</h2>
        <Link href={`/financeiro?mes=${deslocarMes(mes, 1)}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
          <ChevronRight aria-hidden className="size-5" />
          <span className="sr-only">Próximo mês</span>
        </Link>
      </div>
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {numeros.map((n) => (
          <div key={n.rotulo} className="rounded-lg border border-line bg-card px-4 py-3">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">{n.rotulo}</dt>
            <dd className="mt-1 font-serif text-2xl tabular-nums text-brown-dark">{formatarMoeda(n.valor)}</dd>
          </div>
        ))}
      </dl>
      <Cartao titulo={`Mensalidades de ${nomeDoMes(mes).toLowerCase()}`}>
        <form action={gerarMensalidades} className="mb-5">
          <input type="hidden" name="mes" value={mes} />
          <BotaoEnviar variante="secundario" textoEnviando="Gerando...">Gerar mensalidades do mês</BotaoEnviar>
          <p className="mt-2 text-xs text-muted">Cria uma mensalidade por cliente ativo, com o valor e o vencimento do plano. Não duplica.</p>
        </form>
        {mensalidades.length === 0 ? (
          <Vazio titulo="Nenhuma mensalidade neste mês" />
        ) : (
          <ul className="divide-y divide-line">
            {mensalidades.map((m) => {
              const s = situacao(m);
              return (
                <li key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text">{nome.get(m.cliente_id) ?? "Cliente"}</p>
                    <p className="text-xs text-muted tabular-nums">{formatarMoeda(Number(m.valor))} · vence {data(m.vencimento)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SeloStatus status={s.status} rotulo={s.rotulo} />
                    {s.chave !== "pago" && s.chave !== "cancelado" && (
                      <form action={marcarPago}>
                        <input type="hidden" name="id" value={m.id} />
                        <BotaoEnviar variante="texto" className="px-0" textoEnviando="...">Marcar como pago</BotaoEnviar>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </>
  );
}
