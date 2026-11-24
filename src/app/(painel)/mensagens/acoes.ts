"use server";

import { z } from "zod";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { buscarMensagens, type MensagemChat } from "@/lib/chat";

const uuid = z.string().uuid();

export async function novasMensagens(clienteId: string, depois: string | null): Promise<MensagemChat[]> {
  if (!uuid.safeParse(clienteId).success) return [];
  const supabase = await criarClienteServidor();
  return buscarMensagens(supabase, clienteId, depois);
}

const Envio = z.object({
  clienteId: uuid,
  texto: z.string().max(4000, "Use até 4.000 caracteres.").transform((t) => t.trim()),
  arquivo: z.object({ caminho: z.string().max(500), nome: z.string().min(1).max(200) }).nullable(),
});

export async function enviarMensagem(entrada: z.input<typeof Envio>): Promise<{ ok: true } | { ok: false; erro: string }> {
  const p = Envio.safeParse(entrada);
  if (!p.success) return { ok: false, erro: p.error.issues[0].message };
  const { clienteId, texto, arquivo } = p.data;
  if (!texto && !arquivo) return { ok: false, erro: "Escreva uma mensagem ou anexe um arquivo." };
  const sessao = await obterSessao();
  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase.from("clientes").select("id, agencia_id").eq("id", clienteId).maybeSingle();
  if (!cliente) return { ok: false, erro: "Conversa não encontrada." };
  if (arquivo && !arquivo.caminho.startsWith(`${cliente.agencia_id}/${cliente.id}/mensagens/`)) return { ok: false, erro: "Anexo inválido." };
  const { error } = await supabase.from("mensagens").insert({
    cliente_id: cliente.id,
    agencia_id: cliente.agencia_id,
    autor_id: sessao.userId,
    texto: texto || null,
    arquivo_caminho: arquivo?.caminho ?? null,
    arquivo_nome: arquivo?.nome ?? null,
  });
  if (error) return { ok: false, erro: "Não foi possível enviar. Tente de novo." };
  await marcarLido(cliente.id);
  return { ok: true };
}

export async function marcarLido(clienteId: string) {
  if (!uuid.safeParse(clienteId).success) return;
  const sessao = await obterSessao();
  const supabase = await criarClienteServidor();
  const { data: cliente } = await supabase.from("clientes").select("id, agencia_id").eq("id", clienteId).maybeSingle();
  if (!cliente) return;
  const agora = new Date().toISOString();
  const { data: existe } = await supabase.from("leituras_conversa").select("cliente_id").eq("cliente_id", clienteId).eq("user_id", sessao.userId).maybeSingle();
  if (existe) {
    await supabase.from("leituras_conversa").update({ lido_ate: agora }).eq("cliente_id", clienteId).eq("user_id", sessao.userId);
  } else {
    await supabase.from("leituras_conversa").insert({ cliente_id: clienteId, agencia_id: cliente.agencia_id, user_id: sessao.userId, lido_ate: agora });
  }
}
