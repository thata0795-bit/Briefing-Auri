"use client";

import { useActionState, useEffect } from "react";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { concluirBoasVindas } from "@/app/entrada/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";

export function FormBoasVindas() {
  const [estado, acao] = useActionState(concluirBoasVindas, null);
  useEffect(() => {
    if (estado?.ok && estado.destino) navegarDepoisDeSalvar(estado.destino);
  }, [estado]);
  return (
    <form action={acao} className="mt-8 flex flex-col gap-5 rounded-lg border border-line bg-card p-5">
      <label className="flex items-start gap-3 text-sm text-text">
        <input type="checkbox" name="aceite" required className="mt-0.5 size-5 shrink-0 accent-brown" />
        <span>
          Li e aceito os{" "}
          <a href="/termos" target="_blank" rel="noopener" className="font-medium text-brown underline underline-offset-2">
            Termos de uso
          </a>{" "}
          e a{" "}
          <a href="/privacidade" target="_blank" rel="noopener" className="font-medium text-brown underline underline-offset-2">
            Política de privacidade
          </a>
          , que explicam quais dados o portal guarda e para quê.
        </span>
      </label>
      {estado && !estado.ok && (
        <p role="alert" className="text-sm text-danger">
          {estado.erro}
        </p>
      )}
      <BotaoEnviar textoEnviando="Começando..." className="self-start">
        Começar
      </BotaoEnviar>
    </form>
  );
}
