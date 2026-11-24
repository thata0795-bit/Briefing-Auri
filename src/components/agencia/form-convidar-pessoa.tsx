"use client";

import { useActionState, useState } from "react";
import { convidarPessoaDoCliente, type Estado } from "@/app/(painel)/clientes/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";

/** Convida mais alguém da empresa do cliente (sócio, gerente de marketing). */
export function FormConvidarPessoa({ clienteId }: { clienteId: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao] = useActionState<Estado, FormData>(convidarPessoaDoCliente, null);

  if (!aberto) {
    return (
      <div className="mt-4 flex flex-col items-start gap-2">
        {estado?.ok && <p role="status" className="text-sm text-success">{estado.mensagem}</p>}
        <Botao variante="texto" className="px-0" onClick={() => setAberto(true)}>
          Convidar outra pessoa da empresa
        </Botao>
      </div>
    );
  }

  return (
    <form
      action={async (d) => {
        await acao(d);
      }}
      className="mt-5 flex flex-col gap-4 border-t border-line pt-5"
      noValidate
    >
      <input type="hidden" name="cliente_id" value={clienteId} />
      <Campo rotulo="Nome" name="nome" erro={estado?.campos?.nome} />
      <Campo rotulo="E-mail" name="email" type="email" inputMode="email" erro={estado?.campos?.email} />
      {estado && !estado.ok && !estado.campos && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      {estado?.ok && <p role="status" className="text-sm text-success">{estado.mensagem}</p>}
      <div className="flex gap-3">
        <BotaoEnviar textoEnviando="Enviando...">Enviar convite</BotaoEnviar>
        <Botao variante="secundario" type="button" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
