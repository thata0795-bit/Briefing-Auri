import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { StatusCliente } from "@/lib/tipos";
import { dataCurta } from "@/lib/datas";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { SeloStatusCliente } from "@/components/ui/selo";

export const metadata: Metadata = { title: "Clientes" };

type Linha = {
  id: string;
  nome: string;
  segmento: string | null;
  status: StatusCliente;
  criado_em: string;
  responsavel: { nome: string } | null;
  equipe: { perfil: { nome: string } | null }[];
};

export default async function Clientes() {
  const sessao = await exigirPapel("admin", "equipe");
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id, nome, segmento, status, criado_em, responsavel:perfis!clientes_responsavel_id_fkey(nome), equipe:equipe_clientes(perfil:perfis(nome))",
    )
    .order("nome");
  if (error) throw error;
  const clientes = (data ?? []) as unknown as Linha[];

  return (
    <>
      <CabecalhoPagina
        numero="02"
        titulo="Clientes"
        texto={
          sessao.perfil.papel === "admin"
            ? "Todos os clientes da agência."
            : "Os clientes que você atende."
        }
      />
      <Cartao
        titulo={`${clientes.length} ${clientes.length === 1 ? "cliente" : "clientes"}`}
      >
        {clientes.length === 0 ? (
          <Vazio
            titulo="Nenhum cliente encontrado"
            texto="Os clientes aparecem aqui depois do cadastro e do convite."
          />
        ) : (
          <>
            <ul className="divide-y divide-line sm:hidden">
              {clientes.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-text">{c.nome}</p>
                    {c.segmento && (
                      <p className="text-xs text-muted">{c.segmento}</p>
                    )}
                  </div>
                  <span>
                    <SeloStatusCliente status={c.status} />
                  </span>
                  <p className="text-xs text-muted">
                    Equipe:{" "}
                    {c.equipe
                      .map((e) => e.perfil?.nome)
                      .filter(Boolean)
                      .join(", ") || "sem equipe"}{" "}
                    · desde {dataCurta(c.criado_em)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="-mx-5 -my-5 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-soft text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Cliente
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Equipe
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Desde
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {clientes.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-text">{c.nome}</p>
                        {c.segmento && (
                          <p className="text-xs text-muted">{c.segmento}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <SeloStatusCliente status={c.status} />
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {c.equipe
                          .map((e) => e.perfil?.nome)
                          .filter(Boolean)
                          .join(", ") || "Sem equipe"}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-muted">
                        {dataCurta(c.criado_em)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Cartao>
    </>
  );
}
