import type { Metadata } from "next";
import Image from "next/image";
import { VerificacaoCodigo } from "@/components/auth/verificacao-codigo";

export const metadata: Metadata = { title: "Verificação" };

export default function Verificacao() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-start bg-bg px-4 py-12 sm:justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex size-16 items-center justify-center rounded-md bg-brown-mid">
          <Image src="/brand/monograma-dourado.png" alt="" width={521} height={488} className="h-auto w-10" />
        </div>
        <h1 className="text-4xl">Confirme que é você</h1>
        <p className="mt-2 text-sm text-muted">Abra o aplicativo autenticador e digite o código de 6 números.</p>
        <VerificacaoCodigo />
      </div>
    </main>
  );
}
