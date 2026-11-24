import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/sessao";
import type { StatusItem } from "@/lib/status";

export { ETAPAS_PUBLICAS } from "@/components/entrada/etapas";
export const ETAPAS = [
  { id: "boas_vindas", rotulo: "Boas-vindas", rota: "/entrada/boas-vindas" },
  { id: "contrato", rotulo: "Contrato", rota: "/entrada/contrato" },
  { id: "briefing", rotulo: "Briefing", rota: "/entrada/briefing" },
  { id: "acessos", rotulo: "Acessos", rota: "/entrada/acessos" },
  { id: "reuniao", rotulo: "Primeira reunião", rota: "/entrada/reuniao" },
] as const;

export type EtapaId = (typeof ETAPAS)[number]["id"];
export type EstadoEtapa = { etapa: EtapaId; status: StatusItem; concluido_em: string | null };

/** Versão vigente dos termos e da política. Mudou o texto, muda a versão. */
export const TERMOS_VERSAO = "2026-11-v1";

/** Conta do cliente logado e o estado das etapas. */
export const obterEntrada = cache(async () => {
  const sessao = await exigirPapel("cliente");
  const supabase = await criarClienteServidor();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nome, status, agencia_id, entrada_concluida_em, responsavel:perfis!clientes_responsavel_id_fkey(nome, email)")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!cliente) redirect("/inicio");

  const { data: etapas } = await supabase
    .from("etapas_entrada")
    .select("etapa, status, concluido_em")
    .eq("cliente_id", cliente.id);

  const porEtapa = new Map((etapas ?? []).map((e) => [e.etapa as EtapaId, e as EstadoEtapa]));
  const estados = ETAPAS.map(
    (e) => porEtapa.get(e.id) ?? ({ etapa: e.id, status: "a_fazer", concluido_em: null } as EstadoEtapa),
  );
  const atual = estados.find((e) => e.status !== "concluido")?.etapa ?? null;

  return {
    sessao,
    supabase,
    cliente: cliente as unknown as {
      id: string;
      nome: string;
      status: string;
      agencia_id: string;
      entrada_concluida_em: string | null;
      responsavel: { nome: string; email: string } | null;
    },
    estados,
    atual,
    concluida: atual === null,
  };
});

/** Barra a etapa se as anteriores não foram concluídas. */
export async function exigirEtapaLiberada(etapa: EtapaId) {
  const entrada = await obterEntrada();
  const indice = ETAPAS.findIndex((e) => e.id === etapa);
  const bloqueada = entrada.estados.slice(0, indice).some((e) => e.status !== "concluido");
  if (bloqueada) redirect("/entrada");
  return entrada;
}
