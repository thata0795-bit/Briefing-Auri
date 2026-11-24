import { DEMO } from "@/lib/demo/config";

/** Faixa fixa no topo da demonstração. */
export function BarraDemo() {
  if (!DEMO) return null;
  return (
    <div className="border-b border-gold/60 bg-gold-light/60 px-4 py-2 text-sm text-brown-dark">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>
          <strong className="font-semibold">Demonstração.</strong> Dados fictícios. O que você fizer fica só no seu navegador e não
          vale para ninguém.
        </p>
        <form action="/demo/recomecar" method="post">
          <button type="submit" className="min-h-9 font-medium underline underline-offset-4 hover:text-brown">
            Recomeçar a demonstração
          </button>
        </form>
      </div>
    </div>
  );
}
