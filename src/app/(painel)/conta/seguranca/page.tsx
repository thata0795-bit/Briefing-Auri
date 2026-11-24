import type { Metadata } from "next";
import { exigirPapel } from "@/lib/sessao";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { DuasEtapas } from "@/components/auth/duas-etapas";
import { TrocarSenha } from "@/components/auth/trocar-senha";

export const metadata: Metadata = { title: "Segurança" };

export default async function Seguranca() {
  const sessao = await exigirPapel("admin", "equipe");
  return (
    <>
      <CabecalhoPagina numero="04" titulo="Segurança" texto="Senha e verificação em duas etapas do seu acesso." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Verificação em duas etapas">
          <DuasEtapas recomendado={sessao.perfil.papel === "admin"} />
        </Cartao>
        <Cartao titulo="Trocar senha">
          <TrocarSenha />
        </Cartao>
      </div>
    </>
  );
}
