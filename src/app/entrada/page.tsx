import { redirect } from "next/navigation";
import { ETAPAS, obterEntrada } from "@/lib/entrada";

/** Leva o cliente direto para a etapa em que parou. */
export default async function Entrada() {
  const { atual } = await obterEntrada();
  if (!atual) redirect("/inicio");
  redirect(ETAPAS.find((e) => e.id === atual)!.rota);
}
