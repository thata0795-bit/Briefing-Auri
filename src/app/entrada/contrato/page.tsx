import type { Metadata } from "next";
import { ExternalLink, FileSignature } from "lucide-react";
import { exigirEtapaLiberada } from "@/lib/entrada";
import { dataCurta } from "@/lib/datas";
import { AtualizarSozinho } from "@/components/entrada/atualizar-sozinho";
import { SeloStatus } from "@/components/ui/status";

export const metadata: Metadata = { title: "Contrato" };

export default async function Contrato({ searchParams }: { searchParams: Promise<{ assinado?: string }> }) {
  const { supabase, cliente, estados } = await exigirEtapaLiberada("contrato");
  const { assinado: voltouDaAssinatura } = await searchParams;
  const etapa = estados.find((e) => e.etapa === "contrato")!;

  const { data: contrato } = await supabase
    .from("contratos")
    .select("id, titulo, conteudo, status, link_assinatura, assinado_em, assinado_por")
    .eq("cliente_id", cliente.id)
    .neq("status", "cancelado")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const assinado = etapa.status === "concluido" || contrato?.status === "assinado";

  return (
    <div className="max-w-3xl">
      <span aria-hidden className="num-secao text-7xl">02</span>
      <h1 className="mt-2 text-4xl">Contrato</h1>

      {assinado ? (
        <>
          <p className="mt-3 text-base text-text">
            Contrato assinado{contrato?.assinado_em ? ` em ${dataCurta(contrato.assinado_em)}` : ""}. Uma cópia fica sempre disponível
            no seu financeiro.
          </p>
          <div className="mt-4"><SeloStatus status="concluido" rotulo="Assinado" /></div>
          <a href="/entrada" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-brown px-5 text-sm font-medium text-bg hover:bg-brown-dark">
            Continuar para o briefing
          </a>
        </>
      ) : contrato?.status === "enviado" ? (
        <>
          <AtualizarSozinho />
          <p className="mt-3 text-base text-text">
            Leia com calma. Quando estiver tudo certo, toque em assinar: a assinatura é eletrônica e vale como assinatura em papel.
          </p>
          <div className="mt-4"><SeloStatus status="aguardando_aprovacao" rotulo="Aguardando sua assinatura" /></div>
          {voltouDaAssinatura && (
            <p role="status" className="mt-4 text-sm text-muted">Recebendo a confirmação da assinatura. A tela atualiza sozinha.</p>
          )}
          <section aria-label="Texto do contrato" className="mt-6 overflow-hidden rounded-lg border border-line bg-card">
            <header className="bg-brown-dark px-5 py-3">
              <h2 className="font-sans text-xs font-semibold tracking-[0.14em] text-bg uppercase">{contrato.titulo}</h2>
            </header>
            <div tabIndex={0} className="max-h-[55vh] overflow-y-auto px-5 py-5 text-sm leading-relaxed whitespace-pre-wrap text-text">
              {contrato.conteudo}
            </div>
          </section>
          {contrato.link_assinatura && (
            <a
              href={contrato.link_assinatura}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-brown px-5 text-sm font-medium text-bg hover:bg-brown-dark"
            >
              <FileSignature aria-hidden className="size-4" />
              Assinar contrato
              <ExternalLink aria-hidden className="size-3.5 opacity-80" />
            </a>
          )}
          <p className="mt-3 text-xs text-muted">Assim que a assinatura for confirmada, a próxima etapa abre sozinha.</p>
        </>
      ) : (
        <>
          <AtualizarSozinho segundos={15} />
          <p className="mt-3 text-base text-text">
            A agência está preparando o seu contrato. Assim que ele estiver pronto, ele aparece aqui e você recebe um aviso.
          </p>
          <div className="mt-4"><SeloStatus status="em_andamento" rotulo="Em preparação" /></div>
        </>
      )}
    </div>
  );
}
