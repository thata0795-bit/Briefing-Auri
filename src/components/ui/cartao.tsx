import type { ReactNode } from "react";

/** Cartão padrão: cabeçalho marrom escuro com texto off white, corpo branco. */
export function Cartao({
  titulo,
  acao,
  children,
  className = "",
}: {
  titulo?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-lg border border-line bg-card ${className}`}>
      {titulo && (
        <header className="flex items-center justify-between gap-3 bg-brown-dark px-5 py-3">
          <h2 className="font-sans text-xs font-semibold tracking-[0.14em] text-bg uppercase">{titulo}</h2>
          {acao}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Vazio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-line bg-bg px-5 py-8">
      <p className="font-serif text-xl text-brown-dark">{titulo}</p>
      {texto && <p className="max-w-prose text-sm text-muted">{texto}</p>}
      {children}
    </div>
  );
}

export function CabecalhoPagina({ numero, titulo, texto }: { numero?: string; titulo: string; texto?: string }) {
  return (
    <div className="mb-8 flex items-end gap-4">
      {numero && (
        <span aria-hidden className="num-secao text-6xl sm:text-7xl">
          {numero}
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-3xl leading-tight sm:text-4xl">{titulo}</h1>
        {texto && <p className="mt-1 text-sm text-muted">{texto}</p>}
      </div>
    </div>
  );
}
