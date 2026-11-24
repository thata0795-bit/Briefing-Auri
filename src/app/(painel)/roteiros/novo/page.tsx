import type { Metadata } from "next";
import { clienteParaFormulario } from "@/lib/item-editavel";
import { CabecalhoPagina } from "@/components/ui/cartao";
import { FormRoteiro } from "@/components/conteudos/form-roteiro";

export const metadata: Metadata = { title: "Novo roteiro" };

export default async function NovoRoteiro({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const cliente = await clienteParaFormulario((await searchParams).cliente);
  return (
    <>
      <CabecalhoPagina titulo="Novo roteiro" texto={cliente.nome} />
      <FormRoteiro clienteId={cliente.id} />
    </>
  );
}
