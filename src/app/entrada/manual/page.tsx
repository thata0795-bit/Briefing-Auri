import type { Metadata } from "next";
import { exigirEtapaLiberada } from "@/lib/entrada";
import { Manual } from "@/components/documentos/manual";
import { AceiteManual } from "@/components/entrada/aceite-manual";

export const metadata: Metadata = { title: "Manual da parceria" };

export default async function ManualParceria() {
  const { sessao, estados } = await exigirEtapaLiberada("manual");
  const concluida = estados.find((e) => e.etapa === "manual")?.status === "concluido";
  return (
    <div className="max-w-3xl">
      <span aria-hidden className="num-secao text-7xl">03</span>
      <h1 className="mt-2 text-4xl">Manual da parceria</h1>
      <p className="mt-3 text-base text-text">
        Alguns combinados que fazem o trabalho fluir bem entre você e a {sessao.agencia.nome}. Ele fica sempre disponível em Documentos.
      </p>
      <section className="mt-8 rounded-lg border border-line bg-card p-5 sm:p-6">
        <Manual texto={sessao.agencia.manual_parceria} />
      </section>
      <AceiteManual concluida={concluida} />
    </div>
  );
}
