import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, Download, MapPin, Video } from "lucide-react";
import { exigirEtapaLiberada } from "@/lib/entrada";
import { chaveDia, diaSemana, hora, linkGoogleAgenda } from "@/lib/agenda";
import { EscolhaHorario } from "@/components/entrada/escolha-horario";

export const metadata: Metadata = { title: "Primeira reunião" };

export default async function Reuniao() {
  const { supabase, cliente, estados, sessao } = await exigirEtapaLiberada("reuniao");
  const concluida = estados.find((e) => e.etapa === "reuniao")?.status === "concluido";

  if (concluida) {
    const { data: r } = await supabase
      .from("compromissos")
      .select("id, titulo, descricao, inicio, fim, formato, local, link, responsavel:perfis!compromissos_responsavel_id_fkey(nome)")
      .eq("cliente_id", cliente.id)
      .eq("tipo", "reuniao")
      .order("criado_em")
      .limit(1)
      .maybeSingle();
    const responsavel = (r?.responsavel as unknown as { nome: string } | null)?.nome;
    return (
      <div className="max-w-2xl">
        <span aria-hidden className="num-secao text-7xl">05</span>
        <h1 className="mt-2 text-4xl">Tudo pronto para começar</h1>
        <p className="mt-3 text-base text-text">
          Sua entrada está completa. A equipe já começou a preparar a primeira estratégia da {cliente.nome}.
        </p>
        {r && (
          <section className="mt-8 overflow-hidden rounded-lg border border-line bg-card">
            <header className="bg-brown-dark px-5 py-3">
              <h2 className="font-sans text-xs font-semibold tracking-[0.14em] text-bg uppercase">Primeira reunião marcada</h2>
            </header>
            <div className="p-5">
              <p className="font-serif text-2xl text-brown-dark">{diaSemana(r.inicio)}</p>
              <p className="text-base text-text">
                Das {hora(r.inicio)} às {hora(r.fim)}
                {responsavel ? ` com ${responsavel}` : ""}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                {r.formato === "online" ? <Video aria-hidden className="size-4" /> : <MapPin aria-hidden className="size-4" />}
                {r.formato === "online" ? "Online. O link fica aqui e no lembrete." : r.local}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`/api/compromissos/${r.id}/ics`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-sm font-medium text-brown hover:border-brown"
                >
                  <Download aria-hidden className="size-4" /> Adicionar à agenda (.ics)
                </a>
                <a
                  href={linkGoogleAgenda(r, sessao.agencia.nome)}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 text-sm font-medium text-brown hover:border-brown"
                >
                  <CalendarPlus aria-hidden className="size-4" /> Google Agenda
                </a>
              </div>
            </div>
          </section>
        )}
        <h2 className="mt-10 text-2xl">Próximos passos</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text">
          <li>Você recebe um lembrete por e-mail dois dias antes da reunião.</li>
          <li>A agência confere os acessos e o briefing antes da conversa.</li>
          <li>Depois da reunião, a estratégia do primeiro mês aparece no seu painel para você ler e comentar.</li>
        </ul>
        <Link href="/inicio" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-brown px-5 text-sm font-medium text-bg hover:bg-brown-dark">
          Ir para o painel
        </Link>
      </div>
    );
  }

  const { data: horarios } = await supabase
    .from("horarios_livres")
    .select("id, inicio, fim, formato, local, responsavel:perfis!horarios_livres_responsavel_id_fkey(nome)")
    .is("cliente_id", null)
    .gt("inicio", new Date(Date.now() + 2 * 3600 * 1000).toISOString())
    .order("inicio")
    .limit(60);

  const dias = new Map<string, { titulo: string; horarios: { id: string; rotulo: string; detalhe: string }[] }>();
  for (const h of horarios ?? []) {
    const k = chaveDia(h.inicio);
    if (!dias.has(k)) dias.set(k, { titulo: diaSemana(h.inicio), horarios: [] });
    const responsavel = (h.responsavel as unknown as { nome: string } | null)?.nome;
    dias.get(k)!.horarios.push({
      id: h.id,
      rotulo: `${hora(h.inicio)} às ${hora(h.fim)}`,
      detalhe: [h.formato === "online" ? "Online" : `Presencial${h.local ? `, ${h.local}` : ""}`, responsavel].filter(Boolean).join(" · "),
    });
  }

  return (
    <div className="max-w-3xl">
      <span aria-hidden className="num-secao text-7xl">05</span>
      <h1 className="mt-2 text-4xl">Primeira reunião</h1>
      <p className="mt-3 text-base text-text">
        Escolha o melhor horário para a nossa conversa inicial. Ela dura cerca de uma hora e serve para alinhar objetivos e o primeiro
        mês de trabalho. Horários de Brasília.
      </p>
      <EscolhaHorario dias={[...dias.values()]} />
    </div>
  );
}
