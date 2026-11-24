import Link from "next/link";
import { ArrowRight, MailOpen } from "lucide-react";
import { PERFIS_DEMO, TOKEN_CONVITE_DEMO } from "@/lib/demo/dados";

/** Na demonstração, a entrada é escolher com quem entrar. */
export function EscolhaPerfil() {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <p className="text-sm font-medium text-text">Entrar como:</p>
      <ul className="flex flex-col gap-2">
        {PERFIS_DEMO.map((p) => (
          <li key={p.id}>
            <form action="/demo/entrar" method="post">
              <input type="hidden" name="usuario" value={p.id} />
              <button
                type="submit"
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md border border-line bg-card px-4 py-3 text-left transition-colors duration-200 hover:border-brown"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-text">
                    {p.nome} <span className="font-normal text-muted">· {p.papel}</span>
                  </span>
                  <span className="block text-xs text-muted">{p.detalhe}</span>
                </span>
                <ArrowRight aria-hidden className="size-4 shrink-0 text-brown" />
              </button>
            </form>
          </li>
        ))}
      </ul>
      <Link
        href={`/convite/${TOKEN_CONVITE_DEMO}`}
        className="mt-2 flex min-h-14 items-center gap-3 rounded-md border border-dashed border-brown/60 bg-bg px-4 py-3 text-sm text-brown hover:bg-soft"
      >
        <MailOpen aria-hidden className="size-5 shrink-0" />
        <span>
          <span className="block font-medium">Começar como cliente novo</span>
          <span className="block text-xs text-muted">Abre o convite da Clínica Serena e faz a entrada do começo, como o cliente faria.</span>
        </span>
      </Link>
    </div>
  );
}
