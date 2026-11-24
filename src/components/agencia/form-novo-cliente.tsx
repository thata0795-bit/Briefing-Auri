"use client";

import { startTransition, useActionState, useEffect } from "react";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { convidarCliente, type Estado } from "@/app/(painel)/clientes/acoes";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { ROTULO_FUNCAO, type FuncaoEquipe, type Papel } from "@/lib/tipos";

type Pessoa = { id: string; nome: string; papel: Papel; funcao: FuncaoEquipe | null };

const classeSelect =
  "min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none transition-colors duration-200 focus:border-brown";

function Grupo({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-line bg-card p-5 sm:p-6">
      <legend className="sr-only">{titulo}</legend>
      <div aria-hidden className="mb-5 flex items-baseline gap-3">
        <span className="num-secao text-4xl">{numero}</span>
        <span className="font-serif text-2xl text-brown-dark">{titulo}</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function FormNovoCliente({ pessoas, modeloPadrao }: { pessoas: Pessoa[]; modeloPadrao: string | null }) {
  const [estado, acao, enviando] = useActionState<Estado, FormData>(convidarCliente, null);
  useEffect(() => {
    if (estado?.ok && estado.destino) navegarDepoisDeSalvar(estado.destino);
  }, [estado]);
  const c = estado?.campos ?? {};

  return (
    <form
      onSubmit={(e) => {
        // Envio controlado: o React não limpa os campos quando volta com erro.
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        startTransition(() => acao(dados));
      }}
      className="flex flex-col gap-6"
      noValidate
    >
      <Grupo numero="01" titulo="Empresa e contato">
        <Campo rotulo="Nome da empresa" name="nome" required erro={c.nome} autoComplete="organization" />
        <Campo rotulo="Segmento" name="segmento" erro={c.segmento} dica="Opcional. Ex.: alimentação, estética." />
        <Campo rotulo="Nome do contato" name="contato_nome" required erro={c.contato_nome} autoComplete="name" />
        <Campo
          rotulo="E-mail do contato"
          name="contato_email"
          type="email"
          inputMode="email"
          required
          erro={c.contato_email}
          dica="O convite vai para este e-mail."
        />
      </Grupo>

      <Grupo numero="02" titulo="Plano e pagamento">
        <Campo rotulo="Plano" name="plano" required erro={c.plano} dica="Ex.: Plano Essencial" />
        <Campo rotulo="Valor mensal (R$)" name="valor" inputMode="decimal" required erro={c.valor} placeholder="1.500,00" />
        <Campo rotulo="Dia de vencimento" name="dia_vencimento" type="number" min={1} max={28} required erro={c.dia_vencimento} dica="De 1 a 28." />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="forma_pagamento" className="text-sm font-medium text-text">
            Forma de pagamento
          </label>
          <select id="forma_pagamento" name="forma_pagamento" defaultValue="boleto" className={classeSelect}>
            <option value="boleto">Boleto</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão de crédito</option>
          </select>
        </div>
        <Campo rotulo="Início do contrato" name="inicio_contrato" type="date" erro={c.inicio_contrato} />
      </Grupo>

      <Grupo numero="03" titulo="Quem atende">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="responsavel_id" className="text-sm font-medium text-text">
            Responsável na agência
          </label>
          <select id="responsavel_id" name="responsavel_id" defaultValue="" className={classeSelect}>
            <option value="">Definir depois</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-medium text-text">Equipe que atende este cliente</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {pessoas
              .filter((p) => p.papel === "equipe")
              .map((p) => (
                <label key={p.id} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-bg px-3 text-sm">
                  <input type="checkbox" name="equipe" value={p.id} className="size-5 accent-brown" />
                  <span>
                    {p.nome}
                    {p.funcao && <span className="text-muted"> · {ROTULO_FUNCAO[p.funcao]}</span>}
                  </span>
                </label>
              ))}
          </div>
          <p className="text-xs text-muted">Quem é admin vê todos os clientes, não precisa marcar.</p>
        </fieldset>
      </Grupo>

      <div className="rounded-lg border border-line bg-card p-5">
        <label className="flex items-start gap-3 text-sm text-text">
          <input type="checkbox" name="enviar_contrato" defaultChecked={!!modeloPadrao} disabled={!modeloPadrao} className="mt-0.5 size-5 accent-brown" />
          <span>
            Gerar e enviar o contrato junto com o convite
            <span className="block text-xs text-muted">
              {modeloPadrao ? `Usa o modelo "${modeloPadrao}".` : "Cadastre um modelo de contrato padrão para usar esta opção."}
            </span>
          </span>
        </label>
      </div>

      {estado?.erro && (
        <p role="alert" className="text-sm text-danger">
          {estado.erro}
        </p>
      )}
      <Botao type="submit" className="self-start" disabled={enviando || estado?.ok}>
        {enviando || estado?.ok ? "Enviando convite..." : "Cadastrar e enviar convite"}
      </Botao>
    </form>
  );
}
