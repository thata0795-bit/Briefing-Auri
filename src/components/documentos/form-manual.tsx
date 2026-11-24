"use client";

import { useActionState } from "react";
import { salvarManual } from "@/app/(painel)/configuracoes/manual/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";

export function FormManual({ texto }: { texto: string }) {
  const [estado, acao] = useActionState(salvarManual, null);
  return (
    <form action={acao} className="flex flex-col gap-3">
      <label htmlFor="manual" className="text-sm font-medium text-text">Texto do manual</label>
      <p className="text-xs text-muted">Use &ldquo;## Título&rdquo; para abrir um bloco e &ldquo;- &rdquo; no começo da linha para cada item da lista.</p>
      <textarea id="manual" name="manual" rows={20} defaultValue={texto} className="rounded-md border border-line bg-bg px-3 py-2.5 font-mono text-sm leading-relaxed text-text outline-none focus:border-brown" />
      {estado && <p role={estado.ok ? "status" : "alert"} className={`text-sm ${estado.ok ? "text-success" : "text-danger"}`}>{estado.msg}</p>}
      <BotaoEnviar className="self-start">Salvar manual</BotaoEnviar>
    </form>
  );
}
