"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";

export function VerificacaoCodigo({ destino = "/inicio" }: { destino?: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function verificar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const codigo = String(new FormData(evento.currentTarget).get("codigo") ?? "").replace(/\D/g, "");
    if (codigo.length !== 6) return setErro("O código tem 6 números.");
    setEnviando(true);
    setErro(undefined);
    const supabase = criarClienteNavegador();
    const { data: fatores, error: erroFatores } = await supabase.auth.mfa.listFactors();
    const fator = fatores?.totp.find((f) => f.status === "verified");
    if (erroFatores || !fator) {
      setEnviando(false);
      return setErro("Não encontramos o autenticador desta conta. Fale com o suporte.");
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigo });
    if (error) {
      setEnviando(false);
      return setErro(error.status === 429 ? "Muitas tentativas. Espere alguns minutos." : "Código incorreto ou vencido.");
    }
    router.replace(destino);
    router.refresh();
  }

  return (
    <form onSubmit={verificar} className="mt-8 flex flex-col gap-5" noValidate>
      <Campo
        rotulo="Código"
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        pattern="[0-9]*"
        erro={erro}
        autoFocus
        className="tracking-[0.4em]"
      />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Confirmando..." : "Confirmar"}
      </Botao>
    </form>
  );
}
