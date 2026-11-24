"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { ETAPAS_PUBLICAS } from "./etapas";
import type { StatusItem } from "@/lib/status";

type Estado = { etapa: string; status: StatusItem };

/** Progresso da entrada. Etapas concluídas ficam oliva com check; a atual em destaque. */
export function BarraEtapas({ estados, atual }: { estados: Estado[]; atual: string | null }) {
  const caminho = usePathname();
  const feitas = estados.filter((e) => e.status === "concluido").length;
  const pct = Math.round((feitas / ETAPAS_PUBLICAS.length) * 100);

  return (
    <nav aria-label="Etapas da entrada">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Sua entrada na agência</p>
        <p className="text-xs text-muted">
          {feitas} de {ETAPAS_PUBLICAS.length} etapas
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Progresso da entrada"
        className="h-1.5 overflow-hidden rounded-full bg-soft"
      >
        <div className="h-full rounded-full bg-st-done transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-4 grid grid-cols-6 gap-1">
        {ETAPAS_PUBLICAS.map((etapa, i) => {
          const estado = estados.find((e) => e.etapa === etapa.id);
          const concluida = estado?.status === "concluido";
          const eAtual = atual === etapa.id;
          const aqui = caminho === etapa.rota;
          const liberada = concluida || eAtual;
          const conteudo = (
            <>
              <span
                aria-hidden
                className={`flex size-8 items-center justify-center rounded-full border text-sm transition-colors duration-200 ${
                  concluida
                    ? "border-st-done bg-st-done text-bg"
                    : eAtual
                      ? "border-brown bg-brown text-bg"
                      : "border-line bg-bg text-muted"
                }`}
              >
                {concluida ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={`mt-1.5 hidden text-center text-xs leading-tight sm:block ${aqui ? "font-semibold text-brown-dark" : "text-muted"}`}>
                {etapa.rotulo}
              </span>
              <span className="sr-only">
                {etapa.rotulo}: {concluida ? "concluída" : eAtual ? "etapa atual" : "ainda não liberada"}
              </span>
            </>
          );
          return (
            <li key={etapa.id} className="flex flex-col items-center">
              {liberada ? (
                <Link href={etapa.rota} aria-current={aqui ? "step" : undefined} className="flex min-h-11 flex-col items-center rounded-md px-1">
                  {conteudo}
                </Link>
              ) : (
                <span className="flex min-h-11 flex-col items-center px-1 opacity-70">{conteudo}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-sm font-medium text-brown-dark sm:hidden">
        {ETAPAS_PUBLICAS.find((e) => e.rota === caminho)?.rotulo ?? ""}
      </p>
    </nav>
  );
}
