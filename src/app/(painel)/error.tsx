"use client";

import { Botao } from "@/components/ui/botao";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-st-fix/40 bg-card p-8">
      <h1 className="text-3xl">Não foi possível carregar esta tela</h1>
      <p className="mt-2 text-sm text-muted">
        Pode ter sido uma falha de conexão. Tente de novo. Se continuar, avise a agência.
      </p>
      <Botao className="mt-6" onClick={reset}>
        Tentar de novo
      </Botao>
    </div>
  );
}
