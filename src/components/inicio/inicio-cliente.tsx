import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, Download } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Sessao } from "@/lib/sessao";
import { mesAtual, primeiroNome, saudacao } from "@/lib/datas";
import { diaSemana, hora, linkGoogleAgenda } from "@/lib/agenda";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";
import { CartaoStatus, SeloStatus } from "@/components/ui/status";

type Conta = {
  id: string;
  nome: string;
  entrada_concluida_em: string | null;
  responsavel: { nome: string; email: string } | null;
};

export async function InicioCliente({ sessao }: { sessao: Sessao }) {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, entrada_concluida_em, responsavel:perfis!clientes_responsavel_id_fkey(nome, email)")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const conta = data as unknown as Conta | null;

  if (!conta) {
    return (
      <>
        <CabecalhoPagina titulo={`${saudacao()}, ${primeiroNome(sessao.perfil.nome)}`} />
        <Vazio titulo="Sua conta ainda não foi vinculada" texto="Fale com a agência para liberar o acesso aos seus dados." />
      </>
    );
  }

  // Enquanto a entrada não termina, o lugar do cliente é o passo a passo.
  if (!conta.entrada_concluida_em) redirect("/entrada");

  const { data: proximos } = await supabase
    .from("compromissos")
    .select("id, titulo, descricao, inicio, fim, formato, local, link")
    .eq("cliente_id", conta.id)
    .gt("fim", new Date().toISOString())
    .neq("status", "cancelado")
    .order("inicio")
    .limit(3);

  return (
    <>
      <CabecalhoPagina
        numero="01"
        titulo={`${saudacao()}, ${primeiroNome(sessao.perfil.nome) || conta.nome}`}
        texto={`${conta.nome} · ${mesAtual()}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Cartao titulo="Em produção">
            <CartaoStatus status="em_andamento" className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-text">Estratégia do primeiro mês</p>
                <SeloStatus status="em_andamento" rotulo="Em preparação" />
              </div>
              <p className="mt-1 text-sm text-muted">
                A equipe está montando objetivos, pilares de conteúdo e metas a partir do seu briefing. Você recebe um aviso quando
                estiver pronta para ler e comentar.
              </p>
            </CartaoStatus>
          </Cartao>

          <Cartao titulo="Próximos compromissos">
            {(proximos ?? []).length === 0 ? (
              <p className="text-sm text-muted">Nenhum compromisso marcado.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(proximos ?? []).map((c) => (
                  <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-text">{c.titulo}</p>
                    <p className="text-sm text-muted">
                      {diaSemana(c.inicio)}, {hora(c.inicio)} às {hora(c.fim)} · {c.formato === "online" ? "Online" : c.local}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4">
                      <a href={`/api/compromissos/${c.id}/ics`} className="inline-flex min-h-11 items-center gap-1 text-sm text-brown underline-offset-4 hover:underline">
                        <Download aria-hidden className="size-4" /> Adicionar à agenda
                      </a>
                      <a
                        href={linkGoogleAgenda(c, sessao.agencia.nome)}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex min-h-11 items-center gap-1 text-sm text-brown underline-offset-4 hover:underline"
                      >
                        <CalendarPlus aria-hidden className="size-4" /> Google Agenda
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>

        <div className="flex flex-col gap-6">
          <Cartao titulo="Quem cuida da sua marca">
            {conta.responsavel ? (
              <div>
                <p className="font-serif text-2xl text-brown-dark">{conta.responsavel.nome}</p>
                <p className="mt-1 text-sm text-muted">Responsável na {sessao.agencia.nome}</p>
                <a
                  href={`mailto:${conta.responsavel.email}`}
                  className="mt-4 inline-flex min-h-11 items-center text-sm font-medium break-all text-brown underline-offset-4 hover:underline"
                >
                  {conta.responsavel.email}
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted">A agência vai definir o seu responsável em breve.</p>
            )}
          </Cartao>
          <Cartao titulo="Sua entrada">
            <p className="text-sm text-muted">Contrato, briefing, acessos e primeira reunião concluídos.</p>
            <Link href="/entrada/briefing" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brown underline-offset-4 hover:underline">
              Rever ou completar o briefing
            </Link>
          </Cartao>
        </div>
      </div>
    </>
  );
}
