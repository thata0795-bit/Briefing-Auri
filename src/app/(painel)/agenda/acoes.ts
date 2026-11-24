"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoHorario = { ok: boolean; erro?: string; mensagem?: string } | null;

const Novo = z
  .object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data."),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "Escolha o horário."),
    duracao: z.coerce.number().int().refine((v) => [30, 45, 60, 90].includes(v), "Duração inválida."),
    repetir: z.coerce.number().int().min(1).max(10).default(1),
    formato: z.enum(["online", "presencial"]),
    link: z.string().trim().max(500).optional(),
    local: z.string().trim().max(200).optional(),
    responsavel_id: z.string().uuid("Escolha o responsável."),
  })
  .refine((d) => d.formato !== "online" || !d.link || /^https:\/\//i.test(d.link), { message: "O link precisa começar com https://", path: ["link"] })
  .refine((d) => d.formato !== "presencial" || !!d.local, { message: "Informe o local.", path: ["local"] });

/** Converte data e hora de São Paulo para UTC. Brasil não tem horário de verão desde 2019: UTC-3. */
function deSaoPaulo(data: string, hora: string) {
  return new Date(`${data}T${hora}:00-03:00`);
}

export async function criarHorarios(_: EstadoHorario, dados: FormData): Promise<EstadoHorario> {
  const sessao = await obterSessao();
  if (sessao.perfil.papel === "cliente") return { ok: false, erro: "Sem permissão." };
  const p = Novo.safeParse(Object.fromEntries(dados));
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  const d = p.data;
  const linhas = Array.from({ length: d.repetir }, (_, i) => {
    const inicio = deSaoPaulo(d.data, d.hora);
    inicio.setUTCDate(inicio.getUTCDate() + i * 7);
    const fim = new Date(inicio.getTime() + d.duracao * 60_000);
    return {
      agencia_id: sessao.agencia.id,
      responsavel_id: d.responsavel_id,
      inicio: inicio.toISOString(),
      fim: fim.toISOString(),
      formato: d.formato,
      link: d.formato === "online" ? d.link || null : null,
      local: d.formato === "presencial" ? d.local : null,
    };
  });
  if (new Date(linhas[0].inicio) <= new Date()) return { ok: false, erro: "Escolha um horário no futuro." };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("horarios_livres").insert(linhas);
  if (error) return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/agenda/horarios");
  return { ok: true, mensagem: linhas.length === 1 ? "Horário aberto." : `${linhas.length} horários abertos.` };
}

export async function removerHorario(dados: FormData) {
  const id = z.string().uuid().parse(dados.get("id"));
  const supabase = await criarClienteServidor();
  await supabase.from("horarios_livres").delete().eq("id", id).is("cliente_id", null);
  revalidatePath("/agenda/horarios");
}
