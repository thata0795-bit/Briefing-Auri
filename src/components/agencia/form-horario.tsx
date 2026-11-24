"use client";

import { useActionState, useState } from "react";
import { criarHorarios, type EstadoHorario } from "@/app/(painel)/agenda/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Campo } from "@/components/ui/campo";

const classeSelect = "min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none focus:border-brown";

export function FormHorario({ pessoas, eu }: { pessoas: { id: string; nome: string }[]; eu: string }) {
  const [estado, acao] = useActionState<EstadoHorario, FormData>(criarHorarios, null);
  const [formato, setFormato] = useState<"online" | "presencial">("online");

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Data" name="data" type="date" required />
        <Campo rotulo="Início" name="hora" type="time" step={900} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="duracao" className="text-sm font-medium text-text">Duração</label>
          <select id="duracao" name="duracao" defaultValue="60" className={classeSelect}>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hora</option>
            <option value="90">1h30</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="repetir" className="text-sm font-medium text-text">Repetir</label>
          <select id="repetir" name="repetir" defaultValue="1" className={classeSelect}>
            <option value="1">Só esta data</option>
            <option value="2">2 semanas</option>
            <option value="4">4 semanas</option>
            <option value="8">8 semanas</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="responsavel_id" className="text-sm font-medium text-text">Quem conduz</label>
        <select id="responsavel_id" name="responsavel_id" defaultValue={eu} className={classeSelect}>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-text">Formato</legend>
        <div className="flex gap-2">
          {(["online", "presencial"] as const).map((f) => (
            <label key={f} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-md border text-sm transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brown ${formato === f ? "border-brown bg-brown text-bg" : "border-line bg-bg text-text"}`}>
              <input type="radio" name="formato" value={f} checked={formato === f} onChange={() => setFormato(f)} className="sr-only" />
              {f === "online" ? "Online" : "Presencial"}
            </label>
          ))}
        </div>
      </fieldset>
      {formato === "online" ? (
        <Campo rotulo="Link da reunião" name="link" type="url" inputMode="url" placeholder="https://meet.google.com/..." dica="Opcional. Pode enviar depois." />
      ) : (
        <Campo rotulo="Local" name="local" placeholder="Endereço" />
      )}
      {estado?.erro && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="text-sm text-success">{estado.mensagem}</p>}
      <BotaoEnviar className="self-start" textoEnviando="Abrindo...">Abrir horário</BotaoEnviar>
    </form>
  );
}
