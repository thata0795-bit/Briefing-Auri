"use client";

import { useState, useTransition } from "react";
import { salvarResumoReuniao } from "@/app/(painel)/estrategia/acoes";
import { Botao } from "@/components/ui/botao";

export function ResumoReuniao({ id, inicial }: { id: string; inicial: string | null }) {
  const [texto, setTexto] = useState(inicial ?? "");
  const [msg, setMsg] = useState<string>();
  const [pendente, iniciar] = useTransition();
  return (
    <div className="mt-2 flex flex-col gap-2">
      <label htmlFor={`resumo-${id}`} className="text-xs font-medium text-muted">Resumo da reunião</label>
      <textarea
        id={`resumo-${id}`}
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="O que foi combinado, decisões e próximos passos."
        className="rounded-md border border-line bg-bg px-3 py-2 text-sm leading-relaxed text-text outline-none focus:border-brown"
      />
      <div className="flex items-center gap-3">
        <Botao
          variante="secundario"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              const r = await salvarResumoReuniao(id, texto);
              setMsg(r.ok ? "Resumo salvo. O cliente já vê." : r.erro);
            })
          }
        >
          {pendente ? "Salvando..." : "Salvar resumo"}
        </Botao>
        {msg && <p role="status" className="text-xs text-muted">{msg}</p>}
      </div>
    </div>
  );
}
