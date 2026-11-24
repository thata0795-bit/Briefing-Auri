"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Recarrega os dados da tela de tempos em tempos, enquanto espera algo de fora (ex.: assinatura). */
export function AtualizarSozinho({ segundos = 5 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, segundos * 1000);
    return () => window.clearInterval(id);
  }, [router, segundos]);
  return null;
}
