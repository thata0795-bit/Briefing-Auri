import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Camera, ChevronLeft, ChevronRight, Clapperboard, Plus, Users } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { clienteDaPagina } from "@/lib/cliente-da-pagina";
import {
  ROTULO_FORMATO,
  ROTULO_STATUS_CONTEUDO,
  ROTULO_STATUS_ROTEIRO,
  deslocarMes,
  limitesDoMes,
  mesDe,
  nomeDoMes,
  type Formato,
  type TipoRoteiro,
} from "@/lib/conteudos";
import { hora } from "@/lib/agenda";
import { FUSO } from "@/lib/datas";
import type { StatusItem } from "@/lib/status";
import { CabecalhoPagina, Vazio } from "@/components/ui/cartao";
import { SeletorCliente } from "@/components/conteudos/seletor-cliente";

export const metadata: Metadata = { title: "Calendário" };

type Item = {
  chave: string;
  dia: number;
  ordem: string;
  tipo: "conteudo" | "roteiro" | "reuniao" | "captacao";
  rotulo: string;
  detalhe: string;
  status?: StatusItem;
  href?: string;
};

const COR: Partial<Record<StatusItem, string>> = {
  em_andamento: "bg-st-doing",
  aguardando_aprovacao: "bg-st-review",
  ajuste_solicitado: "bg-st-fix",
  aprovado: "bg-st-ok",
  programado: "bg-st-sched",
  concluido: "bg-st-done",
};

const LEGENDA: { status: StatusItem; rotulo: string }[] = [
  { status: "em_andamento", rotulo: "Em produção" },
  { status: "aguardando_aprovacao", rotulo: "Aguardando aprovação" },
  { status: "ajuste_solicitado", rotulo: "Ajuste solicitado" },
  { status: "aprovado", rotulo: "Aprovado" },
  { status: "programado", rotulo: "Programado" },
  { status: "concluido", rotulo: "Publicado" },
];

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function diaEmSaoPaulo(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export default async function Calendario({ searchParams }: { searchParams: Promise<{ mes?: string; cliente?: string }> }) {
  const sessao = await obterSessao();
  const { mes: mesParam, cliente: clienteParam } = await searchParams;
  const { cliente, clientes, agencia, supabase } = await clienteDaPagina(sessao, clienteParam);
  const mes = mesDe(mesParam);
  const { inicio, fim, dias, primeiroDiaSemana } = limitesDoMes(mes);

  if (!cliente) {
    return (
      <>
        <CabecalhoPagina numero="02" titulo="Calendário" />
        <Vazio titulo="Nenhum cliente por aqui" texto="Os conteúdos aparecem aqui quando houver um cliente cadastrado." />
      </>
    );
  }

  const inicioUtc = new Date(`${inicio}T00:00:00-03:00`).toISOString();
  const fimUtc = new Date(`${fim}T23:59:59-03:00`).toISOString();
  const [conteudos, roteiros, compromissos] = await Promise.all([
    supabase.from("conteudos").select("id, data_publicacao, horario, formato, titulo, status").eq("cliente_id", cliente.id).gte("data_publicacao", inicio).lte("data_publicacao", fim),
    supabase.from("roteiros").select("id, data_gravacao, tipo, titulo, status, publicado_em").eq("cliente_id", cliente.id).gte("data_gravacao", inicio).lte("data_gravacao", fim),
    supabase.from("compromissos").select("id, tipo, titulo, inicio").eq("cliente_id", cliente.id).neq("status", "cancelado").gte("inicio", inicioUtc).lte("inicio", fimUtc),
  ]);

  const q = agencia ? `?cliente=${cliente.id}` : "";
  const itens: Item[] = [
    ...(conteudos.data ?? []).map((c) => ({
      chave: `c-${c.id}`,
      dia: Number(c.data_publicacao.slice(8, 10)),
      ordem: `1${c.horario ?? "99"}`,
      tipo: "conteudo" as const,
      rotulo: c.titulo,
      detalhe: `${ROTULO_FORMATO[c.formato as Formato]}${c.horario ? ` · ${c.horario.slice(0, 5)}` : ""} · ${ROTULO_STATUS_CONTEUDO[c.status as StatusItem] ?? ""}`,
      status: c.status as StatusItem,
      href: `/conteudos/${c.id}${q}`,
    })),
    ...(roteiros.data ?? []).map((r) => ({
      chave: `r-${r.id}`,
      dia: Number(r.data_gravacao.slice(8, 10)),
      ordem: "0",
      tipo: "roteiro" as const,
      rotulo: r.titulo,
      detalhe: `Gravação · Roteiro de ${(r.tipo as TipoRoteiro) === "reels" ? "reels" : "stories"}${!r.publicado_em ? " · não publicado para o cliente" : ` · ${ROTULO_STATUS_ROTEIRO[r.status as StatusItem] ?? ""}`}`,
      status: r.status as StatusItem,
      href: `/roteiros/${r.id}${q}`,
    })),
    ...(compromissos.data ?? []).map((c) => ({
      chave: `a-${c.id}`,
      dia: Number(diaEmSaoPaulo(c.inicio).slice(8, 10)),
      ordem: `0${hora(c.inicio)}`,
      tipo: (c.tipo === "captacao" ? "captacao" : "reuniao") as Item["tipo"],
      rotulo: c.titulo,
      detalhe: `${c.tipo === "captacao" ? "Captação" : "Reunião"} · ${hora(c.inicio)}`,
    })),
  ].sort((a, b) => a.dia - b.dia || a.ordem.localeCompare(b.ordem));

  const porDia = new Map<number, Item[]>();
  for (const i of itens) porDia.set(i.dia, [...(porDia.get(i.dia) ?? []), i]);
  const hoje = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
  const linkMes = (m: string) => `/calendario?mes=${m}${agencia ? `&cliente=${cliente.id}` : ""}`;

  const Icone = ({ tipo }: { tipo: Item["tipo"] }) =>
    tipo === "roteiro" ? (
      <Clapperboard aria-hidden className="size-3 shrink-0" />
    ) : tipo === "captacao" ? (
      <Camera aria-hidden className="size-3 shrink-0" />
    ) : tipo === "reuniao" ? (
      <Users aria-hidden className="size-3 shrink-0" />
    ) : null;

  const Etiqueta = ({ i, compacta }: { i: Item; compacta?: boolean }) => {
    const corpo = (
      <>
        {i.status ? <span aria-hidden className={`mt-1 size-2 shrink-0 rounded-full ${COR[i.status]}`} /> : <Icone tipo={i.tipo} />}
        <span className="min-w-0">
          <span className={`block font-medium text-text ${compacta ? "truncate" : ""}`}>
            {i.tipo === "roteiro" && <Clapperboard aria-hidden className="mr-1 inline size-3" />}
            {i.rotulo}
          </span>
          <span className={`block text-muted ${compacta ? "truncate" : ""}`}>{i.detalhe}</span>
        </span>
      </>
    );
    const classe = `flex items-start gap-1.5 rounded-sm px-1.5 py-1 ${compacta ? "text-[11px] leading-tight" : "text-sm"} ${
      i.tipo === "captacao" || i.tipo === "reuniao" ? "bg-soft" : "bg-bg"
    }`;
    return i.href ? (
      <Link href={i.href} className={`${classe} transition-colors duration-200 hover:bg-gold-light/40`}>
        {corpo}
      </Link>
    ) : (
      <div className={classe}>{corpo}</div>
    );
  };

  return (
    <>
      <CabecalhoPagina
        numero="02"
        titulo="Calendário"
        texto={agencia ? "Posts, roteiros, reuniões e captações do cliente no mês." : "Tudo o que vai ser publicado e gravado no mês, num lugar só."}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {agencia && clientes.length > 0 ? <SeletorCliente clientes={clientes} atual={cliente.id} /> : <span />}
        {agencia && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/conteudos/novo?cliente=${cliente.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brown px-4 text-sm font-medium text-bg hover:bg-brown-dark">
              <Plus aria-hidden className="size-4" /> Novo post
            </Link>
            <Link href={`/roteiros/novo?cliente=${cliente.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-card px-4 text-sm font-medium text-brown hover:border-brown">
              <Plus aria-hidden className="size-4" /> Novo roteiro
            </Link>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href={linkMes(deslocarMes(mes, -1))} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
          <ChevronLeft aria-hidden className="size-5" />
          <span className="sr-only">Mês anterior</span>
        </Link>
        <h2 className="text-2xl sm:text-3xl" aria-live="polite">{nomeDoMes(mes)}</h2>
        <Link href={linkMes(deslocarMes(mes, 1))} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card text-brown hover:border-brown">
          <ChevronRight aria-hidden className="size-5" />
          <span className="sr-only">Próximo mês</span>
        </Link>
      </div>

      <ul className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted" aria-label="Legenda">
        {LEGENDA.map((l) => (
          <li key={l.status} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${COR[l.status]}`} />
            {l.rotulo}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5"><Clapperboard aria-hidden className="size-3" /> Roteiro (dia da gravação)</li>
        <li className="inline-flex items-center gap-1.5"><Camera aria-hidden className="size-3" /> Captação</li>
        <li className="inline-flex items-center gap-1.5"><Users aria-hidden className="size-3" /> Reunião</li>
      </ul>

      {/* Grade do mês (tela média e grande) */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-1.5" role="presentation">
          {SEMANA.map((d) => (
            <div key={d} className="pb-1 text-center text-xs font-semibold tracking-wide text-muted uppercase">{d}</div>
          ))}
          {Array.from({ length: primeiroDiaSemana }, (_, i) => (
            <div key={`v${i}`} />
          ))}
          {Array.from({ length: dias }, (_, i) => {
            const d = i + 1;
            const data = `${mes}-${String(d).padStart(2, "0")}`;
            const lista = porDia.get(d) ?? [];
            return (
              <div key={d} className={`flex min-h-28 min-w-0 flex-col gap-1 rounded-md border bg-card p-1.5 ${data === hoje ? "border-brown" : "border-line"}`}>
                <span className={`text-xs font-semibold ${data === hoje ? "text-brown" : "text-muted"}`}>
                  {d}
                  {data === hoje && <span className="sr-only"> (hoje)</span>}
                </span>
                {lista.map((i) => (
                  <Etiqueta key={i.chave} i={i} compacta />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista por dia (celular) */}
      <div className="md:hidden">
        {itens.length === 0 ? (
          <Vazio titulo="Nada neste mês ainda" texto="Quando a agência programar posts, roteiros ou compromissos, eles aparecem aqui." />
        ) : (
          <ol className="flex flex-col gap-4">
            {[...porDia.entries()].map(([d, lista]) => {
              const data = `${mes}-${String(d).padStart(2, "0")}`;
              const [a, m] = mes.split("-").map(Number);
              const titulo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(a, m - 1, d)));
              return (
                <li key={d}>
                  <p className={`mb-1.5 text-sm font-semibold capitalize ${data === hoje ? "text-brown" : "text-text"}`}>{titulo}</p>
                  <div className="flex flex-col gap-1.5">
                    {lista.map((i) => (
                      <Etiqueta key={i.chave} i={i} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {itens.length === 0 && (
        <p className="mt-6 hidden text-sm text-muted md:block">
          <CalendarClock aria-hidden className="mr-1 inline size-4" />
          Nada programado neste mês ainda.
        </p>
      )}
    </>
  );
}
