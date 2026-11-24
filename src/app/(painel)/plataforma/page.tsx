import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { dataCurta } from "@/lib/datas";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";

export const metadata: Metadata = { title: "Plataforma" };

export default async function Plataforma() {
  const sessao = await obterSessao();
  if (!sessao.donoPlataforma) redirect("/inicio");

  // A lista de agências vem com o RLS do dono da plataforma.
  const supabase = await criarClienteServidor();
  const { data: agencias, error } = await supabase
    .from("agencias")
    .select("id, nome, slug, ativa, criado_em")
    .neq("slug", "plataforma")
    .order("criado_em");
  if (error) throw error;

  // Contagens agregadas pela chave de serviço: só números, nenhum dado de cliente.
  const admin = criarClienteAdmin();
  const contagens = await Promise.all(
    (agencias ?? []).map(async (a) => {
      const [{ count: clientes }, { count: usuarios }] = await Promise.all([
        admin.from("clientes").select("id", { count: "exact", head: true }).eq("agencia_id", a.id),
        admin.from("perfis").select("id", { count: "exact", head: true }).eq("agencia_id", a.id).neq("papel", "cliente"),
      ]);
      return { ...a, clientes: clientes ?? 0, usuarios: usuarios ?? 0 };
    }),
  );

  return (
    <>
      <CabecalhoPagina numero="00" titulo="Plataforma" texto="Agências que usam o portal. Dados dos clientes delas não aparecem aqui." />
      <Cartao titulo={`${contagens.length} agências`}>
        <ul className="divide-y divide-line">
          {contagens.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-text">{a.nome}</p>
                <p className="text-xs text-muted">
                  {a.slug} · desde {dataCurta(a.criado_em)} · {a.ativa ? "Ativa" : "Suspensa"}
                </p>
              </div>
              <p className="text-sm text-muted">
                {a.clientes} clientes · {a.usuarios} na equipe
              </p>
            </li>
          ))}
        </ul>
      </Cartao>
    </>
  );
}
