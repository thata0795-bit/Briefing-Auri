"use client";

import { useState, useTransition } from "react";
import { concluirManual } from "@/app/entrada/acoes";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { Botao } from "@/components/ui/botao";

export function AceiteManual({ concluida }: { concluida: boolean }) {
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  if (concluida) {
    return (
      <Botao className="mt-8" onClick={() => navegarDepoisDeSalvar("/entrada")}>
        Continuar
      </Botao>
    );
  }
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-lg border border-line bg-card p-5">
      <label className="flex items-start gap-3 text-sm text-text">
        <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brown" />
        Li e estou de acordo com os combinados da parceria.
      </label>
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      <Botao
        className="self-start"
        disabled={!aceito || pendente}
        onClick={() =>
          iniciar(async () => {
            const r = await concluirManual();
            if (!r.ok) return setErro(r.erro);
            navegarDepoisDeSalvar(r.destino ?? "/entrada");
          })
        }
      >
        {pendente ? "Salvando..." : "Concordo e continuar"}
      </Botao>
    </div>
  );
}
