import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { DuasEtapas } from "@/components/auth/duas-etapas";
import { TrocarSenha } from "@/components/auth/trocar-senha";
import { DEMO } from "@/lib/demo/config";
import { Vazio } from "@/components/ui/cartao";

export const metadata: Metadata = { title: "Segurança" };

export default async function Seguranca() {
  const sessao = await exigirPapel("admin", "equipe");
  return (
    <>
      <CabecalhoPagina numero="04" titulo="Segurança" texto="Senha e verificação em duas etapas do seu acesso." />
      {DEMO ? (
        <div className="flex flex-col gap-6">
          <Vazio
            titulo="Desligado na demonstração"
            texto="Na versão real, aqui a pessoa troca a senha e liga a verificação em duas etapas, que pede um código do celular a cada entrada."
          />
          {sessao.perfil.papel === "admin" && (
            <Cartao titulo="Zerar a demonstração">
              <p className="text-sm text-muted">
                Volta todos os clientes, respostas e agenda aos dados fictícios do início. Vale para todas as pessoas que estão usando a
                demonstração.
              </p>
              <form action="/demo/recomecar" method="post" className="mt-4">
                <button type="submit" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm font-medium text-brown hover:border-brown">
                  Zerar e começar de novo
                </button>
              </form>
            </Cartao>
          )}
        </div>
      ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Verificação em duas etapas">
          <DuasEtapas recomendado={sessao.perfil.papel === "admin"} />
        </Cartao>
        <Cartao titulo="Trocar senha">
          <TrocarSenha />
        </Cartao>
      </div>
      )}
    </>
  );
}
