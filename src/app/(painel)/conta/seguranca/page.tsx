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
        <Vazio
          titulo="Desligado na demonstração"
          texto="Na versão real, aqui a pessoa troca a senha e liga a verificação em duas etapas, que pede um código do celular a cada entrada."
        />
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
