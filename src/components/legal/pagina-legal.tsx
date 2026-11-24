import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function PaginaLegal({ titulo, versao, children }: { titulo: string; versao: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="bg-brown-mid">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-8">
          <Image src="/brand/monograma-dourado.png" alt="" width={521} height={488} className="h-auto w-9" />
          <Link href="/" className="font-serif text-lg text-bg">Portal do cliente</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <h1 className="text-4xl">{titulo}</h1>
        <p className="mt-2 text-xs text-muted">Versão {versao}</p>
        <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-text [&_h2]:mt-6 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
    </div>
  );
}
