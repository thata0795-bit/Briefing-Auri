import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { lerConvite } from "@/lib/convites";
import { aceitarConvite } from "./acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";

export const metadata: Metadata = { title: "Convite" };

export default async function Convite({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;
  const convite = await lerConvite(token);

  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <div className="flex justify-center bg-brown-mid px-6 py-10">
        <Image src="/brand/logo-dourado.png" alt="" width={903} height={685} priority className="h-auto w-36 sm:w-44" />
      </div>
      <div className="mx-auto w-full max-w-md px-4 py-10">
        {convite?.valido ? (
          <>
            <h1 className="text-4xl">Seu acesso está pronto</h1>
            <p className="mt-3 text-sm text-muted">
              A {convite.nomeAgencia} criou seu acesso ao portal. Toque no botão para entrar. Você não precisa criar senha.
            </p>
            {erro && (
              <p role="alert" className="mt-5 text-sm text-danger">
                {erro}
              </p>
            )}
            <form action={aceitarConvite} className="mt-8">
              <input type="hidden" name="token" value={token} />
              <BotaoEnviar className="w-full" textoEnviando="Abrindo...">
                Entrar no portal
              </BotaoEnviar>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-4xl">Esse convite não vale mais</h1>
            <p className="mt-3 text-sm text-muted">
              Ele já foi usado ou passou dos 7 dias de validade. Se você já entrou antes, peça um link de acesso com o seu e-mail.
              Se não, peça um novo convite para a agência.
            </p>
            <Link
              href="/entrar"
              className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-brown px-5 text-sm font-medium text-bg hover:bg-brown-dark"
            >
              Ir para a entrada
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
