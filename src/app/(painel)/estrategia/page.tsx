import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clapperboard } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { clienteDaPagina } from "@/lib/cliente-da-pagina";
import { ROTULO_STATUS_ROTEIRO, ROTULO_TIPO_ROTEIRO, deslocarMes, diaCurto, mesDe, nomeDoMes, type Comentario, type TipoRoteiro } from "@/lib/conteudos";
import { diaSemana, hora } from "@/lib/agenda";
import { dataCurta } from "@/lib/datas";
import type { Respostas } from "@/lib/briefing/perguntas";
import type { StatusItem } from "@/lib/status";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { SeletorCliente } from "@/components/conteudos/seletor-cliente";
import { Historico } from "@/components/conteudos/historico";
import { NovoComentario } from "@/components/conteudos/acoes-item";
import { FormEstrategia, type DadosEstrategia } from "@/components/estrategia/form-estrategia";
import { ResumoReuniao } from "@/components/estrategia/resumo-reuniao";
import { BriefingRespostas } from "@/components/briefing/respostas";

export const metadata: Metadata = { title: "Estratégia e reuniões" };

const BLOCOS = [
  { campo: "foco", titulo: "Foco do mês" },
  { campo: "objetivos", titulo: "Objetivos" },
  { campo: "pilares", titulo: "Pilares de conteúdo" },
  { campo: "metas", titulo: "Metas" },
] as const;

type Estrategia = DadosEstrategia & { id: string; versao: number; publicado_em: string | null; atualizado_em: string };

export default async function EstrategiaPagina({ searchParams }: { searchParams: Promise<{ mes?: string; cliente?: string }> }) {
  const sessao = await obterSessao();
  const { mes: mesParam, cliente: clienteParam } = await searchParams;
  const { cliente, clientes, agencia, supabase } = await clienteDaPagina(sessao, clienteParam);
  if (!cliente) return <Vazio titulo="Nenhum cliente por aqui" />;
  const mes = mesDe(mesParam);

  const [versoes, reunioes, roteiros, briefing, arquivos] = await Promise.all([
    supabase.from("estrategias").select("id, versao, foco, objetivos, pilares, metas, publicado_em, atualizado_em").eq("cliente_id", cliente.id).eq("mes", mes).order("versao", { ascending: false }),
    supabase.from("compromissos").select("id, titulo, inicio, fim, status, resumo").eq("cliente_id", cliente.id).eq("tipo", "reuniao").neq("status", "cancelado").order("inicio", { ascending: false }).limit(12),
    supabase.from("roteiros").select("id, titulo, tipo, data_gravacao, status, publicado_em").eq("cliente_id", cliente.id).gte("data_gravacao", `${mes}-01`).lte("data_gravacao", `${mes}-31`).order("data_gravacao"),
    supabase.from("briefings").select("respostas, puladas").eq("cliente_id", cliente.id).maybeSingle(),
    supabase.from("arquivos").select("id, nome, caminho").eq("cliente_id", cliente.id).eq("pasta", "briefing"),
  ]);
  const lista = (versoes.data ?? []) as Estrategia[];
  const vigente = agencia ? lista[0] : lista.find((v) => v.publicado_em);
  const publicada = lista.find((v) => v.publicado_em);
  const { data: comentarios } = publicada
    ? await supabase.from("comentarios").select("id, tipo, texto, criado_em, autor:perfis(nome, papel)").eq("item_tipo", "estrategia").eq("item_id", publicada.id).order("criado_em")
    : { data: [] };
  const caminhos = (arquivos.data ?? []).map((a) => a.caminho);
  const { data: urls } = caminhos.length ? await supabase.storage.from("arquivos").createSignedUrls(caminhos, 300) : { data: [] };
  const linkArquivo = new Map((arquivos.data ?? []).map((a, i) => [a.id, { nome: a.nome, url: urls?.[i]?.signedUrl }]));
  const q = agencia ? `&cliente=${cliente.id}` : "";

  return (
    <>
      <CabecalhoPagina numero="06" titulo="Estratégia e reuniões" texto="O plano do mês, os encontros e os roteiros em produção." />
      {agencia && clientes.length > 0 && (
        <div className="mb-6">
          <SeletorCliente clientes={clientes} atual={cliente.id} />
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href={`/estrategia?mes=${deslocarMes(mes, -1)}${q}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
          <ChevronLeft aria-hidden className="size-5" />
          <span className="sr-only">Mês anterior</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl">{nomeDoMes(mes)}</h2>
        <Link href={`/estrategia?mes=${deslocarMes(mes, 1)}${q}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
          <ChevronRight aria-hidden className="size-5" />
          <span className="sr-only">Próximo mês</span>
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <Cartao titulo="Estratégia do mês">
          {agencia ? (
            <>
              <p className="mb-4 text-xs text-muted">
                {vigente
                  ? `Versão ${vigente.versao}, ${vigente.publicado_em ? `publicada em ${dataCurta(vigente.publicado_em)}` : "rascunho ainda não publicado"}.`
                  : "Ainda não há estratégia para este mês."}
              </p>
              <FormEstrategia clienteId={cliente.id} mes={mes} atual={vigente ?? {}} publicada={!!vigente?.publicado_em} />
            </>
          ) : vigente ? (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-muted">Versão {vigente.versao}, publicada em {dataCurta(vigente.publicado_em!)}.</p>
              {BLOCOS.filter((b) => vigente[b.campo]).map((b) => (
                <section key={b.campo}>
                  <h3 className="text-xl">{b.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-text">{vigente[b.campo]}</p>
                </section>
              ))}
            </div>
          ) : (
            <Vazio titulo="A estratégia deste mês está em preparação" texto="Você recebe um aviso quando ela estiver pronta para ler e comentar." />
          )}
          {publicada && (
            <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
              <h3 className="text-xl">Comentários</h3>
              <Historico comentarios={(comentarios ?? []) as unknown as Comentario[]} />
              <NovoComentario tipo="estrategia" id={publicada.id} />
            </div>
          )}
        </Cartao>

        <Cartao titulo="Reuniões">
          {(reunioes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhuma reunião registrada.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(reunioes.data ?? []).map((r) => (
                <li key={r.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span aria-hidden className="num-secao w-14 shrink-0 text-3xl">
                    {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(r.inicio))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text">{r.titulo}</p>
                    <p className="text-xs text-muted">{diaSemana(r.inicio)}, {hora(r.inicio)}</p>
                    {agencia ? (
                      <ResumoReuniao id={r.id} inicial={r.resumo} />
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-muted">{r.resumo || (new Date(r.inicio) > new Date() ? "Reunião marcada." : "Resumo ainda não registrado.")}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao titulo="Roteiros do mês">
          {(roteiros.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhum roteiro neste mês.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(roteiros.data ?? []).map((r) => (
                <li key={r.id}>
                  <Link href={`/roteiros/${r.id}${agencia ? `?cliente=${cliente.id}` : ""}`} className="flex min-h-14 items-center justify-between gap-3 py-2 hover:underline">
                    <span className="flex min-w-0 items-center gap-2">
                      <Clapperboard aria-hidden className="size-4 shrink-0 text-muted" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-text">{r.titulo}</span>
                        <span className="block text-xs text-muted">{ROTULO_TIPO_ROTEIRO[r.tipo as TipoRoteiro]} · grava {diaCurto(r.data_gravacao)}</span>
                      </span>
                    </span>
                    <SeloStatus status={r.status as StatusItem} rotulo={ROTULO_STATUS_ROTEIRO[r.status as StatusItem]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <section aria-labelledby="t-briefing-enviado">
          <h2 id="t-briefing-enviado" className="mb-3 text-2xl">Briefing enviado</h2>
          <BriefingRespostas respostas={(briefing.data?.respostas ?? {}) as Respostas} puladas={briefing.data?.puladas ?? []} linkArquivo={linkArquivo} />
        </section>
      </div>
    </>
  );
}
