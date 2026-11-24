import { Check, Circle } from "lucide-react";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Sessao } from "@/lib/sessao";
import type { StatusCliente } from "@/lib/tipos";
import { mesAtual, primeiroNome, saudacao } from "@/lib/datas";
import { CabecalhoPagina, Cartao, Vazio } from "@/components/ui/cartao";

type Conta = {
  id: string;
  nome: string;
  status: StatusCliente;
  responsavel: { nome: string; email: string } | null;
};

const ETAPAS = ["Contrato", "Briefing", "Acessos e materiais", "Primeira reunião"];

export async function InicioCliente({ sessao }: { sessao: Sessao }) {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, status, responsavel:perfis!clientes_responsavel_id_fkey(nome, email)")
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

  const emEntrada = conta.status === "convidado" || conta.status === "onboarding";

  return (
    <>
      <CabecalhoPagina
        numero="01"
        titulo={`${saudacao()}, ${primeiroNome(sessao.perfil.nome) || conta.nome}`}
        texto={`${conta.nome} · ${mesAtual()}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Cartao titulo={emEntrada ? "Sua entrada na agência" : "Este mês"}>
          {emEntrada ? (
            <>
              <p className="text-sm text-muted">
                Estas são as etapas para começarmos. Você pode parar e voltar quando quiser, nada se perde.
              </p>
              <ol className="mt-5 flex flex-col gap-3">
                {ETAPAS.map((etapa, i) => (
                  <li key={etapa} className="flex items-center gap-3 rounded-md border border-line bg-bg px-4 py-3">
                    <span aria-hidden className="num-secao w-8 text-2xl">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-sm text-text">{etapa}</span>
                    <Circle aria-hidden className="size-4 text-muted-soft" />
                    <span className="sr-only">A fazer</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted">As etapas ficam disponíveis assim que a agência enviar seu contrato.</p>
            </>
          ) : (
            <Vazio
              titulo="Tudo em dia"
              texto="Conteúdos, roteiros e agenda do mês aparecem aqui assim que a agência publicar."
            >
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-success">
                <Check aria-hidden className="size-4" /> Nenhuma pendência sua agora
              </span>
            </Vazio>
          )}
        </Cartao>

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
      </div>
    </>
  );
}
