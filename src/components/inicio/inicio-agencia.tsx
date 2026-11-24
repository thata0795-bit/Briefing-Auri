import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Sessao } from "@/lib/sessao";
import type { StatusCliente } from "@/lib/tipos";
import { mesAtual, primeiroNome, saudacao } from "@/lib/datas";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeloStatusCliente } from "@/components/ui/selo";

type LinhaCliente = { id: string; nome: string; segmento: string | null; status: StatusCliente; responsavel: { nome: string } | null };

export async function InicioAgencia({ sessao }: { sessao: Sessao }) {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, segmento, status, responsavel:perfis!clientes_responsavel_id_fkey(nome)")
    .order("nome");
  if (error) throw error;
  const clientes = (data ?? []) as unknown as LinhaCliente[];

  const contar = (s: StatusCliente) => clientes.filter((c) => c.status === s).length;
  const admin = sessao.perfil.papel === "admin";

  const numeros = [
    { rotulo: "Clientes ativos", valor: contar("ativo") },
    { rotulo: "Em entrada", valor: contar("onboarding") + contar("convidado") },
    { rotulo: admin ? "Total na agência" : "Atribuídos a você", valor: clientes.length },
  ];

  return (
    <>
      <CabecalhoPagina
        numero="01"
        titulo={`${saudacao()}, ${primeiroNome(sessao.perfil.nome) || "tudo certo"}`}
        texto={`${mesAtual()} · ${sessao.agencia.nome}`}
      />

      <dl className="grid gap-4 sm:grid-cols-3">
        {numeros.map((n) => (
          <div key={n.rotulo} className="rounded-lg border border-line bg-card px-5 py-4">
            <dt className="text-xs font-medium tracking-wide text-muted uppercase">{n.rotulo}</dt>
            <dd className="mt-1 font-serif text-4xl text-brown-dark">{n.valor}</dd>
          </div>
        ))}
      </dl>

      <Cartao titulo={admin ? "Clientes da agência" : "Seus clientes"} className="mt-8">
        {clientes.length === 0 ? (
          <Vazio
            titulo="Nenhum cliente por aqui ainda"
            texto={
              admin
                ? "Cadastre o primeiro cliente para enviar o convite."
                : "Quando a agência atribuir um cliente a você, ele aparece nesta lista."
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {clientes.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/clientes/${c.id}`} className="block truncate font-medium text-brown-dark underline-offset-4 hover:underline">{c.nome}</Link>
                  <p className="text-xs text-muted">
                    {[c.segmento, c.responsavel?.nome && `Responsável: ${c.responsavel.nome}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <SeloStatusCliente status={c.status} />
              </li>
            ))}
          </ul>
        )}
        <Link href="/clientes" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-brown underline-offset-4 hover:underline">
          Ver todos os clientes
        </Link>
      </Cartao>
    </>
  );
}
