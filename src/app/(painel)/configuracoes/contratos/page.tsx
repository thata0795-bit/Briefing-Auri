import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CAMPOS_MODELO } from "@/lib/contratos/modelo";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { FormModelo } from "@/components/agencia/form-modelo";

export const metadata: Metadata = { title: "Modelos de contrato" };

export default async function ModelosContrato() {
  await exigirPapel("admin");
  const supabase = await criarClienteServidor();
  const { data: modelos } = await supabase.from("modelos_contrato").select("id, nome, corpo, padrao").order("padrao", { ascending: false }).order("nome");

  return (
    <>
      <CabecalhoPagina numero="06" titulo="Modelos de contrato" texto="O texto-base que vira o contrato de cada cliente, com os dados preenchidos sozinhos." />
      <Cartao titulo="Campos que você pode usar" className="mb-6">
        <p className="text-sm text-muted">Escreva o campo entre chaves duplas no texto. Exemplo: Contratante: {"{{cliente.nome}}"}</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CAMPOS_MODELO.map((c) => (
            <li key={c}>
              <code className="rounded-sm border border-line bg-soft px-2 py-1 text-xs text-text">{`{{${c}}}`}</code>
            </li>
          ))}
        </ul>
      </Cartao>
      <div className="flex flex-col gap-6">
        {(modelos ?? []).map((m) => (
          <Cartao key={m.id} titulo={m.padrao ? `${m.nome} · padrão` : m.nome}>
            <FormModelo modelo={m} />
          </Cartao>
        ))}
        <Cartao titulo="Novo modelo">
          <FormModelo />
        </Cartao>
      </div>
    </>
  );
}
