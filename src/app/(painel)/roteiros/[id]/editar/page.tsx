import type { Metadata } from "next";
import { itemParaFormulario } from "@/lib/item-editavel";
import { CabecalhoPagina } from "@/components/ui/cartao";
import { FormRoteiro } from "@/components/conteudos/form-roteiro";
import type { Roteiro } from "@/lib/conteudos";

export const metadata: Metadata = { title: "Editar roteiro" };

export default async function EditarRoteiro({ params }: { params: Promise<{ id: string }> }) {
  const { item, cliente } = await itemParaFormulario("roteiros", (await params).id);
  return (
    <>
      <CabecalhoPagina titulo="Editar roteiro" texto={cliente.nome} />
      <FormRoteiro clienteId={cliente.id} roteiro={item as Roteiro} />
    </>
  );
}
