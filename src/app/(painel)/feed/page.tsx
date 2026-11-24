import type { Metadata } from "next";
import Link from "next/link";
import { Clapperboard, Layers } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { clienteDaPagina } from "@/lib/cliente-da-pagina";
import { ROTULO_STATUS_CONTEUDO, type Conteudo } from "@/lib/conteudos";
import type { StatusItem } from "@/lib/status";
import { CabecalhoPagina, Vazio } from "@/components/ui/cartao";
import { SeloStatus } from "@/components/ui/status";
import { Arte } from "@/components/conteudos/arte";
import { SeletorCliente } from "@/components/conteudos/seletor-cliente";

export const metadata: Metadata = { title: "Prévia do feed" };

export default async function Feed({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const sessao = await obterSessao();
  const { cliente, clientes, agencia, supabase } = await clienteDaPagina(sessao, (await searchParams).cliente);
  if (!cliente) return <Vazio titulo="Nenhum cliente por aqui" />;

  const [{ data }, { data: briefing }] = await Promise.all([
    supabase
      .from("conteudos")
      .select("id, data_publicacao, horario, formato, titulo, status, arte_caminho")
      .eq("cliente_id", cliente.id)
      .in("formato", ["feed", "carrossel", "reels"])
      .order("data_publicacao", { ascending: false })
      .limit(30),
    supabase.from("briefings").select("respostas").eq("cliente_id", cliente.id).maybeSingle(),
  ]);
  const posts = (data ?? []) as Conteudo[];
  const caminhos = posts.map((p) => p.arte_caminho).filter(Boolean) as string[];
  const { data: urls } = caminhos.length ? await supabase.storage.from("arquivos").createSignedUrls(caminhos, 600) : { data: [] };
  const urlDe = new Map((urls ?? []).map((u) => [u.path, u.signedUrl]));
  const handle = ((briefing?.respostas as Record<string, unknown> | undefined)?.["redes.perfil_instagram"] as string | undefined) ?? "";

  return (
    <>
      <CabecalhoPagina numero="04" titulo="Prévia do feed" texto="Como o Instagram vai ficar, do post mais novo para o mais antigo." />
      {agencia && clientes.length > 0 && (
        <div className="mb-6">
          <SeletorCliente clientes={clientes} atual={cliente.id} />
        </div>
      )}
      <div className="mx-auto max-w-lg overflow-hidden rounded-lg border border-line bg-card">
        <div className="flex items-center gap-3 border-b border-line p-4">
          <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brown font-serif text-2xl text-gold-light">
            {cliente.nome.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">{handle || cliente.nome}</p>
            <p className="text-xs text-muted">{posts.length} {posts.length === 1 ? "publicação" : "publicações"} planejadas ou publicadas</p>
          </div>
        </div>
        {posts.length === 0 ? (
          <div className="p-4">
            <Vazio titulo="Ainda sem posts" texto="Os posts de feed, carrossel e reels aparecem aqui assim que a agência programar." />
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-0.5 bg-line">
            {posts.map((p) => (
              <li key={p.id} className="relative aspect-[4/5] bg-card">
                <Link href={`/conteudos/${p.id}${agencia ? `?cliente=${cliente.id}` : ""}`} className="block h-full w-full">
                  <Arte url={p.arte_caminho ? urlDe.get(p.arte_caminho) : null} formato={p.formato} titulo={p.titulo} />
                  <span className="absolute top-1 right-1 text-text">
                    {p.formato === "reels" ? <Clapperboard aria-label="Reels" className="size-4 drop-shadow" /> : p.formato === "carrossel" ? <Layers aria-label="Carrossel" className="size-4 drop-shadow" /> : null}
                  </span>
                  <span className="absolute inset-x-1 bottom-1 hidden sm:block">
                    <SeloStatus status={p.status as StatusItem} rotulo={ROTULO_STATUS_CONTEUDO[p.status as StatusItem]} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
