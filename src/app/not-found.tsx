import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm">
        <p aria-hidden className="num-secao text-8xl">404</p>
        <h1 className="mt-2 text-3xl">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted">O endereço pode ter mudado ou você não tem acesso a ele.</p>
        <Link href="/inicio" className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-brown underline underline-offset-4">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
