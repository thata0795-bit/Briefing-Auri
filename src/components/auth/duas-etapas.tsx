"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";

type Estado =
  | { etapa: "carregando" }
  | { etapa: "desligado" }
  | { etapa: "cadastrando"; fatorId: string; qr: string; segredo: string }
  | { etapa: "ligado"; fatorId: string };

export function DuasEtapas({ recomendado }: { recomendado: boolean }) {
  const [estado, setEstado] = useState<Estado>({ etapa: "carregando" });
  const [erro, setErro] = useState<string>();
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const supabase = criarClienteNavegador();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setErro("Não foi possível carregar. Recarregue a página.");
      return setEstado({ etapa: "desligado" });
    }
    const verificado = data.totp.find((f) => f.status === "verified");
    // Remove cadastros que ficaram pela metade.
    await Promise.all(
      data.all.filter((f) => f.status === "unverified").map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })),
    );
    setEstado(verificado ? { etapa: "ligado", fatorId: verificado.id } : { etapa: "desligado" });
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function ativar() {
    setErro(undefined);
    setOcupado(true);
    const { data, error } = await criarClienteNavegador().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Autenticador ${new Date().toISOString().slice(0, 10)}`,
    });
    setOcupado(false);
    if (error || !data) return setErro("Não foi possível iniciar. Tente de novo.");
    setEstado({ etapa: "cadastrando", fatorId: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (estado.etapa !== "cadastrando") return;
    const codigo = String(new FormData(evento.currentTarget).get("codigo") ?? "").replace(/\D/g, "");
    if (codigo.length !== 6) return setErro("O código tem 6 números.");
    setOcupado(true);
    const { error } = await criarClienteNavegador().auth.mfa.challengeAndVerify({ factorId: estado.fatorId, code: codigo });
    setOcupado(false);
    if (error) return setErro("Código incorreto. Confira o horário do celular e tente de novo.");
    setErro(undefined);
    setEstado({ etapa: "ligado", fatorId: estado.fatorId });
  }

  async function desligar() {
    if (estado.etapa !== "ligado") return;
    setOcupado(true);
    const { error } = await criarClienteNavegador().auth.mfa.unenroll({ factorId: estado.fatorId });
    setOcupado(false);
    if (error) return setErro("Não foi possível desligar agora. Tente de novo.");
    setEstado({ etapa: "desligado" });
  }

  if (estado.etapa === "carregando") return <p className="text-sm text-muted">Carregando...</p>;

  if (estado.etapa === "ligado") {
    return (
      <div className="flex flex-col gap-4">
        <p className="inline-flex items-center gap-2 text-sm text-success">
          <ShieldCheck aria-hidden className="size-5" /> Ligada. Pedimos o código a cada nova entrada.
        </p>
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <Botao variante="secundario" onClick={desligar} disabled={ocupado} className="self-start">
          Desligar verificação
        </Botao>
      </div>
    );
  }

  if (estado.etapa === "cadastrando") {
    return (
      <form onSubmit={confirmar} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-muted">
          Escaneie o código com um aplicativo autenticador (Google Authenticator, 1Password, Authy) e digite os 6 números que aparecerem.
        </p>
        {/* O QR vem do Supabase como imagem SVG em data URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={estado.qr} alt="QR code para o aplicativo autenticador" className="size-44 rounded-md border border-line bg-card p-2" />
        <p className="text-xs text-muted">
          Sem câmera? Digite esta chave no aplicativo: <code className="break-all text-text">{estado.segredo}</code>
        </p>
        <Campo rotulo="Código do aplicativo" name="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} erro={erro} />
        <Botao type="submit" disabled={ocupado} className="self-start">
          Confirmar e ligar
        </Botao>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {recomendado
          ? "Recomendado para quem é admin: além da senha, a entrada pede um código do celular."
          : "Opcional: além da senha, a entrada pede um código do celular."}
      </p>
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      <Botao onClick={ativar} disabled={ocupado} className="self-start">
        Ligar verificação
      </Botao>
    </div>
  );
}
