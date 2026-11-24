import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ROTULO_STATUS_ROTEIRO, ROTULO_TIPO_ROTEIRO, diaCurto, type Comentario, type Roteiro } from "@/lib/conteudos";
import type { StatusItem } from "@/lib/status";
import { Cartao } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { Historico } from "@/components/conteudos/historico";
import { NovoComentario, RespostaCliente, SituacaoAgencia } from "@/components/conteudos/acoes-item";
import { marcarRoteiroLido } from "../../conteudos/acoes";

export const metadata: Metadata = { title: "Roteiro" };

const OPCOES: Record<string, string[]> = {
  em_andamento: ["aguardando_aprovacao"],
  aguardando_aprovacao: ["em_andamento"],
  ajuste_solicitado: ["aguardando_aprovacao"],
  aprovado: ["concluido"],
  concluido: [],
};

const BLOCOS: { campo: keyof Roteiro; titulo: string }[] = [
  { campo: "objetivo", titulo: "Objetivo" },
  { campo: "gancho", titulo: "Gancho (primeiros segundos)" },
  { campo: "falas", titulo: "Falas" },
  { campo: "cenas", titulo: "Cenas" },
  { campo: "referencias", titulo: "Referências" },
  { campo: "o_que_levar", titulo: "O que levar no dia" },
];

export default async function DetalheRoteiro({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sessao = await obterSessao();
  const agencia = sessao.perfil.papel !== "cliente";
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("roteiros").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as Roteiro;
  if (!agencia && !r.lido_em) await marcarRoteiroLido(r.id);

  const [{ data: comentarios }, { data: cliente }] = await Promise.all([
    supabase.from("comentarios").select("id, tipo, texto, criado_em, autor:perfis(nome, papel)").eq("item_tipo", "roteiro").eq("item_id", id).order("criado_em"),
    supabase.from("clientes").select("nome").eq("id", r.cliente_id).maybeSingle(),
  ]);
  const voltar = `/calendario?mes=${r.data_gravacao.slice(0, 7)}${agencia ? `&cliente=${r.cliente_id}` : ""}`;

  return (
    <>
      <Link href={voltar} className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-brown underline-offset-4 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Calendário
      </Link>
      <div className="flex max-w-3xl flex-col gap-5">
        <div>
          <p className="text-sm text-muted">
            {agencia && cliente?.nome ? `${cliente.nome} · ` : ""}
            {ROTULO_TIPO_ROTEIRO[r.tipo]} · gravação {diaCurto(r.data_gravacao)}
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl">{r.titulo}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SeloStatus status={r.status} rotulo={ROTULO_STATUS_ROTEIRO[r.status as StatusItem]} />
            {agencia && (
              <span className="text-xs text-muted">
                {!r.publicado_em ? "Ainda não publicado para o cliente" : r.lido_em ? "O cliente já leu" : "O cliente ainda não abriu"}
              </span>
            )}
          </div>
        </div>

        {!agencia && r.status === "aguardando_aprovacao" && <RespostaCliente tipo="roteiro" id={r.id} />}
        {agencia && (
          <div className="flex flex-col gap-3">
            <SituacaoAgencia tipo="roteiro" id={r.id} opcoes={OPCOES[r.status] ?? []} depoisDeAjuste={r.status === "ajuste_solicitado"} />
            <Link href={`/roteiros/${r.id}/editar`} className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-brown underline-offset-4 hover:underline">
              <Pencil aria-hidden className="size-4" /> Editar roteiro
            </Link>
          </div>
        )}

        {BLOCOS.filter((b) => r[b.campo]).map((b) => (
          <Cartao key={b.campo} titulo={b.titulo}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text">{String(r[b.campo])}</p>
          </Cartao>
        ))}

        <Cartao titulo="Comentários e histórico">
          <div className="flex flex-col gap-4">
            <Historico comentarios={(comentarios ?? []) as unknown as Comentario[]} />
            <NovoComentario tipo="roteiro" id={r.id} />
          </div>
        </Cartao>
      </div>
    </>
  );
}
