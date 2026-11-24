import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { MANUAL_PADRAO } from "@/lib/manual";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { FormManual } from "@/components/documentos/form-manual";
import { Manual } from "@/components/documentos/manual";

export const metadata: Metadata = { title: "Manual da parceria" };

export default async function ConfigManual() {
  const sessao = await exigirPapel("admin");
  const texto = sessao.agencia.manual_parceria || MANUAL_PADRAO;
  return (
    <>
      <CabecalhoPagina titulo="Manual da parceria" texto="O cliente lê e aceita na entrada. Depois, fica sempre em Documentos." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Editar">
          <FormManual texto={texto} />
        </Cartao>
        <Cartao titulo="Como o cliente vê">
          <Manual texto={texto} />
        </Cartao>
      </div>
    </>
  );
}
