"use client";

import { startTransition, useActionState, useEffect } from "react";
import { salvarEstrategia, type Resultado } from "@/app/(painel)/estrategia/acoes";
import { Botao } from "@/components/ui/botao";

const CAMPOS = [
  { nome: "foco", rotulo: "Foco do mês", dica: "O tema central e o porquê." },
  { nome: "objetivos", rotulo: "Objetivos", dica: "Um por linha." },
  { nome: "pilares", rotulo: "Pilares de conteúdo", dica: "Um por linha. Ex.: Bastidores, Produto, Educação." },
  { nome: "metas", rotulo: "Metas do mês", dica: "Um por linha, com número quando der." },
] as const;

export type DadosEstrategia = Partial<Record<(typeof CAMPOS)[number]["nome"], string | null>>;

export function FormEstrategia({ clienteId, mes, atual, publicada }: { clienteId: string; mes: string; atual: DadosEstrategia; publicada: boolean }) {
  const [estado, acao, enviando] = useActionState<Resultado | null, FormData>(salvarEstrategia, null);
  useEffect(() => {
    if (estado?.ok) window.location.reload();
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
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="mes" value={mes} />
      {CAMPOS.map((c) => (
        <div key={c.nome} className="flex flex-col gap-1.5">
          <label htmlFor={`est-${c.nome}`} className="text-sm font-medium text-text">{c.rotulo}</label>
          <p className="text-xs text-muted">{c.dica}</p>
          <textarea
            id={`est-${c.nome}`}
            name={c.nome}
            rows={c.nome === "foco" ? 3 : 4}
            defaultValue={atual[c.nome] ?? ""}
            className="rounded-md border border-line bg-bg px-3 py-2.5 text-base leading-relaxed text-text outline-none focus:border-brown"
          />
        </div>
      ))}
      {estado && !estado.ok && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      {publicada && <p className="text-xs text-muted">A versão atual já foi publicada. Salvar cria uma versão nova, e o cliente vê a mais recente.</p>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" name="acao" value="publicar" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar e publicar para o cliente"}
        </Botao>
        <Botao type="submit" name="acao" value="rascunho" variante="secundario" disabled={enviando}>
          Salvar rascunho
        </Botao>
      </div>
    </form>
  );
}
