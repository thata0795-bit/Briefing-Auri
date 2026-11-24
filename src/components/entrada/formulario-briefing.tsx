"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CloudUpload, Loader2, Paperclip, Undo2, X } from "lucide-react";
import {
  SECOES,
  acharPergunta,
  pendentes,
  progressoSecao,
  respondida,
  visivel,
  type Pergunta,
  type Respostas,
} from "@/lib/briefing/perguntas";
import {
  concluirBriefing,
  pularPergunta,
  registrarArquivoBriefing,
  removerArquivoBriefing,
  salvarResposta,
} from "@/app/entrada/acoes";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { Botao } from "@/components/ui/botao";

type EstadoSalvar = "salvando" | "salvo" | "erro";

const ATRASO_TEXTO_MS = 700;

function nomeSeguro(nome: string) {
  const base = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return base.replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "arquivo";
}

export function FormularioBriefing({
  clienteId,
  agenciaId,
  respostasIniciais,
  puladasIniciais,
  arquivosIniciais,
  concluida,
}: {
  clienteId: string;
  agenciaId: string;
  respostasIniciais: Respostas;
  puladasIniciais: string[];
  arquivosIniciais: Record<string, string>;
  concluida: boolean;
}) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<Respostas>(respostasIniciais);
  const [puladas, setPuladas] = useState<string[]>(puladasIniciais);
  const [arquivos, setArquivos] = useState<Record<string, string>>(arquivosIniciais);
  const [estados, setEstados] = useState<Record<string, EstadoSalvar>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [faltam, setFaltam] = useState<string[]>([]);
  const [erroGeral, setErroGeral] = useState<string>();
  const [concluindo, iniciarConclusao] = useTransition();
  const timers = useRef<Record<string, number>>({});
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Abre na primeira seção com pergunta obrigatória em aberto.
  const [indice, setIndice] = useState(() => {
    const p = pendentes(respostasIniciais, puladasIniciais)[0];
    const i = p ? SECOES.findIndex((s) => s.id === p.secao) : 0;
    return Math.max(0, i);
  });
  const secao = SECOES[indice];

  const enviar = useCallback(async (chave: string, valor: unknown) => {
    setEstados((e) => ({ ...e, [chave]: "salvando" }));
    const r = await salvarResposta(chave, valor);
    setEstados((e) => ({ ...e, [chave]: r.ok ? "salvo" : "erro" }));
    setErros((e) => {
      const resto = { ...e };
      delete resto[chave];
      return r.ok ? resto : { ...resto, [chave]: r.erro };
    });
    if (r.ok) setPuladas((p) => p.filter((c) => c !== chave));
  }, []);

  // Valores digitados que ainda esperam o atraso para salvar, e gravações em andamento.
  const pendentesTexto = useRef<Record<string, unknown>>({});
  const emAndamento = useRef<Set<Promise<void>>>(new Set());

  const gravar = useCallback(
    (chave: string, valor: unknown) => {
      const p = enviar(chave, valor).finally(() => emAndamento.current.delete(p));
      emAndamento.current.add(p);
      return p;
    },
    [enviar],
  );

  const mudar = useCallback(
    (p: Pergunta & { chave: string }, valor: unknown, imediato: boolean) => {
      setRespostas((r) => ({ ...r, [p.chave]: valor }));
      setFaltam((f) => f.filter((c) => c !== p.chave));
      window.clearTimeout(timers.current[p.chave]);
      if (imediato) {
        delete pendentesTexto.current[p.chave];
        void gravar(p.chave, valor);
      } else {
        setEstados((e) => ({ ...e, [p.chave]: "salvando" }));
        pendentesTexto.current[p.chave] = valor;
        timers.current[p.chave] = window.setTimeout(() => {
          delete pendentesTexto.current[p.chave];
          void gravar(p.chave, valor);
        }, ATRASO_TEXTO_MS);
      }
    },
    [gravar],
  );

  // Ao sair do campo, salva na hora o que estiver esperando.
  const descarregar = useCallback(
    (chave: string) => {
      if (!(chave in pendentesTexto.current)) return;
      window.clearTimeout(timers.current[chave]);
      const valor = pendentesTexto.current[chave];
      delete pendentesTexto.current[chave];
      void gravar(chave, valor);
    },
    [gravar],
  );

  /** Grava tudo que está esperando e aguarda as gravações em andamento. */
  const salvarTudo = useCallback(async () => {
    for (const chave of Object.keys(pendentesTexto.current)) descarregar(chave);
    await Promise.all([...emAndamento.current]);
  }, [descarregar]);

  // Avisa antes de fechar a aba com algo ainda salvando.
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (Object.values(estados).includes("salvando")) e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [estados]);

  async function alternarPulo(chave: string) {
    const pular = !puladas.includes(chave);
    setPuladas((p) => (pular ? [...p, chave] : p.filter((c) => c !== chave)));
    setFaltam((f) => f.filter((c) => c !== chave));
    const r = await pularPergunta(chave, pular);
    if (!r.ok) setErros((e) => ({ ...e, [chave]: r.erro }));
  }

  async function enviarArquivos(p: Pergunta & { chave: string }, lista: FileList) {
    const supabase = criarClienteNavegador();
    setEstados((e) => ({ ...e, [p.chave]: "salvando" }));
    for (const arquivo of Array.from(lista)) {
      if (arquivo.size > 52428800) {
        setErros((e) => ({ ...e, [p.chave]: `${arquivo.name} passa de 50 MB.` }));
        continue;
      }
      const caminho = `${agenciaId}/${clienteId}/briefing/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
      const { error } = await supabase.storage.from("arquivos").upload(caminho, arquivo, { contentType: arquivo.type });
      if (error) {
        setErros((e) => ({ ...e, [p.chave]: `Não foi possível enviar ${arquivo.name}. Confira o formato e tente de novo.` }));
        continue;
      }
      const r = await registrarArquivoBriefing({ chave: p.chave, caminho, nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type });
      if (r.ok && r.id) {
        const id = r.id;
        setArquivos((a) => ({ ...a, [id]: arquivo.name }));
        setRespostas((rs) => ({ ...rs, [p.chave]: [...((rs[p.chave] as string[]) ?? []), id] }));
      } else if (!r.ok) {
        setErros((e) => ({ ...e, [p.chave]: r.erro }));
      }
    }
    setEstados((e) => ({ ...e, [p.chave]: "salvo" }));
  }

  async function removerArquivo(chave: string, id: string) {
    setRespostas((rs) => ({ ...rs, [chave]: ((rs[chave] as string[]) ?? []).filter((x) => x !== id) }));
    const r = await removerArquivoBriefing(chave, id);
    if (!r.ok) setErros((e) => ({ ...e, [chave]: r.erro }));
  }

  function irPara(i: number) {
    setIndice(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => tituloRef.current?.focus(), 50);
  }

  function concluir() {
    setErroGeral(undefined);
    iniciarConclusao(async () => {
      await salvarTudo();
      const r = await concluirBriefing();
      if (r.ok) {
        navegarDepoisDeSalvar(r.destino ?? "/entrada");
        return;
      }
      if (!r.ok) {
        setErroGeral(r.erro);
        if (r.faltam?.length) {
          setFaltam(r.faltam);
          const primeira = acharPergunta(r.faltam[0]);
          const i = SECOES.findIndex((s) => s.id === primeira?.secao);
          if (i >= 0) irPara(i);
        }
      }
    });
  }

  const ultima = indice === SECOES.length - 1;
  const salvando = Object.values(estados).includes("salvando");
  const totalPendentes = pendentes(respostas, puladas).length;

  return (
    <div className="mt-8">
      {/* Navegação entre seções */}
      <nav aria-label="Partes do briefing" className="relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="flex gap-2 pb-2 sm:flex-wrap">
          {SECOES.map((s, i) => {
            const { feitas, total } = progressoSecao(s, respostas);
            const completa = s.perguntas.every(
              (p) => !p.obrigatoria || !visivel(p, respostas) || respondida(respostas[`${s.id}.${p.id}`]),
            );
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => irPara(i)}
                  aria-current={i === indice ? "step" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm transition-colors duration-200 ${
                    i === indice
                      ? "border-brown bg-brown text-bg"
                      : completa && feitas > 0
                        ? "border-st-done bg-st-done/10 text-text"
                        : "border-line bg-card text-text hover:border-brown"
                  }`}
                >
                  <span className="font-serif text-base">{String(i + 1).padStart(2, "0")}</span>
                  <span className="hidden md:inline">{s.titulo}</span>
                  {completa && feitas > 0 ? <Check aria-hidden className="size-3.5" /> : null}
                  <span className="sr-only">
                    {s.titulo}, {feitas} de {total} respondidas
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="mt-6 overflow-hidden rounded-lg border border-line bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 bg-brown-dark px-5 py-3">
          <h2 ref={tituloRef} tabIndex={-1} className="font-sans text-xs font-semibold tracking-[0.14em] text-bg uppercase outline-none">
            {String(indice + 1).padStart(2, "0")} · {secao.titulo}
          </h2>
          <p aria-live="polite" className="text-xs text-gold-light">
            {salvando ? "Salvando..." : Object.keys(estados).length ? "Tudo salvo" : ""}
          </p>
        </header>
        <div className="px-5 py-6">
          <p className="text-sm text-muted">{secao.descricao}</p>
          <div className="mt-6 flex flex-col gap-7">
            {secao.perguntas
              .filter((p) => visivel(p, respostas))
              .map((p) => {
                const chave = `${secao.id}.${p.id}`;
                const pc = { ...p, chave };
                return (
                  <CampoPergunta
                    key={chave}
                    pergunta={pc}
                    valor={respostas[chave]}
                    pulada={puladas.includes(chave)}
                    estado={estados[chave]}
                    erro={erros[chave] ?? (faltam.includes(chave) ? "Responda ou toque em \"Responder depois\"." : undefined)}
                    arquivos={arquivos}
                    onMudar={(v, imediato) => mudar(pc, v, imediato)}
                    onSair={() => descarregar(chave)}
                    onPular={() => void alternarPulo(chave)}
                    onArquivos={(l) => void enviarArquivos(pc, l)}
                    onRemoverArquivo={(id) => void removerArquivo(chave, id)}
                  />
                );
              })}
          </div>
        </div>
      </section>

      {erroGeral && (
        <p role="alert" className="mt-5 text-sm text-danger">
          {erroGeral}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Botao variante="secundario" onClick={() => irPara(indice - 1)} disabled={indice === 0}>
          Parte anterior
        </Botao>
        {ultima ? (
          concluida ? (
            <Botao
              onClick={async () => {
                await salvarTudo();
                router.push("/entrada");
              }}
            >
              Salvar e voltar
            </Botao>
          ) : (
            <Botao onClick={concluir} disabled={concluindo}>
              {concluindo ? "Concluindo..." : "Concluir briefing"}
            </Botao>
          )
        ) : (
          <Botao onClick={() => irPara(indice + 1)}>Próxima parte</Botao>
        )}
      </div>
      {!concluida && (
        <p className="mt-3 text-xs text-muted">
          {totalPendentes === 0
            ? "Tudo pronto para concluir."
            : `${totalPendentes} ${totalPendentes === 1 ? "pergunta obrigatória ainda sem resposta" : "perguntas obrigatórias ainda sem resposta"}.`}
          {puladas.length > 0 && ` ${puladas.length} para responder depois.`}
        </p>
      )}
    </div>
  );
}

function CampoPergunta({
  pergunta: p,
  valor,
  pulada,
  estado,
  erro,
  arquivos,
  onMudar,
  onSair,
  onPular,
  onArquivos,
  onRemoverArquivo,
}: {
  pergunta: Pergunta & { chave: string };
  valor: unknown;
  pulada: boolean;
  estado?: EstadoSalvar;
  erro?: string;
  arquivos: Record<string, string>;
  onMudar: (v: unknown, imediato: boolean) => void;
  onSair: () => void;
  onPular: () => void;
  onArquivos: (l: FileList) => void;
  onRemoverArquivo: (id: string) => void;
}) {
  const id = `q-${p.chave.replace(".", "-")}`;
  const dicaId = `${id}-dica`;
  const erroId = `${id}-erro`;
  const descricao = [p.dica ? dicaId : null, erro ? erroId : null].filter(Boolean).join(" ") || undefined;
  const classeCampo =
    "w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none transition-colors duration-200 focus:border-brown aria-[invalid=true]:border-danger";

  const rotulo = (
    <span className="text-sm font-medium text-text">
      {p.rotulo}
      {p.obrigatoria && (
        <>
          <span aria-hidden className="ml-0.5 text-brown">*</span>
          <span className="sr-only"> (obrigatória)</span>
        </>
      )}
    </span>
  );

  let controle: React.ReactNode;
  if (p.tipo === "texto" || p.tipo === "url") {
    controle = (
      <input
        id={id}
        type={p.tipo === "url" ? "url" : "text"}
        inputMode={p.tipo === "url" ? "url" : undefined}
        value={typeof valor === "string" ? valor : ""}
        onChange={(e) => onMudar(e.target.value, false)}
        onBlur={onSair}
        aria-describedby={descricao}
        aria-invalid={!!erro}
        className={`min-h-11 ${classeCampo}`}
      />
    );
  } else if (p.tipo === "texto_longo") {
    controle = (
      <textarea
        id={id}
        rows={3}
        value={typeof valor === "string" ? valor : ""}
        onChange={(e) => onMudar(e.target.value, false)}
        onBlur={onSair}
        aria-describedby={descricao}
        aria-invalid={!!erro}
        className={`min-h-24 resize-y py-2.5 leading-relaxed ${classeCampo}`}
      />
    );
  } else if (p.tipo === "escolha" || p.tipo === "multipla") {
    const multipla = p.tipo === "multipla";
    const selecionados = multipla ? ((valor as string[]) ?? []) : valor ? [valor as string] : [];
    controle = (
      <div role="group" aria-labelledby={`${id}-rotulo`} aria-describedby={descricao} className="flex flex-wrap gap-2">
        {p.opcoes!.map((op) => {
          const ativo = selecionados.includes(op);
          const cheio = multipla && !!p.max && selecionados.length >= p.max && !ativo;
          return (
            <button
              key={op}
              type="button"
              aria-pressed={ativo}
              disabled={cheio}
              onClick={() => {
                if (multipla) {
                  onMudar(ativo ? selecionados.filter((s) => s !== op) : [...selecionados, op], true);
                } else {
                  onMudar(ativo ? null : op, true);
                }
              }}
              className={`min-h-11 rounded-full border px-4 text-sm transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                ativo ? "border-brown bg-brown text-bg" : "border-line bg-bg text-text hover:border-brown"
              }`}
            >
              {ativo && <Check aria-hidden className="mr-1 -ml-1 inline size-3.5" />}
              {op}
            </button>
          );
        })}
      </div>
    );
  } else {
    const ids = (valor as string[]) ?? [];
    controle = (
      <div className="flex flex-col gap-2">
        {ids.length > 0 && (
          <ul className="flex flex-col gap-2">
            {ids.map((aid) => (
              <li key={aid} className="flex items-center justify-between gap-3 rounded-md border border-line bg-bg px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip aria-hidden className="size-4 shrink-0 text-muted" />
                  <span className="truncate">{arquivos[aid] ?? "Arquivo"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemoverArquivo(aid)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-danger"
                >
                  <X aria-hidden className="size-4" />
                  <span className="sr-only">Remover {arquivos[aid] ?? "arquivo"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <label
          htmlFor={id}
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-brown/50 bg-bg px-4 py-3 text-sm text-brown transition-colors duration-200 hover:bg-soft focus-within:outline-2 focus-within:outline-brown"
        >
          {estado === "salvando" ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CloudUpload aria-hidden className="size-4" />}
          {estado === "salvando" ? "Enviando..." : "Escolher arquivos"}
          <input
            id={id}
            type="file"
            multiple
            accept={p.aceita}
            className="sr-only"
            aria-describedby={descricao}
            onChange={(e) => {
              if (e.target.files?.length) onArquivos(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 transition-opacity duration-200 ${pulada ? "opacity-70" : ""}`}>
      {p.tipo === "escolha" || p.tipo === "multipla" ? (
        <p id={`${id}-rotulo`}>{rotulo}</p>
      ) : (
        <label htmlFor={id} id={`${id}-rotulo`}>
          {rotulo}
        </label>
      )}
      {p.dica && (
        <p id={dicaId} className="-mt-1 text-xs text-muted">
          {p.dica}
        </p>
      )}
      {controle}
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <span className="text-xs">
          {erro ? (
            <span id={erroId} role="alert" className="text-danger">
              {erro}
            </span>
          ) : estado === "salvo" && respondida(valor) ? (
            <span className="inline-flex items-center gap-1 text-success">
              <Check aria-hidden className="size-3.5" /> Salvo
            </span>
          ) : pulada ? (
            <span className="text-muted">Marcada para responder depois</span>
          ) : null}
        </span>
        {!respondida(valor) && (
          <button type="button" onClick={onPular} className="inline-flex min-h-11 items-center gap-1 text-xs text-brown underline-offset-4 hover:underline">
            {pulada ? (
              <>
                <Undo2 aria-hidden className="size-3.5" /> Responder agora
              </>
            ) : (
              "Responder depois"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
