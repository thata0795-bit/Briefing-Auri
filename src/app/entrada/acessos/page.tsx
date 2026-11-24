import type { Metadata } from "next";
import { exigirEtapaLiberada } from "@/lib/entrada";
import { ChecklistAcessos } from "@/components/entrada/checklist-acessos";
import type { StatusAcesso, TipoAcesso } from "@/lib/acessos";

export const metadata: Metadata = { title: "Acessos" };

export default async function Acessos() {
  const { supabase, cliente, estados, sessao } = await exigirEtapaLiberada("acessos");
  const { data } = await supabase.from("acessos_cliente").select("tipo, status, observacao").eq("cliente_id", cliente.id);
  const concluida = estados.find((e) => e.etapa === "acessos")?.status === "concluido";

  return (
    <div className="max-w-3xl">
      <span aria-hidden className="num-secao text-7xl">04</span>
      <h1 className="mt-2 text-4xl">Acessos e materiais</h1>
      <p className="mt-3 text-base text-text">
        Para trabalhar nas suas redes, a {sessao.agencia.nome} precisa de acesso às contas. Tudo é feito por convite, dentro de cada
        plataforma. Você nunca precisa passar senha.
      </p>
      <ChecklistAcessos
        itens={(data ?? []).map((d) => ({ tipo: d.tipo as TipoAcesso, status: d.status as StatusAcesso, observacao: d.observacao ?? "" }))}
        concluida={concluida}
        emailAgencia={sessao.agencia.email_contato}
      />
    </div>
  );
}
