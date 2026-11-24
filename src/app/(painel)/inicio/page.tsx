import type { Metadata } from "next";
import { obterSessao } from "@/lib/sessao";
import { InicioAgencia } from "@/components/inicio/inicio-agencia";
import { InicioCliente } from "@/components/inicio/inicio-cliente";

export const metadata: Metadata = { title: "Início" };

export default async function Inicio() {
  const sessao = await obterSessao();
  return sessao.perfil.papel === "cliente" ? <InicioCliente sessao={sessao} /> : <InicioAgencia sessao={sessao} />;
}
