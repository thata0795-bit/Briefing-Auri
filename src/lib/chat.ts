import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";

export type MensagemChat = {
  id: string;
  texto: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  criado_em: string;
  autor_id: string | null;
  autor: { nome: string; papel: string } | null;
};

export type ResumoConversa = {
  clienteId: string;
  nome: string;
  ultima: { texto: string; criado_em: string; doCliente: boolean } | null;
  naoLidas: number;
};

/** Conversas que a pessoa vê, com a última mensagem e quantas não leu. */
export async function resumoConversas(userId: string): Promise<ResumoConversa[]> {
  const supabase = await criarClienteServidor();
  const [{ data: clientes }, { data: leituras }] = await Promise.all([
    supabase.from("clientes").select("id, nome").neq("status", "encerrado").order("nome"),
    supabase.from("leituras_conversa").select("cliente_id, lido_ate").eq("user_id", userId),
  ]);
  const lido = new Map((leituras ?? []).map((l) => [l.cliente_id as string, l.lido_ate as string]));
  const resumos = await Promise.all(
    (clientes ?? []).map(async (c) => {
      const { data: msgs } = await supabase
        .from("mensagens")
        .select("texto, arquivo_nome, criado_em, autor_id, autor:perfis(papel)")
        .eq("cliente_id", c.id)
        .order("criado_em", { ascending: false })
        .limit(50);
      const lista = (msgs ?? []) as unknown as { texto: string | null; arquivo_nome: string | null; criado_em: string; autor_id: string; autor: { papel: string } | null }[];
      const desde = lido.get(c.id) ?? "";
      const ultima = lista[0];
      return {
        clienteId: c.id as string,
        nome: c.nome as string,
        ultima: ultima
          ? { texto: ultima.texto ?? `Anexo: ${ultima.arquivo_nome}`, criado_em: ultima.criado_em, doCliente: ultima.autor?.papel === "cliente" }
          : null,
        naoLidas: lista.filter((m) => m.autor_id !== userId && m.criado_em > desde).length,
      };
    }),
  );
  return resumos.sort((a, b) => (b.ultima?.criado_em ?? "").localeCompare(a.ultima?.criado_em ?? ""));
}

type Supa = Awaited<ReturnType<typeof criarClienteServidor>>;

/** Busca mensagens com autor e link temporário dos anexos. */
export async function buscarMensagens(supabase: Supa, clienteId: string, depois?: string | null): Promise<MensagemChat[]> {
  let consulta = supabase
    .from("mensagens")
    .select("id, texto, arquivo_caminho, arquivo_nome, criado_em, autor_id, autor:perfis(nome, papel)")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })
    .limit(200);
  if (depois) consulta = consulta.gt("criado_em", depois);
  const { data } = await consulta;
  const linhas = ((data ?? []) as unknown as (Omit<MensagemChat, "arquivo_url"> & { arquivo_caminho: string | null })[]).reverse();
  const caminhos = linhas.map((m) => m.arquivo_caminho).filter(Boolean) as string[];
  const { data: urls } = caminhos.length ? await supabase.storage.from("arquivos").createSignedUrls(caminhos, 3600) : { data: [] };
  const url = new Map((urls ?? []).map((u) => [u.path, u.signedUrl]));
  return linhas.map(({ arquivo_caminho, ...m }) => ({ ...m, arquivo_url: arquivo_caminho ? (url.get(arquivo_caminho) ?? null) : null }));
}
