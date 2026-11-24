"use client";

import { startTransition, useActionState, useEffect } from "react";
import { salvarRoteiro, type Resultado } from "@/app/(painel)/conteudos/acoes";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import type { Roteiro } from "@/lib/conteudos";

const AREAS: { nome: keyof Roteiro; rotulo: string; linhas: number; dica?: string }[] = [
  { nome: "objetivo", rotulo: "Objetivo", linhas: 2 },
  { nome: "gancho", rotulo: "Gancho", linhas: 2, dica: "O que segura a pessoa nos primeiros segundos." },
  { nome: "falas", rotulo: "Falas", linhas: 8 },
  { nome: "cenas", rotulo: "Cenas", linhas: 6, dica: "Uma cena por linha." },
  { nome: "referencias", rotulo: "Referências", linhas: 2, dica: "Links ou @ de perfis." },
  { nome: "o_que_levar", rotulo: "O que levar no dia", linhas: 3 },
];

export function FormRoteiro({ clienteId, roteiro }: { clienteId: string; roteiro?: Roteiro }) {
  const [estado, acao, enviando] = useActionState<Resultado | null, FormData>(salvarRoteiro, null);
  useEffect(() => {
    if (estado?.ok && estado.destino) navegarDepoisDeSalvar(estado.destino);
  }, [estado]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        const quem = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (quem?.value) dados.set("acao", quem.value);
        startTransition(() => acao(dados));
      }}
      className="flex max-w-2xl flex-col gap-5"
      noValidate
    >
      <input type="hidden" name="id" value={roteiro?.id ?? ""} />
      <input type="hidden" name="cliente_id" value={clienteId} />
      <Campo rotulo="Título" name="titulo" defaultValue={roteiro?.titulo} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tipo" className="text-sm font-medium text-text">Tipo</label>
          <select id="tipo" name="tipo" defaultValue={roteiro?.tipo ?? "reels"} className="min-h-11 rounded-md border border-line bg-bg px-3 text-base">
            <option value="reels">Reels</option>
            <option value="stories">Stories</option>
          </select>
        </div>
        <Campo rotulo="Data da gravação" name="data_gravacao" type="date" defaultValue={roteiro?.data_gravacao} />
      </div>
      {AREAS.map((a) => (
        <div key={a.nome} className="flex flex-col gap-1.5">
          <label htmlFor={a.nome} className="text-sm font-medium text-text">{a.rotulo}</label>
          {a.dica && <p className="text-xs text-muted">{a.dica}</p>}
          <textarea
            id={a.nome}
            name={a.nome}
            rows={a.linhas}
            defaultValue={(roteiro?.[a.nome] as string | null) ?? ""}
            className="rounded-md border border-line bg-bg px-3 py-2.5 text-base leading-relaxed text-text outline-none focus:border-brown"
          />
        </div>
      ))}
      {estado && !estado.ok && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" name="acao" value="publicar" disabled={enviando}>
          {enviando ? "Salvando..." : roteiro?.status === "ajuste_solicitado" ? "Salvar e reenviar para o cliente" : "Salvar e publicar para o cliente"}
        </Botao>
        <Botao type="submit" name="acao" value="rascunho" variante="secundario" disabled={enviando}>
          Salvar sem publicar
        </Botao>
      </div>
    </form>
  );
}
