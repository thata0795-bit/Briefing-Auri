import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ROTULO_FORMATO, ROTULO_STATUS_CONTEUDO, diaCurto, type Comentario, type Conteudo } from "@/lib/conteudos";
import type { StatusItem } from "@/lib/status";
import { Cartao } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { Arte } from "@/components/conteudos/arte";
import { Historico } from "@/components/conteudos/historico";
import { NovoComentario, RespostaCliente, SituacaoAgencia } from "@/components/conteudos/acoes-item";

export const metadata: Metadata = { title: "Post" };

const OPCOES: Record<string, string[]> = {
  em_andamento: ["aguardando_aprovacao"],
  aguardando_aprovacao: ["em_andamento"],
  ajuste_solicitado: ["aguardando_aprovacao"],
  aprovado: ["programado", "concluido"],
  programado: ["concluido"],
  concluido: [],
};

export default async function DetalheConteudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sessao = await obterSessao();
  const agencia = sessao.perfil.papel !== "cliente";
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("conteudos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as Conteudo;

  const [{ data: comentarios }, { data: cliente }, assinado] = await Promise.all([
    supabase.from("comentarios").select("id, tipo, texto, criado_em, autor:perfis(nome, papel)").eq("item_tipo", "conteudo").eq("item_id", id).order("criado_em"),
    supabase.from("clientes").select("nome").eq("id", c.cliente_id).maybeSingle(),
    c.arte_caminho ? supabase.storage.from("arquivos").createSignedUrls([c.arte_caminho], 600) : Promise.resolve({ data: null }),
  ]);
  const url = assinado.data?.[0]?.signedUrl ?? null;
  const vertical = c.formato === "reels" || c.formato === "stories";
  const voltar = `/calendario?mes=${c.data_publicacao.slice(0, 7)}${agencia ? `&cliente=${c.cliente_id}` : ""}`;

  return (
    <>
      <Link href={voltar} className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-brown underline-offset-4 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Calendário
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className={`mx-auto w-full overflow-hidden rounded-lg border border-line bg-card ${vertical ? "aspect-[9/16] max-w-xs" : "aspect-[4/5] max-w-md"}`}>
          <Arte url={url} formato={c.formato} titulo={c.titulo} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <p className="text-sm text-muted">
              {agencia && cliente?.nome ? `${cliente.nome} · ` : ""}
              {ROTULO_FORMATO[c.formato]} · {diaCurto(c.data_publicacao)}
              {c.horario ? `, ${c.horario.slice(0, 5)}` : ""}
            </p>
            <h1 className="mt-1 text-3xl sm:text-4xl">{c.titulo}</h1>
            <div className="mt-3">
              <SeloStatus status={c.status} rotulo={ROTULO_STATUS_CONTEUDO[c.status as StatusItem]} />
            </div>
          </div>

          {!agencia && c.status === "aguardando_aprovacao" && <RespostaCliente tipo="conteudo" id={c.id} />}
          {agencia && (
            <div className="flex flex-col gap-3">
              <SituacaoAgencia tipo="conteudo" id={c.id} opcoes={OPCOES[c.status] ?? []} depoisDeAjuste={c.status === "ajuste_solicitado"} />
              <Link
                href={`/conteudos/${c.id}/editar`}
                className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-brown underline-offset-4 hover:underline"
              >
                <Pencil aria-hidden className="size-4" /> Editar post
              </Link>
            </div>
          )}

          <Cartao titulo="Legenda">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text">{c.legenda || "Legenda ainda não escrita."}</p>
          </Cartao>

          <Cartao titulo="Comentários e histórico">
            <div className="flex flex-col gap-4">
              <Historico comentarios={(comentarios ?? []) as unknown as Comentario[]} />
              <NovoComentario tipo="conteudo" id={c.id} />
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
