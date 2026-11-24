"use client";

import { useState, useTransition } from "react";
import { Check, PenLine } from "lucide-react";
import { comentar, mudarSituacao, responder, type Resultado } from "@/app/(painel)/conteudos/acoes";
import { Botao } from "@/components/ui/botao";

function recarregar() {
  window.location.reload();
}

/** Botões do cliente: aprovar ou pedir ajuste com comentário. */
export function RespostaCliente({ tipo, id }: { tipo: "conteudo" | "roteiro"; id: string }) {
  const [ajuste, setAjuste] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  const enviar = (acao: "aprovar" | "ajuste") =>
    iniciar(async () => {
      setErro(undefined);
      const r: Resultado = await responder(tipo, id, acao, texto);
      if (!r.ok) return setErro(r.erro);
      recarregar();
    });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-st-review/40 bg-st-review/8 p-4">
      <p className="text-sm font-medium text-text">Este {tipo === "conteudo" ? "post" : "roteiro"} espera a sua resposta.</p>
      <div className="flex flex-wrap gap-2">
        <Botao onClick={() => enviar("aprovar")} disabled={pendente} className="border-success bg-success hover:border-success hover:bg-success/90">
          <Check aria-hidden className="size-4" /> Aprovar
        </Botao>
        <Botao variante="secundario" onClick={() => setAjuste((v) => !v)} aria-expanded={ajuste} aria-controls={`ajuste-${id}`} disabled={pendente}>
          <PenLine aria-hidden className="size-4" /> Solicitar ajuste
        </Botao>
      </div>
      {ajuste && (
        <div id={`ajuste-${id}`} className="flex flex-col gap-2">
          <label htmlFor={`texto-ajuste-${id}`} className="text-sm font-medium text-text">
            O que precisa mudar?
          </label>
          <textarea
            id={`texto-ajuste-${id}`}
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva o que precisa ser ajustado neste conteúdo."
            className="rounded-md border border-line bg-card px-3 py-2.5 text-base text-text outline-none focus:border-brown"
          />
          <Botao onClick={() => enviar("ajuste")} disabled={pendente || texto.trim().length < 3} className="self-start">
            {pendente ? "Enviando..." : "Enviar pedido de ajuste"}
          </Botao>
        </div>
      )}
      {erro && (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}

const ROTULO_ACAO: Record<string, string> = {
  aguardando_aprovacao: "Enviar para aprovação",
  em_andamento: "Voltar para produção",
  programado: "Marcar como programado",
  concluido: "Marcar como publicado",
  aprovado: "Voltar para aprovado",
};

/** Botões da agência para mudar a situação do item. */
export function SituacaoAgencia({ tipo, id, opcoes, depoisDeAjuste }: { tipo: "conteudo" | "roteiro"; id: string; opcoes: string[]; depoisDeAjuste: boolean }) {
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  if (opcoes.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <Botao
            key={o}
            variante={o === "aguardando_aprovacao" ? "primario" : "secundario"}
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await mudarSituacao(tipo, id, o);
                if (!r.ok) return setErro(r.erro);
                recarregar();
              })
            }
          >
            {o === "aguardando_aprovacao" && depoisDeAjuste
              ? "Ajuste feito: reenviar para aprovação"
              : tipo === "roteiro" && o === "concluido"
                ? "Marcar como gravado"
                : ROTULO_ACAO[o]}
          </Botao>
        ))}
      </div>
      {erro && (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}

export function NovoComentario({ tipo, id }: { tipo: "conteudo" | "roteiro"; id: string }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await comentar(tipo, id, texto);
          if (!r.ok) return setErro(r.erro);
          recarregar();
        });
      }}
    >
      <label htmlFor={`comentario-${id}`} className="sr-only">
        Escrever comentário
      </label>
      <textarea
        id={`comentario-${id}`}
        rows={2}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Escrever um comentário"
        className="rounded-md border border-line bg-bg px-3 py-2 text-base text-text outline-none focus:border-brown"
      />
      {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
      <Botao type="submit" variante="secundario" disabled={pendente || !texto.trim()} className="self-start">
        {pendente ? "Enviando..." : "Comentar"}
      </Botao>
    </form>
  );
}
