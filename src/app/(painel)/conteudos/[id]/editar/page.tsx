import type { Metadata } from "next";
import { itemParaFormulario } from "@/lib/item-editavel";
import { CabecalhoPagina } from "@/components/ui/cartao";
import { FormConteudo } from "@/components/conteudos/form-conteudo";
import type { Conteudo } from "@/lib/conteudos";

export const metadata: Metadata = { title: "Editar post" };

export default async function EditarConteudo({ params }: { params: Promise<{ id: string }> }) {
  const { item, cliente } = await itemParaFormulario("conteudos", (await params).id);
  return (
    <>
      <CabecalhoPagina titulo="Editar post" texto={cliente.nome} />
      <FormConteudo clienteId={cliente.id} agenciaId={cliente.agencia_id} conteudo={item as Conteudo} />
    </>
  );
}
