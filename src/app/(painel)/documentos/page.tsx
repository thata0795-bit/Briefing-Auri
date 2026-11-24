import type { Metadata } from "next";
import { obterSessao } from "@/lib/sessao";
import { clienteDaPagina } from "@/lib/cliente-da-pagina";
import { dataCurta } from "@/lib/datas";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { SeletorCliente } from "@/components/conteudos/seletor-cliente";
import { Manual } from "@/components/documentos/manual";

export const metadata: Metadata = { title: "Documentos" };

export default async function Documentos({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const sessao = await obterSessao();
  const { cliente, clientes, agencia, supabase } = await clienteDaPagina(sessao, (await searchParams).cliente);
  const veContrato = sessao.perfil.papel !== "equipe";
  const { data: contrato } =
    cliente && veContrato
      ? await supabase
          .from("contratos")
          .select("titulo, conteudo, status, assinado_em, assinado_por, enviado_em")
          .eq("cliente_id", cliente.id)
          .neq("status", "cancelado")
          .order("criado_em", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  return (
    <>
      <CabecalhoPagina numero="07" titulo="Documentos" texto="Contrato e manual da parceria, sempre à mão." />
      {agencia && cliente && clientes.length > 0 && (
        <div className="mb-6">
          <SeletorCliente clientes={clientes} atual={cliente.id} />
        </div>
      )}
      <nav aria-label="Documentos" className="mb-6 flex flex-wrap gap-2">
        <a href="#contrato" className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-medium text-brown hover:border-brown">Contrato</a>
        <a href="#manual" className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-4 text-sm font-medium text-brown hover:border-brown">Manual da parceria</a>
      </nav>
      <div className="flex flex-col gap-6">
        <section id="contrato" className="scroll-mt-6">
          <Cartao titulo="Contrato">
            {!veContrato ? (
              <p className="text-sm text-muted">O contrato tem valores e fica visível só para a dona da agência e para o cliente.</p>
            ) : !contrato ? (
              <Vazio titulo="Nenhum contrato ainda" texto="O contrato aparece aqui assim que for enviado para assinatura." />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-medium text-text">{contrato.titulo}</p>
                  <SeloStatus status={contrato.status === "assinado" ? "concluido" : "aguardando_aprovacao"} rotulo={contrato.status === "assinado" ? "Assinado" : "Aguardando assinatura"} />
                </div>
                <p className="text-xs text-muted">
                  {contrato.assinado_em
                    ? `Assinado em ${dataCurta(contrato.assinado_em)}${contrato.assinado_por ? ` por ${contrato.assinado_por}` : ""}.`
                    : contrato.enviado_em
                      ? `Enviado em ${dataCurta(contrato.enviado_em)}.`
                      : ""}
                </p>
                <div tabIndex={0} className="max-h-[60vh] overflow-y-auto rounded-md border border-line bg-bg px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap text-text">
                  {contrato.conteudo}
                </div>
              </div>
            )}
          </Cartao>
        </section>
        <section id="manual" className="scroll-mt-6">
          <Cartao titulo="Manual da parceria">
            <Manual texto={sessao.agencia.manual_parceria} />
          </Cartao>
        </section>
      </div>
    </>
  );
}
