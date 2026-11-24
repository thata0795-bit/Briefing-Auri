import type { Metadata } from "next";
import { CabecalhoPagina, Cartao } from "@/components/ui/cartao";
import { TrocarSenha } from "@/components/auth/trocar-senha";

export const metadata: Metadata = { title: "Nova senha" };

export default function NovaSenha() {
  return (
    <>
      <CabecalhoPagina titulo="Crie uma nova senha" texto="Use pelo menos 10 caracteres, com letras e números." />
      <Cartao titulo="Nova senha" className="max-w-lg">
        <TrocarSenha destino="/inicio" />
      </Cartao>
    </>
  );
}
