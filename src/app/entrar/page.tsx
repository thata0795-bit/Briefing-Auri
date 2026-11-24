import type { Metadata } from "next";
import Image from "next/image";
import { FormularioEntrada } from "@/components/auth/formulario-entrada";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  link: "Esse link já foi usado ou passou da validade. Peça um novo abaixo.",
  "sem-acesso": "Seu acesso não está ativo. Fale com a agência.",
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; voltar?: string }>;
}) {
  const { erro, voltar } = await searchParams;
  const mensagemErro = erro ? ERROS[erro] : undefined;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="flex items-center justify-center bg-brown-mid px-6 py-10 lg:py-0">
        <Image
          src="/brand/logo-dourado.png"
          alt="Agência Taynara Castro, agência de marketing"
          width={903}
          height={685}
          priority
          className="h-auto w-40 sm:w-52 lg:w-72"
        />
      </section>

      <section className="flex items-start justify-center px-4 py-10 sm:px-8 lg:items-center">
        <div className="w-full max-w-sm">
          <h1 className="text-4xl">Portal do cliente</h1>
          <p className="mt-2 text-sm text-muted">
            Acompanhe o trabalho da agência na sua marca: briefing, conteúdos, agenda e financeiro.
          </p>

          {mensagemErro && (
            <p role="alert" className="mt-6 rounded-md border border-st-fix/40 bg-st-fix/10 px-4 py-3 text-sm text-text">
              {mensagemErro}
            </p>
          )}

          <FormularioEntrada voltar={voltar} />
        </div>
      </section>
    </main>
  );
}
