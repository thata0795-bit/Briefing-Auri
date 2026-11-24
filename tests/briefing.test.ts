import { describe, expect, it } from "vitest";
import { SECOES, TODAS_PERGUNTAS, acharPergunta, normalizarResposta, pendentes, visivel } from "@/lib/briefing/perguntas";

describe("perguntas do briefing", () => {
  it("são 10 seções com chaves únicas no formato aceito pelo banco", () => {
    expect(SECOES).toHaveLength(10);
    const chaves = TODAS_PERGUNTAS.map((p) => p.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const c of chaves) expect(c).toMatch(/^[a-z_]+\.[a-z_]+$/);
  });

  it("condições apontam para perguntas que existem", () => {
    for (const p of TODAS_PERGUNTAS) if (p.mostrarSe) expect(acharPergunta(p.mostrarSe.pergunta)).toBeDefined();
  });

  it("pergunta condicional aparece só com a resposta certa", () => {
    const logo = acharPergunta("identidade.logo")!;
    expect(visivel(logo, {})).toBe(false);
    expect(visivel(logo, { "identidade.possui": "Não tenho" })).toBe(false);
    expect(visivel(logo, { "identidade.possui": "Parcial (só logo ou só cores)" })).toBe(true);
  });

  it("obrigatória pulada não bloqueia a conclusão", () => {
    const todas = pendentes({}, []).map((p) => p.chave);
    expect(todas).toContain("negocio.nome");
    expect(pendentes({}, todas)).toHaveLength(0);
  });

  it("normaliza e valida respostas", () => {
    const url = acharPergunta("concorrencia.referencia_link")!;
    expect(normalizarResposta(url, "pinterest.com/x")).toEqual({ ok: true, valor: "https://pinterest.com/x" });
    expect(normalizarResposta(url, "javascript:alert(1)").ok).toBe(false);
    const multipla = acharPergunta("publico.percepcao")!;
    expect(normalizarResposta(multipla, ["Sofisticada", "Jovem", "Séria", "Divertida"]).ok).toBe(false);
    expect(normalizarResposta(multipla, ["Inventada"]).ok).toBe(false);
    const escolha = acharPergunta("negocio.segmento")!;
    expect(normalizarResposta(escolha, "Varejo")).toEqual({ ok: true, valor: "Varejo" });
    expect(normalizarResposta(escolha, "")).toEqual({ ok: true, valor: null });
  });
});
