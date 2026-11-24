"use client";

import { useActionState } from "react";
import { convidarMembro, type EstadoEquipe } from "@/app/(painel)/equipe/acoes";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { Campo } from "@/components/ui/campo";

const classeSelect = "min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none focus:border-brown";

export function FormMembro() {
  const [estado, acao] = useActionState<EstadoEquipe, FormData>(convidarMembro, null);
  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Campo rotulo="Nome" name="nome" />
      <Campo rotulo="E-mail" name="email" type="email" inputMode="email" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="papel" className="text-sm font-medium text-text">Acesso</label>
        <select id="papel" name="papel" defaultValue="equipe" className={classeSelect}>
          <option value="equipe">Equipe (só clientes atribuídos, sem financeiro)</option>
          <option value="admin">Admin (tudo, inclusive financeiro)</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="funcao" className="text-sm font-medium text-text">Função</label>
        <select id="funcao" name="funcao" defaultValue="social_media" className={classeSelect}>
          <option value="social_media">Social media</option>
          <option value="designer">Designer</option>
          <option value="captador">Captação</option>
          <option value="gestor">Gestão</option>
          <option value="outro">Outra</option>
        </select>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        {estado?.erro && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
        {estado?.ok && <p role="status" className="text-sm text-success">{estado.mensagem}</p>}
        <BotaoEnviar className="self-start" textoEnviando="Enviando...">Enviar convite</BotaoEnviar>
      </div>
    </form>
  );
}
