import type { Metadata } from "next";
import { obterEntrada } from "@/lib/entrada";
import { primeiroNome } from "@/lib/datas";
import { FormBoasVindas } from "@/components/entrada/form-boas-vindas";

export const metadata: Metadata = { title: "Boas-vindas" };

const PROXIMOS = [
  { titulo: "Contrato", texto: "Você lê e assina o contrato pelo celular, com assinatura eletrônica." },
  { titulo: "Manual da parceria", texto: "Os combinados de comunicação, prazos, materiais e escopo." },
  { titulo: "Briefing", texto: "Perguntas sobre a sua marca, público e objetivos. Salva sozinho a cada resposta." },
  { titulo: "Acessos", texto: "Você libera Instagram, Meta e Google para a agência, sem passar senha." },
  { titulo: "Primeira reunião", texto: "Você escolhe o melhor horário para a nossa conversa inicial." },
];

export default async function BoasVindas() {
  const { sessao, cliente, estados } = await obterEntrada();
  const concluida = estados.find((e) => e.etapa === "boas_vindas")?.status === "concluido";

  return (
    <div className="max-w-2xl">
      <span aria-hidden className="num-secao text-7xl">01</span>
      <h1 className="mt-2 text-4xl sm:text-5xl">Que bom ter você aqui, {primeiroNome(sessao.perfil.nome) || cliente.nome}</h1>
      <p className="mt-4 text-base text-text">
        Este é o portal da {sessao.agencia.nome}. É aqui que você acompanha tudo o que fazemos pela {cliente.nome}, sem precisar
        procurar nada no WhatsApp.
      </p>
      {cliente.responsavel && (
        <p className="mt-3 text-base text-text">
          Quem vai cuidar da sua marca é <strong className="font-semibold">{cliente.responsavel.nome}</strong>.
        </p>
      )}

      <h2 className="mt-10 text-2xl">Nos próximos dias</h2>
      <ol className="mt-4 flex flex-col gap-3">
        {PROXIMOS.map((p, i) => (
          <li key={p.titulo} className="flex gap-4 rounded-lg border border-line bg-card px-5 py-4">
            <span aria-hidden className="num-secao w-10 shrink-0 text-3xl">{String(i + 2).padStart(2, "0")}</span>
            <div>
              <p className="font-medium text-text">{p.titulo}</p>
              <p className="text-sm text-muted">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">Dá para parar a qualquer momento e voltar depois. Tudo fica salvo.</p>

      {concluida ? (
        <a href="/entrada" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-brown px-5 text-sm font-medium text-bg hover:bg-brown-dark">
          Continuar de onde parei
        </a>
      ) : (
        <FormBoasVindas />
      )}
    </div>
  );
}
