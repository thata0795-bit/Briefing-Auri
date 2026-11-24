"use client";

import { startTransition, useActionState, useEffect } from "react";
import { salvarRelatorio, type Resultado } from "@/app/(painel)/relatorios/acoes";
import { METRICAS, TEXTOS, type Relatorio } from "@/lib/relatorios";
import { Botao } from "@/components/ui/botao";

export function FormRelatorio({ clienteId, mes, atual }: { clienteId: string; mes: string; atual: Partial<Relatorio> | null }) {
  const [estado, acao, enviando] = useActionState<Resultado | null, FormData>(salvarRelatorio, null);
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
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="mes" value={mes} />
      <p className="text-xs text-muted">Copie os números do Instagram ou do Metricool. Deixe em branco o que não tiver.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {METRICAS.map((m) => (
          <div key={m.campo} className="flex flex-col gap-1.5">
            <label htmlFor={`rel-${m.campo}`} className="text-sm font-medium text-text">{m.rotulo}</label>
            {m.dica && <p className="text-xs text-muted">{m.dica}</p>}
            <input
              id={`rel-${m.campo}`}
              name={m.campo}
              inputMode="numeric"
              autoComplete="off"
              defaultValue={atual?.[m.campo] ?? ""}
              className="min-h-11 rounded-md border border-line bg-bg px-3 text-base text-text tabular-nums outline-none focus:border-brown"
            />
          </div>
        ))}
      </div>
      {TEXTOS.map((t) => (
        <div key={t.campo} className="flex flex-col gap-1.5">
          <label htmlFor={`rel-${t.campo}`} className="text-sm font-medium text-text">{t.rotulo}</label>
          <p className="text-xs text-muted">{t.dica}</p>
          <textarea
            id={`rel-${t.campo}`}
            name={t.campo}
            rows={3}
            defaultValue={atual?.[t.campo] ?? ""}
            className="rounded-md border border-line bg-bg px-3 py-2.5 text-base leading-relaxed text-text outline-none focus:border-brown"
          />
        </div>
      ))}
      {estado && !estado.ok && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" name="acao" value="publicar" disabled={enviando}>
          {enviando ? "Salvando..." : atual?.publicado_em ? "Salvar alterações" : "Salvar e publicar para o cliente"}
        </Botao>
        <Botao type="submit" name="acao" value="rascunho" variante="secundario" disabled={enviando}>
          {atual?.publicado_em ? "Voltar para rascunho" : "Salvar rascunho"}
        </Botao>
      </div>
    </form>
  );
}
