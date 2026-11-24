import type { Formato } from "@/lib/conteudos";
import { ROTULO_FORMATO } from "@/lib/conteudos";

/** Arte do post. Sem imagem enviada, mostra uma prévia neutra com o formato e o título. */
export function Arte({ url, formato, titulo, className = "" }: { url?: string | null; formato: Formato; titulo: string; className?: string }) {
  const vertical = formato === "reels" || formato === "stories";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={`Arte: ${titulo}`} className={`h-full w-full object-cover ${className}`} />
    );
  }
  return (
    <div
      role="img"
      aria-label={`${ROTULO_FORMATO[formato]} sem arte enviada: ${titulo}`}
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-soft p-4 text-center ${className}`}
    >
      <span className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{ROTULO_FORMATO[formato]}</span>
      <span className={`font-serif leading-tight text-brown-dark ${vertical ? "text-lg" : "text-base"}`}>{titulo}</span>
    </div>
  );
}
