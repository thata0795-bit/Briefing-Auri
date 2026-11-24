import type { Metadata } from "next";
import Link from "next/link";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { buscarMensagens, resumoConversas } from "@/lib/chat";
import { CabecalhoPagina, Vazio } from "@/components/ui/cartao";
import { Conversa } from "@/components/chat/conversa";

export const metadata: Metadata = { title: "Mensagens" };

function quando(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export default async function Mensagens({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const sessao = await obterSessao();
  const agencia = sessao.perfil.papel !== "cliente";
  const pedido = (await searchParams).cliente;
  const supabase = await criarClienteServidor();
  const conversas = await resumoConversas(sessao.userId);

  const atual = agencia ? conversas.find((c) => c.clienteId === pedido) ?? null : conversas[0] ?? null;
  const iniciais = atual ? await buscarMensagens(supabase, atual.clienteId) : [];

  return (
    <>
      <CabecalhoPagina
        numero="05"
        titulo={agencia ? "Mensagens" : "Chat com a agência"}
        texto={agencia ? "Conversas com os clientes. Tudo fica gravado para a equipe que atende cada um." : "Tire dúvidas e combine detalhes por aqui, sem precisar do WhatsApp."}
      />
      {conversas.length === 0 ? (
        <Vazio titulo="Nenhuma conversa" />
      ) : agencia ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <nav aria-label="Conversas" className={atual ? "hidden lg:block" : ""}>
            <ul className="flex flex-col gap-1.5">
              {conversas.map((c) => (
                <li key={c.clienteId}>
                  <Link
                    href={`/mensagens?cliente=${c.clienteId}`}
                    aria-current={atual?.clienteId === c.clienteId ? "page" : undefined}
                    className={`flex min-h-16 items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors duration-200 ${
                      atual?.clienteId === c.clienteId ? "border-brown bg-card" : "border-line bg-card hover:border-brown"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-text">{c.nome}</span>
                      <span className="block truncate text-xs text-muted">
                        {c.ultima ? `${c.ultima.doCliente ? "" : "Agência: "}${c.ultima.texto}` : "Sem mensagens ainda"}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {c.ultima && <span className="text-[11px] text-muted">{quando(c.ultima.criado_em)}</span>}
                      {c.naoLidas > 0 && (
                        <span className="rounded-full bg-st-fix px-2 py-0.5 text-[11px] font-semibold text-bg">
                          {c.naoLidas}
                          <span className="sr-only"> não lidas</span>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {atual ? (
            <section aria-label={`Conversa com ${atual.nome}`} className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-2xl">{atual.nome}</h2>
                <Link href="/mensagens" className="inline-flex min-h-11 items-center text-sm text-brown underline-offset-4 hover:underline lg:hidden">
                  Todas as conversas
                </Link>
              </div>
              <Conversa clienteId={atual.clienteId} agenciaId={sessao.agencia.id} euId={sessao.userId} iniciais={iniciais} nomeOutroLado={atual.nome} />
            </section>
          ) : (
            <div className="hidden lg:block">
              <Vazio titulo="Escolha uma conversa" texto="As conversas com mensagens novas aparecem primeiro, com o número de não lidas." />
            </div>
          )}
        </div>
      ) : (
        atual && (
          <Conversa clienteId={atual.clienteId} agenciaId={sessao.agencia.id} euId={sessao.userId} iniciais={iniciais} nomeOutroLado={sessao.agencia.nome} />
        )
      )}
    </>
  );
}
