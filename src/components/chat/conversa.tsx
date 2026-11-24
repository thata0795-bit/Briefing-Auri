"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { enviarMensagem, marcarLido, novasMensagens } from "@/app/(painel)/mensagens/acoes";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { MensagemChat } from "@/lib/chat";

const INTERVALO_MS = 5000;

function horario(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}

export function Conversa({
  clienteId,
  agenciaId,
  euId,
  iniciais,
  nomeOutroLado,
}: {
  clienteId: string;
  agenciaId: string;
  euId: string;
  iniciais: MensagemChat[];
  nomeOutroLado: string;
}) {
  const [mensagens, setMensagens] = useState(iniciais);
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState<{ caminho: string; nome: string } | null>(null);
  const [subindo, setSubindo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const fimRef = useRef<HTMLDivElement>(null);
  const ultimaRef = useRef<string | null>(iniciais.at(-1)?.criado_em ?? null);

  const buscarNovas = useCallback(async () => {
    const novas = await novasMensagens(clienteId, ultimaRef.current);
    if (novas.length) {
      ultimaRef.current = novas.at(-1)!.criado_em;
      setMensagens((m) => {
        const ids = new Set(m.map((x) => x.id));
        return [...m, ...novas.filter((n) => !ids.has(n.id))];
      });
      void marcarLido(clienteId);
    }
  }, [clienteId]);

  useEffect(() => {
    void marcarLido(clienteId);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void buscarNovas();
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [clienteId, buscarNovas]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length]);

  async function anexar(arquivo: File) {
    setErro(undefined);
    if (arquivo.size > 52428800) return setErro("O arquivo passa de 50 MB.");
    setSubindo(true);
    const nome = arquivo.name.normalize("NFD").replace(/[^\w.]+/g, "-").toLowerCase().slice(-80);
    const caminho = `${agenciaId}/${clienteId}/mensagens/${crypto.randomUUID()}-${nome}`;
    const { error } = await criarClienteNavegador().storage.from("arquivos").upload(caminho, arquivo, { contentType: arquivo.type });
    setSubindo(false);
    if (error) return setErro("Não foi possível anexar. Confira o formato do arquivo.");
    setAnexo({ caminho, nome: arquivo.name });
  }

  async function enviar() {
    if (enviando || (!texto.trim() && !anexo)) return;
    setEnviando(true);
    setErro(undefined);
    const r = await enviarMensagem({ clienteId, texto, arquivo: anexo });
    setEnviando(false);
    if (!r.ok) return setErro(r.erro);
    setTexto("");
    setAnexo(null);
    await buscarNovas();
  }

  function teclas(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  }

  return (
    <div className="flex h-[min(70dvh,640px)] min-h-96 flex-col overflow-hidden rounded-lg border border-line bg-card">
      <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-label={`Conversa com ${nomeOutroLado}`}>
        {mensagens.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {mensagens.map((m) => {
              const minha = m.autor_id === euId;
              const doCliente = m.autor?.papel === "cliente";
              return (
                <li key={m.id} className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[72%] ${minha ? "self-end items-end" : "self-start items-start"}`}>
                  <span className="text-[11px] text-muted">
                    {minha ? "Você" : m.autor?.nome ?? "Alguém"}
                    {!minha && <span className="ml-1 rounded-sm bg-soft px-1 py-px">{doCliente ? "Cliente" : "Agência"}</span>} · {horario(m.criado_em)}
                  </span>
                  <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${minha ? "rounded-br-sm bg-brown text-bg" : "rounded-bl-sm bg-soft text-text"}`}>
                    {m.texto}
                    {m.arquivo_nome && (
                      <a
                        href={m.arquivo_url ?? "#"}
                        target="_blank"
                        rel="noopener"
                        className={`mt-1 flex items-center gap-1.5 underline underline-offset-2 ${minha ? "text-gold-light" : "text-brown"}`}
                      >
                        <Paperclip aria-hidden className="size-3.5 shrink-0" /> {m.arquivo_nome}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div ref={fimRef} />
      </div>

      <form
        className="flex flex-col gap-2 border-t border-line bg-bg p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        {anexo && (
          <p className="flex items-center gap-2 text-xs text-text">
            <Paperclip aria-hidden className="size-3.5" /> {anexo.nome}
            <button type="button" onClick={() => setAnexo(null)} className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md text-muted hover:text-danger">
              <X aria-hidden className="size-3.5" />
              <span className="sr-only">Remover anexo</span>
            </button>
          </p>
        )}
        {erro && <p role="alert" className="text-sm text-danger">{erro}</p>}
        <div className="flex items-end gap-2">
          <label className="inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-card text-brown hover:border-brown focus-within:outline-2 focus-within:outline-brown">
            {subindo ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Paperclip aria-hidden className="size-4" />}
            <span className="sr-only">Anexar arquivo</span>
            <input
              type="file"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void anexar(f);
                e.target.value = "";
              }}
            />
          </label>
          <label htmlFor={`mensagem-${clienteId}`} className="sr-only">
            Mensagem
          </label>
          <textarea
            id={`mensagem-${clienteId}`}
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={teclas}
            placeholder="Escreva sua mensagem"
            className="max-h-40 min-h-11 flex-1 resize-y rounded-md border border-line bg-card px-3 py-2.5 text-base text-text outline-none focus:border-brown"
          />
          <button
            type="submit"
            disabled={enviando || subindo || (!texto.trim() && !anexo)}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-md bg-brown px-3 text-sm font-medium text-bg hover:bg-brown-dark disabled:opacity-60 sm:px-4"
          >
            <Send aria-hidden className="size-4" />
            <span className="sr-only sm:not-sr-only">Enviar</span>
          </button>
        </div>
        <p className="text-[11px] text-muted">Enter envia. Shift + Enter quebra a linha. A conversa fica gravada para a equipe que atende você.</p>
      </form>
    </div>
  );
}
