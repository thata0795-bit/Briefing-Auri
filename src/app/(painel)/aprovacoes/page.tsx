import type { Metadata } from "next";
import Link from "next/link";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ROTULO_FORMATO, ROTULO_STATUS_CONTEUDO, ROTULO_STATUS_ROTEIRO, ROTULO_TIPO_ROTEIRO, diaCurto, type Formato, type TipoRoteiro } from "@/lib/conteudos";
import type { StatusItem } from "@/lib/status";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { AprovarLote, type ItemAprovacao } from "@/components/conteudos/aprovar-lote";

export const metadata: Metadata = { title: "Aprovações" };

type Linha = ItemAprovacao & { cliente: string; data: string };

export default async function Aprovacoes() {
  const sessao = await obterSessao();
  const agencia = sessao.perfil.papel !== "cliente";
  const supabase = await criarClienteServidor();
  const estados = ["aguardando_aprovacao", "ajuste_solicitado"];

  const [{ data: clientes }, { data: conteudos }, { data: roteiros }] = await Promise.all([
    supabase.from("clientes").select("id, nome"),
    supabase.from("conteudos").select("id, cliente_id, titulo, formato, data_publicacao, status").in("status", estados).order("data_publicacao"),
    supabase.from("roteiros").select("id, cliente_id, titulo, tipo, data_gravacao, status, publicado_em").in("status", estados).order("data_gravacao"),
  ]);
  const nome = new Map((clientes ?? []).map((c) => [c.id, c.nome as string]));
  const q = (cliente: string) => (agencia ? `?cliente=${cliente}` : "");

  const linhas: Linha[] = [
    ...(conteudos ?? []).map((c) => ({
      tipo: "conteudo" as const,
      id: c.id,
      titulo: c.titulo,
      detalhe: `${agencia ? `${nome.get(c.cliente_id) ?? ""} · ` : ""}${ROTULO_FORMATO[c.formato as Formato]} · publica ${diaCurto(c.data_publicacao)}`,
      href: `/conteudos/${c.id}${q(c.cliente_id)}`,
      status: c.status as StatusItem,
      rotuloStatus: ROTULO_STATUS_CONTEUDO[c.status as StatusItem] ?? "",
      cliente: c.cliente_id,
      data: c.data_publicacao,
    })),
    ...(roteiros ?? [])
      .filter((r) => r.publicado_em)
      .map((r) => ({
        tipo: "roteiro" as const,
        id: r.id,
        titulo: r.titulo,
        detalhe: `${agencia ? `${nome.get(r.cliente_id) ?? ""} · ` : ""}${ROTULO_TIPO_ROTEIRO[r.tipo as TipoRoteiro]} · grava ${diaCurto(r.data_gravacao)}`,
        href: `/roteiros/${r.id}${q(r.cliente_id)}`,
        status: r.status as StatusItem,
        rotuloStatus: ROTULO_STATUS_ROTEIRO[r.status as StatusItem] ?? "",
        cliente: r.cliente_id,
        data: r.data_gravacao,
      })),
  ].sort((a, b) => a.data.localeCompare(b.data));

  const esperando = linhas.filter((l) => l.status === "aguardando_aprovacao");
  const ajustes = linhas.filter((l) => l.status === "ajuste_solicitado");

  const Lista = ({ itens }: { itens: Linha[] }) => (
    <ul className="flex flex-col gap-2">
      {itens.map((i) => (
        <li key={`${i.tipo}${i.id}`}>
          <Link href={i.href} className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 py-2 hover:border-brown">
            <span className="min-w-0">
              <span className="block truncate font-medium text-text">{i.titulo}</span>
              <span className="block truncate text-xs text-muted">{i.detalhe}</span>
            </span>
            <SeloStatus status={i.status} rotulo={i.rotuloStatus} />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <CabecalhoPagina
        numero="03"
        titulo="Aprovações"
        texto={agencia ? "O que está com os clientes e o que voltou com pedido de ajuste." : "Posts e roteiros que esperam a sua resposta."}
      />
      <div className="flex flex-col gap-6">
        <Cartao titulo={agencia ? `Aguardando o cliente (${esperando.length})` : `Esperando você (${esperando.length})`}>
          {esperando.length === 0 ? (
            <Vazio titulo={agencia ? "Nada com os clientes agora" : "Tudo respondido"} texto={agencia ? undefined : "Quando a agência enviar algo para aprovar, aparece aqui."} />
          ) : agencia ? (
            <Lista itens={esperando} />
          ) : (
            <AprovarLote itens={esperando} />
          )}
        </Cartao>
        <Cartao titulo={agencia ? `Ajustes pedidos (${ajustes.length})` : `Ajustes que você pediu (${ajustes.length})`}>
          {ajustes.length === 0 ? (
            <p className="text-sm text-muted">Nenhum ajuste em aberto.</p>
          ) : (
            <>
              {!agencia && <p className="mb-3 text-sm text-muted">A agência está ajustando. Você recebe de volta para aprovar.</p>}
              <Lista itens={ajustes} />
            </>
          )}
        </Cartao>
      </div>
    </>
  );
}
