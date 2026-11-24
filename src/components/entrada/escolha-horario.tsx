"use client";

import { useState, useTransition } from "react";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { reservarReuniao } from "@/app/entrada/acoes";
import { Botao } from "@/components/ui/botao";
import { Vazio } from "@/components/ui/cartao";

type Dia = { titulo: string; horarios: { id: string; rotulo: string; detalhe: string }[] };

export function EscolhaHorario({ dias }: { dias: Dia[] }) {
  const [escolhido, setEscolhido] = useState<string>();
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  if (dias.length === 0) {
    return (
      <div className="mt-8">
        <Vazio
          titulo="Nenhum horário aberto agora"
          texto="A agência vai abrir novos horários em breve. Você recebe um aviso, ou pode voltar aqui mais tarde."
        />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">Horários disponíveis</legend>
        {dias.map((d) => (
          <div key={d.titulo}>
            <p className="font-serif text-xl text-brown-dark">{d.titulo}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {d.horarios.map((h) => (
                <label
                  key={h.id}
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brown ${
                    escolhido === h.id ? "border-brown bg-brown text-bg" : "border-line bg-card text-text hover:border-brown"
                  }`}
                >
                  <input type="radio" name="horario" value={h.id} className="sr-only" onChange={() => setEscolhido(h.id)} />
                  <span>
                    <span className="block text-base font-medium">{h.rotulo}</span>
                    <span className={`block text-xs ${escolhido === h.id ? "text-gold-light" : "text-muted"}`}>{h.detalhe}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      {erro && (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      )}
      <Botao
        className="self-start"
        disabled={!escolhido || pendente}
        onClick={() =>
          iniciar(async () => {
            if (!escolhido) return;
            const r = await reservarReuniao(escolhido);
            if (!r.ok) return setErro(r.erro);
            navegarDepoisDeSalvar(r.destino ?? "/entrada");
          })
        }
      >
        {pendente ? "Reservando..." : "Confirmar horário"}
      </Botao>
    </div>
  );
}
