"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "./botao";

/** Botão de formulário que desativa e troca o texto enquanto envia. */
export function BotaoEnviar({
  children,
  textoEnviando = "Salvando...",
  variante,
  className,
  name,
  value,
}: {
  children: ReactNode;
  textoEnviando?: string;
  variante?: "primario" | "secundario" | "texto";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} variante={variante} className={className} name={name} value={value}>
      {pending ? textoEnviando : children}
    </Botao>
  );
}
