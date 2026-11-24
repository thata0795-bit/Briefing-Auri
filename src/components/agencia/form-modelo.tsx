"use client";

import { useActionState } from "react";
import { salvarModelo, type EstadoModelo } from "@/app/(painel)/configuracoes/contratos/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Campo } from "@/components/ui/campo";

type Modelo = { id: string; nome: string; corpo: string; padrao: boolean };

export function FormModelo({ modelo }: { modelo?: Modelo }) {
  const [estado, acao] = useActionState<EstadoModelo, FormData>(salvarModelo, null);
  const id = modelo?.id ?? "novo";
  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={modelo?.id ?? ""} />
      <Campo rotulo="Nome do modelo" name="nome" id={`nome-${id}`} defaultValue={modelo?.nome} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`corpo-${id}`} className="text-sm font-medium text-text">Texto do contrato</label>
        <textarea
          id={`corpo-${id}`}
          name="corpo"
          rows={modelo ? 12 : 8}
          defaultValue={modelo?.corpo}
          className="rounded-md border border-line bg-bg px-3 py-2.5 font-mono text-sm leading-relaxed text-text outline-none focus:border-brown"
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-text">
        <input type="checkbox" name="padrao" defaultChecked={modelo?.padrao} className="size-5 accent-brown" />
        Usar como modelo padrão
      </label>
      {estado?.erro && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="text-sm text-success">{estado.mensagem}</p>}
      <BotaoEnviar variante="secundario" className="self-start">Salvar modelo</BotaoEnviar>
    </form>
  );
}
