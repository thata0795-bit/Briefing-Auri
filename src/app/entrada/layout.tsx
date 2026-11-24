import Image from "next/image";
import { obterEntrada } from "@/lib/entrada";
import { estiloDaMarca, logoDaMarca } from "@/lib/marca";
import { BarraEtapas } from "@/components/entrada/barra-etapas";

export default async function LayoutEntrada({ children }: { children: React.ReactNode }) {
  const { sessao, estados, atual } = await obterEntrada();
  const { monograma } = logoDaMarca(sessao.agencia.marca);

  return (
    <div style={estiloDaMarca(sessao.agencia.marca)} className="min-h-dvh bg-bg">
      <header className="bg-brown-mid">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Image src={monograma} alt="" width={521} height={488} className="h-auto w-9 shrink-0" />
            <span className="truncate font-serif text-lg text-bg">{sessao.agencia.nome}</span>
          </div>
          <form action="/auth/sair" method="post">
            <button type="submit" className="min-h-11 text-sm text-gold-light underline-offset-4 hover:underline">
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="border-b border-line bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-8">
          <BarraEtapas estados={estados} atual={atual} />
        </div>
      </div>
      <main id="conteudo" className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
        {children}
      </main>
    </div>
  );
}
