import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ROTULO_FUNCAO, ROTULO_PAPEL, type FuncaoEquipe, type Papel } from "@/lib/tipos";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { FormMembro } from "@/components/agencia/form-membro";

export const metadata: Metadata = { title: "Equipe" };

type Membro = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  funcao: FuncaoEquipe | null;
  ativo: boolean;
  clientes: { cliente: { nome: string } | null }[];
};

export default async function Equipe() {
  await exigirPapel("admin");
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("perfis")
    .select("id, nome, email, papel, funcao, ativo, clientes:equipe_clientes(cliente:clientes(nome))")
    .in("papel", ["admin", "equipe"])
    .order("nome");
  if (error) throw error;
  const membros = (data ?? []) as unknown as Membro[];

  return (
    <>
      <CabecalhoPagina numero="03" titulo="Equipe" texto="Quem trabalha na agência e quais clientes cada pessoa atende." />
      <Cartao titulo="Pessoas">
        {membros.length === 0 ? (
          <Vazio titulo="Ninguém cadastrado" />
        ) : (
          <ul className="divide-y divide-line">
            {membros.map((m) => (
              <li key={m.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0">
                  <p className="font-medium text-text">
                    {m.nome || m.email}
                    {!m.ativo && <span className="ml-2 text-xs text-danger">Inativo</span>}
                  </p>
                  <p className="text-xs break-all text-muted">{m.email}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="text-text">{m.funcao ? ROTULO_FUNCAO[m.funcao] : ROTULO_PAPEL[m.papel]}</p>
                  <p className="text-xs text-muted">
                    {m.papel === "admin"
                      ? "Acesso a todos os clientes"
                      : m.clientes.map((c) => c.cliente?.nome).filter(Boolean).join(", ") || "Nenhum cliente atribuído"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Convidar pessoa" className="mt-6">
        <p className="mb-5 text-sm text-muted">A pessoa recebe um convite por e-mail e cria a própria senha no primeiro acesso.</p>
        <FormMembro />
      </Cartao>
    </>
  );
}
