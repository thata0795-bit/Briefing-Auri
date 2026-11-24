import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/ui/cartao";
import { FormNovoCliente } from "@/components/agencia/form-novo-cliente";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NovoCliente() {
  await exigirPapel("admin");
  const supabase = await criarClienteServidor();
  const [{ data: equipe }, { data: modelo }] = await Promise.all([
    supabase.from("perfis").select("id, nome, papel, funcao").in("papel", ["admin", "equipe"]).eq("ativo", true).order("nome"),
    supabase.from("modelos_contrato").select("id, nome").eq("padrao", true).maybeSingle(),
  ]);
  return (
    <>
      <CabecalhoPagina
        numero="02"
        titulo="Novo cliente"
        texto="O cliente recebe um convite por e-mail e começa a entrada pelo celular: contrato, briefing, acessos e primeira reunião."
      />
      <FormNovoCliente pessoas={equipe ?? []} modeloPadrao={modelo?.nome ?? null} />
    </>
  );
}
