"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { aprovarVarios } from "@/app/(painel)/conteudos/acoes";
import { Botao } from "@/components/ui/botao";
import { SeloStatus } from "@/components/ui/status";
import type { StatusItem } from "@/lib/status";

export type ItemAprovacao = {
  tipo: "conteudo" | "roteiro";
  id: string;
  titulo: string;
  detalhe: string;
  href: string;
  status: StatusItem;
  rotuloStatus: string;
};

/** Lista do cliente com seleção para aprovar vários de uma vez. */
export function AprovarLote({ itens }: { itens: ItemAprovacao[] }) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  const chave = (i: ItemAprovacao) => `${i.tipo}:${i.id}`;
  const todos = marcados.length === itens.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 items-center gap-3 text-sm text-text">
          <input
            type="checkbox"
            checked={todos}
            onChange={() => setMarcados(todos ? [] : itens.map(chave))}
            className="size-5 accent-brown"
          />
          Marcar todos
        </label>
        <Botao
          disabled={pendente || marcados.length === 0}
          onClick={() =>
            iniciar(async () => {
              setErro(undefined);
              const r = await aprovarVarios(marcados.map((m) => ({ tipo: m.split(":")[0], id: m.split(":")[1] })));
              if (!r.ok) return setErro(r.erro);
              window.location.reload();
            })
          }
        >
          <Check aria-hidden className="size-4" />
          {pendente ? "Aprovando..." : marcados.length ? `Aprovar ${marcados.length} selecionado${marcados.length > 1 ? "s" : ""}` : "Aprovar selecionados"}
        </Botao>
      </div>
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      <ul className="flex flex-col gap-2">
        {itens.map((i) => (
          <li key={chave(i)} className="flex items-center gap-3 rounded-lg border border-st-review/40 bg-card px-3 py-2">
            <input
              type="checkbox"
              aria-label={`Selecionar ${i.titulo}`}
              checked={marcados.includes(chave(i))}
              onChange={() => setMarcados((m) => (m.includes(chave(i)) ? m.filter((x) => x !== chave(i)) : [...m, chave(i)]))}
              className="size-5 shrink-0 accent-brown"
            />
            <Link href={i.href} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center hover:underline">
              <span className="truncate font-medium text-text">{i.titulo}</span>
              <span className="truncate text-xs text-muted">{i.detalhe}</span>
            </Link>
            <span className="hidden sm:block">
              <SeloStatus status={i.status} rotulo={i.rotuloStatus} />
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Para pedir um ajuste, abra o item e toque em &ldquo;Solicitar ajuste&rdquo;.</p>
    </div>
  );
}
