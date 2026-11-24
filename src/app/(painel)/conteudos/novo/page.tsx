import type { Metadata } from "next";
import { clienteParaFormulario } from "@/lib/item-editavel";
import { CabecalhoPagina } from "@/components/ui/cartao";
import { FormConteudo } from "@/components/conteudos/form-conteudo";

export const metadata: Metadata = { title: "Novo post" };

export default async function NovoConteudo({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const cliente = await clienteParaFormulario((await searchParams).cliente);
  return (
    <>
      <CabecalhoPagina titulo="Novo post" texto={cliente.nome} />
      <FormConteudo clienteId={cliente.id} agenciaId={cliente.agencia_id} />
    </>
  );
}
