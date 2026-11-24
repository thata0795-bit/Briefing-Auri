"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { salvarConteudo, type Resultado } from "@/app/(painel)/conteudos/acoes";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { navegarDepoisDeSalvar } from "@/lib/navegar";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import type { Conteudo } from "@/lib/conteudos";

const classe = "min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-text outline-none focus:border-brown";

export function FormConteudo({ clienteId, agenciaId, conteudo }: { clienteId: string; agenciaId: string; conteudo?: Conteudo }) {
  const [estado, acao, enviando] = useActionState<Resultado | null, FormData>(salvarConteudo, null);
  const [arte, setArte] = useState(conteudo?.arte_caminho ?? "");
  const [nomeArte, setNomeArte] = useState(conteudo?.arte_caminho ? "Arte enviada" : "");
  const [subindo, setSubindo] = useState(false);
  const [erroArte, setErroArte] = useState<string>();

  useEffect(() => {
    if (estado?.ok && estado.destino) navegarDepoisDeSalvar(estado.destino);
  }, [estado]);

  async function enviarArte(arquivo: File) {
    setErroArte(undefined);
    if (arquivo.size > 52428800) return setErroArte("A arte passa de 50 MB.");
    setSubindo(true);
    const nome = arquivo.name.normalize("NFD").replace(/[^\w.]+/g, "-").toLowerCase().slice(-80);
    const caminho = `${agenciaId}/${clienteId}/conteudos/${crypto.randomUUID()}-${nome}`;
    const { error } = await criarClienteNavegador().storage.from("arquivos").upload(caminho, arquivo, { contentType: arquivo.type });
    setSubindo(false);
    if (error) return setErroArte("Não foi possível enviar a arte. Confira o formato.");
    setArte(caminho);
    setNomeArte(arquivo.name);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        const quem = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (quem?.value) dados.set("acao", quem.value);
        startTransition(() => acao(dados));
      }}
      className="flex max-w-2xl flex-col gap-5"
      noValidate
    >
      <input type="hidden" name="id" value={conteudo?.id ?? ""} />
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="arte_caminho" value={arte} />
      <Campo rotulo="Título interno" name="titulo" defaultValue={conteudo?.titulo} dica="Como o post aparece no calendário. Ex.: Carrossel 3 dicas de manutenção" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="formato" className="text-sm font-medium text-text">Formato</label>
          <select id="formato" name="formato" defaultValue={conteudo?.formato ?? "feed"} className={classe}>
            <option value="feed">Post de feed</option>
            <option value="carrossel">Carrossel</option>
            <option value="reels">Reels</option>
            <option value="stories">Stories</option>
          </select>
        </div>
        <Campo rotulo="Data de publicação" name="data_publicacao" type="date" defaultValue={conteudo?.data_publicacao} />
        <Campo rotulo="Horário" name="horario" type="time" defaultValue={conteudo?.horario?.slice(0, 5) ?? ""} dica="Opcional" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="legenda" className="text-sm font-medium text-text">Legenda</label>
        <textarea id="legenda" name="legenda" rows={8} defaultValue={conteudo?.legenda ?? ""} className="rounded-md border border-line bg-bg px-3 py-2.5 text-base leading-relaxed text-text outline-none focus:border-brown" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-text">Arte</span>
        <label htmlFor="arte" className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-brown/50 bg-bg px-4 py-3 text-sm text-brown hover:bg-soft focus-within:outline-2 focus-within:outline-brown">
          {subindo ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <CloudUpload aria-hidden className="size-4" />}
          {subindo ? "Enviando..." : nomeArte ? `Trocar arte (${nomeArte})` : "Escolher imagem ou vídeo"}
          <input
            id="arte"
            type="file"
            accept="image/png,image/jpeg,image/webp,video/mp4"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void enviarArte(f);
              e.target.value = "";
            }}
          />
        </label>
        {erroArte && <p role="alert" className="text-sm text-danger">{erroArte}</p>}
      </div>
      {estado && !estado.ok && <p role="alert" className="text-sm text-danger">{estado.erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Botao type="submit" name="acao" value="enviar" disabled={enviando || subindo}>
          {enviando ? "Salvando..." : conteudo?.status === "ajuste_solicitado" ? "Salvar e reenviar para aprovação" : "Salvar e enviar para aprovação"}
        </Botao>
        <Botao type="submit" name="acao" value="rascunho" variante="secundario" disabled={enviando || subindo}>
          Salvar sem enviar
        </Botao>
      </div>
    </form>
  );
}
