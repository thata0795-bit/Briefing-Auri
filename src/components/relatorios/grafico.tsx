"use client";

import { useEffect, useRef, useState } from "react";
import { mesCurto, numero, numeroCurto } from "@/lib/relatorios";

type Ponto = { mes: string; valor: number | null };

const A = 220;
const M = { topo: 16, dir: 12, base: 28, esq: 44 };

function escalaBonita(max: number) {
  if (max <= 0) return { topo: 4, passo: 1 };
  const bruto = max / 4;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((p) => p >= bruto) ?? 10 * pot;
  return { topo: Math.ceil(max / passo) * passo, passo };
}

/**
 * Evolução de uma métrica mês a mês. Uma série, um eixo. Linha para totais
 * (seguidores), barras para volumes do mês (alcance). Passe o dedo ou o mouse
 * para ver o valor de cada mês; a tabela abaixo traz todos os números.
 */
export function GraficoEvolucao({ pontos, tipo, titulo }: { pontos: Ponto[]; tipo: "linha" | "barras"; titulo: string }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const [L, setL] = useState(640);
  const svg = useRef<SVGSVGElement>(null);
  const caixa = useRef<HTMLElement>(null);
  // Desenha na largura real da tela, para o texto dos eixos não encolher no celular.
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setL(Math.max(280, Math.round(e.contentRect.width))));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const valores = pontos.map((p) => p.valor).filter((v): v is number => v != null);
  if (valores.length === 0) return <p className="text-sm text-muted">Ainda não há números para mostrar.</p>;

  const min = tipo === "linha" ? Math.min(...valores) : 0;
  const max = Math.max(...valores);
  // Linha: começa perto do menor valor para a curva não ficar achatada.
  const passoBase = escalaBonita(max - min || max).passo;
  const piso = tipo === "linha" ? Math.max(0, Math.floor(min / passoBase) * passoBase - passoBase) : 0;
  const { topo, passo } = escalaBonita(max - piso);
  const teto = piso + topo;
  const larg = L - M.esq - M.dir;
  const alt = A - M.topo - M.base;
  const n = pontos.length;
  const faixa = larg / n;
  const x = (i: number) => M.esq + faixa * i + faixa / 2;
  const y = (v: number) => M.topo + alt - ((v - piso) / (teto - piso)) * alt;
  const marcas = Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => piso + i * passo);
  const cadaRotulo = Math.ceil(n / Math.max(3, Math.floor(larg / 64)));

  const caminho = pontos
    .map((p, i) => (p.valor == null ? null : `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`))
    .reduce<string[]>((acc, c, i, arr) => {
      if (c) acc.push(`${i === 0 || !arr[i - 1] ? "M" : "L"}${c}`);
      return acc;
    }, [])
    .join(" ");

  function aoMover(e: React.PointerEvent<SVGSVGElement>) {
    const caixa = svg.current?.getBoundingClientRect();
    if (!caixa) return;
    const px = ((e.clientX - caixa.left) / caixa.width) * L;
    const i = Math.floor((px - M.esq) / faixa);
    setAtivo(i >= 0 && i < n ? i : null);
  }

  const atual = ativo != null ? pontos[ativo] : null;
  const ultimo = pontos.reduce<number | null>((u, p, i) => (p.valor != null ? i : u), null);

  return (
    <figure ref={caixa} className="relative m-0">
      <svg
        ref={svg}
        viewBox={`0 0 ${L} ${A}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label={`${titulo}, mês a mês. Os valores estão na tabela abaixo.`}
        onPointerMove={aoMover}
        onPointerDown={aoMover}
        onPointerLeave={() => setAtivo(null)}
      >
        {marcas.map((v) => (
          <g key={v}>
            <line x1={M.esq} x2={L - M.dir} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={M.esq - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)">
              {numeroCurto(v)}
            </text>
          </g>
        ))}
        {pontos.map((p, i) =>
          i % cadaRotulo === 0 || i === n - 1 ? (
            <text key={p.mes} x={x(i)} y={A - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
              {mesCurto(p.mes)}
            </text>
          ) : null,
        )}
        {ativo != null && <rect x={M.esq + faixa * ativo} y={M.topo} width={faixa} height={alt} fill="var(--soft)" />}
        {tipo === "barras" &&
          pontos.map((p, i) => {
            if (p.valor == null) return null;
            const w = Math.min(28, faixa - 2);
            const h = Math.max(1, M.topo + alt - y(p.valor));
            const r = Math.min(4, w / 2, h);
            const x0 = x(i) - w / 2;
            const y0 = M.topo + alt - h;
            // Cantos arredondados só no topo; a base encosta no eixo.
            const d = `M${x0},${M.topo + alt} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + w - r} Q${x0 + w},${y0} ${x0 + w},${y0 + r} V${M.topo + alt} Z`;
            return <path key={p.mes} d={d} fill={ativo === i ? "var(--brown-dark)" : "var(--brown)"} />;
          })}
        {tipo === "linha" && (
          <>
            <path d={caminho} fill="none" stroke="var(--brown)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {pontos.map((p, i) =>
              p.valor == null || (ativo !== i && i !== ultimo) ? null : (
                <circle key={p.mes} cx={x(i)} cy={y(p.valor)} r={4.5} fill="var(--brown)" stroke="var(--card)" strokeWidth={2} />
              ),
            )}
          </>
        )}
        <line x1={M.esq} x2={L - M.dir} y1={M.topo + alt} y2={M.topo + alt} stroke="var(--muted-soft)" strokeWidth={1} />
      </svg>
      {atual && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 rounded-md border border-line bg-card px-3 py-2 text-xs shadow-sm"
          style={{ left: `${(x(ativo!) / L) * 100}%`, transform: `translateX(${ativo! > n / 2 ? "-105%" : "5%"})` }}
        >
          <p className="text-muted">{mesCurto(atual.mes)}</p>
          <p className="font-semibold text-text tabular-nums">{numero(atual.valor)}</p>
        </div>
      )}
    </figure>
  );
}
