"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ACESSOS, ROTULO_ACESSO, type StatusAcesso, type TipoAcesso } from "@/lib/acessos";
import { concluirAcessos, marcarAcesso } from "@/app/entrada/acoes";
import { Botao } from "@/components/ui/botao";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { CartaoStatus, SeloStatus } from "@/components/ui/status";
import type { StatusItem } from "@/lib/status";

type Item = { tipo: TipoAcesso; status: StatusAcesso; observacao: string };

const PARA_STATUS: Record<StatusAcesso, StatusItem> = {
  pendente: "a_fazer",
  liberado: "aguardando_aprovacao",
  nao_tenho: "concluido",
  ajuda: "ajuste_solicitado",
  confirmado: "concluido",
};

const OPCOES: { status: StatusAcesso; rotulo: string }[] = [
  { status: "liberado", rotulo: "Já liberei" },
  { status: "nao_tenho", rotulo: "Não tenho essa conta" },
  { status: "ajuda", rotulo: "Preciso de ajuda" },
];

export function ChecklistAcessos({ itens, concluida, emailAgencia }: { itens: Item[]; concluida: boolean; emailAgencia: string | null }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Record<string, Item>>(() => Object.fromEntries(itens.map((i) => [i.tipo, i])));
  const [erro, setErro] = useState<string>();
  const [pendente, iniciar] = useTransition();

  async function marcar(tipo: TipoAcesso, status: StatusAcesso) {
    const anterior = estado[tipo];
    if (anterior?.status === "confirmado") return;
    setEstado((e) => ({ ...e, [tipo]: { ...e[tipo], status } }));
    const r = await marcarAcesso(tipo, status, estado[tipo]?.observacao);
    if (!r.ok) {
      setErro(r.erro);
      setEstado((e) => ({ ...e, [tipo]: anterior }));
    }
  }

  async function salvarObservacao(tipo: TipoAcesso) {
    const item = estado[tipo];
    if (!item) return;
    const r = await marcarAcesso(tipo, item.status === "confirmado" ? "liberado" : item.status, item.observacao);
    if (!r.ok) setErro(r.erro);
  }

  const faltam = Object.values(estado).filter((i) => i.status === "pendente").length;

  return (
    <div className="mt-8 flex flex-col gap-4">
      {emailAgencia && (
        <p className="text-sm text-muted">
          E-mail da agência para os convites: <strong className="break-all text-text">{emailAgencia}</strong>
        </p>
      )}
      {ACESSOS.map((a) => {
        const item = estado[a.tipo] ?? { tipo: a.tipo, status: "pendente" as StatusAcesso, observacao: "" };
        const status = PARA_STATUS[item.status];
        return (
          <CartaoStatus key={a.tipo} status={status} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="font-sans text-base font-semibold text-text">{a.titulo}</h2>
              <SeloStatus status={status} rotulo={ROTULO_ACESSO[item.status]} />
            </div>
            <ol className="texto-status mt-3 list-decimal space-y-1 pl-5 text-sm text-text">
              {a.passos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            {item.status !== "confirmado" && (
              <div role="group" aria-label={`Situação de ${a.titulo}`} className="mt-4 flex flex-wrap gap-2">
                {OPCOES.map((o) => (
                  <button
                    key={o.status}
                    type="button"
                    aria-pressed={item.status === o.status}
                    onClick={() => void marcar(a.tipo, item.status === o.status ? "pendente" : o.status)}
                    className={`min-h-11 rounded-full border px-4 text-sm transition-colors duration-200 ${
                      item.status === o.status ? "border-brown bg-brown text-bg" : "border-line bg-bg text-text hover:border-brown"
                    }`}
                  >
                    {o.rotulo}
                  </button>
                ))}
              </div>
            )}
            <label className="mt-4 flex flex-col gap-1.5 text-sm text-text">
              Observação (opcional)
              <input
                value={item.observacao}
                maxLength={1000}
                onChange={(e) => setEstado((s) => ({ ...s, [a.tipo]: { ...item, observacao: e.target.value } }))}
                onBlur={() => void salvarObservacao(a.tipo)}
                className="min-h-11 rounded-md border border-line bg-bg px-3 text-base outline-none focus:border-brown"
              />
            </label>
          </CartaoStatus>
        );
      })}

      {erro && (
        <p role="alert" className="text-sm text-danger">
          {erro}
        </p>
      )}

      {concluida ? (
        <Botao className="self-start" onClick={() => router.push("/entrada")}>
          Continuar
        </Botao>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <Botao
            disabled={faltam > 0 || pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await concluirAcessos();
                if (!r.ok) return setErro(r.erro);
                navegarDepoisDeSalvar(r.destino ?? "/entrada");
              })
            }
          >
            {pendente ? "Salvando..." : "Concluir checklist"}
          </Botao>
          {faltam > 0 && (
            <p className="text-xs text-muted">
              {faltam === 1 ? "Responda o item que falta para continuar." : `Responda os ${faltam} itens que faltam para continuar.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
