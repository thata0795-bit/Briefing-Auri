import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Paperclip } from "lucide-react";
import { exigirPapel } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ETAPAS } from "@/lib/entrada";
import { SECOES, respondida, visivel, type Respostas } from "@/lib/briefing/perguntas";
import { ACESSOS, ROTULO_ACESSO, type StatusAcesso } from "@/lib/acessos";
import { dataCurta } from "@/lib/datas";
import { diaSemana, hora } from "@/lib/agenda";
import type { StatusItem } from "@/lib/status";
import type { StatusCliente } from "@/lib/tipos";
import { Cartao, Vazio } from "@/components/ui/cartao";
import { CartaoStatus, SeloStatus } from "@/components/ui/status";
import { SeloStatusCliente } from "@/components/ui/selo";
import { BotaoEnviar } from "@/components/ui/botao-enviar";
import { confirmarAcesso, enviarContrato, marcarContratoAssinadoManual, reenviarConvite } from "../acoes";
import { FormConvidarPessoa } from "@/components/agencia/form-convidar-pessoa";
import { FormEquipeCliente } from "@/components/agencia/form-equipe-cliente";
import { DEMO } from "@/lib/demo/config";

export const metadata: Metadata = { title: "Cliente" };

const STATUS_ACESSO: Record<StatusAcesso, StatusItem> = {
  pendente: "a_fazer",
  liberado: "aguardando_aprovacao",
  nao_tenho: "concluido",
  ajuda: "ajuste_solicitado",
  confirmado: "concluido",
};

export default async function FichaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ convidado?: string }>;
}) {
  const sessao = await exigirPapel("admin", "equipe");
  const admin = sessao.perfil.papel === "admin";
  const { id } = await params;
  const { convidado } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nome, segmento, status, criado_em, convidado_em, responsavel_id")
    .eq("id", id)
    .maybeSingle();
  if (!cliente) notFound();

  const [etapas, briefing, acessos, compromissos, pessoas, equipe, contrato, modelos, arquivos, pessoasAgencia] = await Promise.all([
    supabase.from("etapas_entrada").select("etapa, status, concluido_em").eq("cliente_id", id),
    supabase.from("briefings").select("respostas, puladas, concluido_em, atualizado_em").eq("cliente_id", id).maybeSingle(),
    supabase.from("acessos_cliente").select("tipo, status, observacao").eq("cliente_id", id),
    supabase.from("compromissos").select("id, titulo, inicio, fim, formato, status").eq("cliente_id", id).order("inicio"),
    supabase.from("cliente_usuarios").select("perfil:perfis(id, nome, email, termos_aceitos_em)").eq("cliente_id", id),
    supabase.from("equipe_clientes").select("user_id").eq("cliente_id", id),
    admin
      ? supabase.from("contratos").select("id, titulo, status, enviado_em, assinado_em, assinado_por, conteudo").eq("cliente_id", id).neq("status", "cancelado").order("criado_em", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    admin ? supabase.from("modelos_contrato").select("id, nome, padrao").order("nome") : Promise.resolve({ data: [] }),
    supabase.from("arquivos").select("id, nome, caminho").eq("cliente_id", id).eq("pasta", "briefing"),
    admin ? supabase.from("perfis").select("id, nome, papel").in("papel", ["admin", "equipe"]).eq("ativo", true).order("nome") : Promise.resolve({ data: [] }),
  ]);

  const respostas = (briefing.data?.respostas ?? {}) as Respostas;
  const puladas = briefing.data?.puladas ?? [];
  const caminhos = (arquivos.data ?? []).map((a) => a.caminho);
  const { data: assinados } = caminhos.length
    ? await supabase.storage.from("arquivos").createSignedUrls(caminhos, 300)
    : { data: [] };
  const linkArquivo = new Map((arquivos.data ?? []).map((a, i) => [a.id, { nome: a.nome, url: assinados?.[i]?.signedUrl }]));
  const etapaDe = new Map((etapas.data ?? []).map((e) => [e.etapa, e]));
  const pessoasCliente = (pessoas.data ?? []).map((p) => p.perfil as unknown as { id: string; nome: string; email: string; termos_aceitos_em: string | null });

  // Demonstração: sem e-mail, o convite pendente aparece como link na ficha.
  const convitesDemo = new Map<string, string>();
  if (DEMO && admin) {
    const { data } = await supabase.from("convites").select("user_id, token_demo, usado_em").eq("cliente_id", id).is("usado_em", null);
    for (const c of (data ?? []) as { user_id: string; token_demo?: string }[]) if (c.token_demo) convitesDemo.set(c.user_id, c.token_demo);
  }

  return (
    <>
      <Link href="/clientes" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-brown underline-offset-4 hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Clientes
      </Link>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl">{cliente.nome}</h1>
          <p className="mt-1 text-sm text-muted">
            {[cliente.segmento, `Cadastrado em ${dataCurta(cliente.criado_em)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <SeloStatusCliente status={cliente.status as StatusCliente} />
      </div>

      {convidado && (
        <p role="status" className="mb-6 rounded-md border border-st-done/50 bg-st-done/10 px-4 py-3 text-sm text-text">
          Cliente cadastrado e convite enviado. Você acompanha cada etapa aqui.
          {DEMO && " Na demonstração o e-mail não sai: use o link \"Abrir convite\" em Pessoas com acesso para ver o que o cliente vê."}
        </p>
      )}

      <section aria-labelledby="t-entrada">
        <h2 id="t-entrada" className="mb-3 text-2xl">Entrada</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPAS.map((e, i) => {
            const estado = etapaDe.get(e.id);
            const status = (estado?.status ?? "a_fazer") as StatusItem;
            return (
              <li key={e.id}>
                <CartaoStatus status={status} className="h-full p-4">
                  <span aria-hidden className="num-secao text-3xl">{String(i + 1).padStart(2, "0")}</span>
                  <p className="texto-status mt-1 font-medium text-text">{e.rotulo}</p>
                  <div className="mt-2">
                    <SeloStatus status={status} />
                  </div>
                  {estado?.concluido_em && <p className="texto-status mt-2 text-xs text-muted">{dataCurta(estado.concluido_em)}</p>}
                </CartaoStatus>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {admin && (
          <Cartao titulo="Contrato">
            {contrato.data ? (
              <div className="flex flex-col gap-3">
                <p className="font-medium text-text">{contrato.data.titulo}</p>
                <SeloStatus
                  status={contrato.data.status === "assinado" ? "concluido" : "aguardando_aprovacao"}
                  rotulo={contrato.data.status === "assinado" ? "Assinado" : "Aguardando assinatura"}
                />
                <p className="text-xs text-muted">
                  {contrato.data.assinado_em
                    ? `Assinado em ${dataCurta(contrato.data.assinado_em)}${contrato.data.assinado_por ? ` por ${contrato.data.assinado_por}` : ""}.`
                    : contrato.data.enviado_em
                      ? `Enviado em ${dataCurta(contrato.data.enviado_em)}.`
                      : ""}
                </p>
                <details className="rounded-md border border-line bg-bg">
                  <summary className="min-h-11 cursor-pointer px-3 py-2.5 text-sm text-brown">Ver texto do contrato</summary>
                  <div className="max-h-72 overflow-y-auto border-t border-line px-3 py-3 text-xs whitespace-pre-wrap text-text">{contrato.data.conteudo}</div>
                </details>
                {contrato.data.status === "enviado" && (
                  <form action={marcarContratoAssinadoManual}>
                    <input type="hidden" name="contrato_id" value={contrato.data.id} />
                    <BotaoEnviar variante="texto" className="px-0">Marcar como assinado fora do sistema</BotaoEnviar>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhum contrato enviado ainda.</p>
            )}
            {contrato.data?.status !== "assinado" && (modelos.data ?? []).length > 0 && (
              <form action={enviarContrato} className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
                <input type="hidden" name="cliente_id" value={id} />
                <label htmlFor="modelo_id" className="text-sm font-medium text-text">
                  Modelo
                </label>
                <select
                  id="modelo_id"
                  name="modelo_id"
                  defaultValue={(modelos.data ?? []).find((m) => m.padrao)?.id}
                  className="min-h-11 rounded-md border border-line bg-bg px-3 text-base"
                >
                  {(modelos.data ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
                <BotaoEnviar variante="secundario" className="self-start" textoEnviando="Enviando...">
                  {contrato.data ? "Gerar de novo e reenviar" : "Gerar e enviar para assinatura"}
                </BotaoEnviar>
              </form>
            )}
          </Cartao>
        )}

        <Cartao titulo="Pessoas com acesso">
          {pessoasCliente.length === 0 ? (
            <p className="text-sm text-muted">Ninguém ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {pessoasCliente.map((p) => (
                <li key={p.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-text">{p.nome}</p>
                    <p className="text-xs break-all text-muted">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SeloStatus status={p.termos_aceitos_em ? "concluido" : "a_fazer"} rotulo={p.termos_aceitos_em ? "Já entrou" : "Convite pendente"} />
                    {convitesDemo.has(p.id) && (
                      <Link href={`/convite/${convitesDemo.get(p.id)}`} className="inline-flex min-h-11 items-center text-sm font-medium text-brown underline underline-offset-4">
                        Abrir convite
                      </Link>
                    )}
                    {admin && !p.termos_aceitos_em && !DEMO && (
                      <form action={reenviarConvite}>
                        <input type="hidden" name="user_id" value={p.id} />
                        <BotaoEnviar variante="texto" className="px-0" textoEnviando="Enviando...">Reenviar</BotaoEnviar>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {admin && <FormConvidarPessoa clienteId={id} />}
        </Cartao>

        <Cartao titulo="Acessos">
          <ul className="flex flex-col gap-3">
            {ACESSOS.map((a) => {
              const item = (acessos.data ?? []).find((x) => x.tipo === a.tipo);
              const st = (item?.status ?? "pendente") as StatusAcesso;
              return (
                <li key={a.tipo}>
                  <CartaoStatus status={STATUS_ACESSO[st]} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="texto-status min-w-0">
                      <p className="text-sm font-medium text-text">{a.titulo}</p>
                      {item?.observacao && <p className="text-xs break-words text-muted">{item.observacao}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <SeloStatus status={STATUS_ACESSO[st]} rotulo={ROTULO_ACESSO[st]} />
                      {(st === "liberado" || st === "ajuda") && (
                        <form action={confirmarAcesso}>
                          <input type="hidden" name="cliente_id" value={id} />
                          <input type="hidden" name="tipo" value={a.tipo} />
                          <BotaoEnviar variante="texto" className="px-0" textoEnviando="...">Confirmar</BotaoEnviar>
                        </form>
                      )}
                    </div>
                  </CartaoStatus>
                </li>
              );
            })}
          </ul>
        </Cartao>

        <Cartao titulo="Agenda">
          {(compromissos.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Nenhum compromisso marcado.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(compromissos.data ?? []).map((c) => (
                <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-text">{c.titulo}</p>
                  <p className="text-sm text-muted">
                    {diaSemana(c.inicio)}, {hora(c.inicio)} às {hora(c.fim)} · {c.formato === "online" ? "Online" : "Presencial"}
                  </p>
                  <a href={`/api/compromissos/${c.id}/ics`} className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm text-brown underline-offset-4 hover:underline">
                    <Download aria-hidden className="size-4" /> .ics
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        {admin && (
          <Cartao titulo="Equipe do cliente" className="lg:col-span-2">
            <FormEquipeCliente
              clienteId={id}
              pessoas={(pessoasAgencia.data ?? []) as { id: string; nome: string; papel: string }[]}
              responsavelId={cliente.responsavel_id}
              equipe={(equipe.data ?? []).map((e) => e.user_id)}
            />
          </Cartao>
        )}
      </div>

      <section aria-labelledby="t-briefing" className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="t-briefing" className="text-2xl">Briefing</h2>
          <p className="text-xs text-muted">
            {briefing.data?.concluido_em
              ? `Concluído em ${dataCurta(briefing.data.concluido_em)}`
              : briefing.data?.atualizado_em
                ? `Em preenchimento, última resposta em ${dataCurta(briefing.data.atualizado_em)}`
                : ""}
          </p>
        </div>
        {Object.keys(respostas).length === 0 ? (
          <Vazio titulo="Briefing ainda não começou" texto="As respostas aparecem aqui assim que o cliente começar a preencher." />
        ) : (
          <div className="flex flex-col gap-3">
            {SECOES.map((s, i) => {
              const perguntas = s.perguntas.filter((p) => visivel(p, respostas));
              const feitas = perguntas.filter((p) => respondida(respostas[`${s.id}.${p.id}`])).length;
              return (
                <details key={s.id} className="group rounded-lg border border-line bg-card" open={i === 0}>
                  <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 px-5 py-3">
                    <span className="flex items-baseline gap-3">
                      <span aria-hidden className="num-secao text-2xl">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-medium text-text">{s.titulo}</span>
                    </span>
                    <span className="text-xs text-muted">
                      {feitas} de {perguntas.length}
                    </span>
                  </summary>
                  <dl className="grid gap-4 border-t border-line px-5 py-4 sm:grid-cols-2">
                    {perguntas.map((p) => {
                      const chave = `${s.id}.${p.id}`;
                      const v = respostas[chave];
                      return (
                        <div key={chave} className="min-w-0">
                          <dt className="text-xs font-medium text-muted">{p.rotulo}</dt>
                          <dd className="mt-0.5 text-sm break-words whitespace-pre-wrap text-text">
                            {puladas.includes(chave) ? (
                              <span className="text-muted italic">Cliente vai responder depois</span>
                            ) : !respondida(v) ? (
                              <span className="text-muted">Sem resposta</span>
                            ) : p.tipo === "arquivo" ? (
                              <ul className="flex flex-col gap-1">
                                {(v as string[]).map((aid) => {
                                  const a = linkArquivo.get(aid);
                                  return (
                                    <li key={aid}>
                                      {a?.url ? (
                                        <a href={a.url} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 text-brown underline underline-offset-2">
                                          <Paperclip aria-hidden className="size-3.5" /> {a.nome}
                                        </a>
                                      ) : (
                                        "Arquivo indisponível"
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : p.tipo === "url" ? (
                              <a href={String(v)} target="_blank" rel="noopener noreferrer" className="text-brown underline underline-offset-2">
                                {String(v)}
                              </a>
                            ) : Array.isArray(v) ? (
                              v.join(", ")
                            ) : (
                              String(v)
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
