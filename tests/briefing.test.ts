import { describe, expect, it } from "vitest";
import { SECOES, TODAS_PERGUNTAS, acharPergunta, normalizarResposta, pendentes, visivel, type Pergunta } from "@/lib/briefing/perguntas";

describe("perguntas do briefing", () => {
  it("são 10 seções com chaves únicas no formato aceito pelo banco", () => {
    expect(SECOES).toHaveLength(10);
    const chaves = TODAS_PERGUNTAS.map((p) => p.chave);
    expect(new Set(chaves).size).toBe(chaves.length);
    for (const c of chaves) expect(c).toMatch(/^[a-z_]+\.[a-z_]+$/);
  });

  it("mantém o @ do Instagram e os envios de arquivo", () => {
    expect(acharPergunta("redes.perfil_instagram")).toBeDefined();
    expect(["producao.logo", "producao.manual_marca", "producao.fotos"].every((c) => acharPergunta(c)?.tipo === "arquivo")).toBe(true);
  });

  it("condições apontam para perguntas que existem", () => {
    for (const p of TODAS_PERGUNTAS) if (p.mostrarSe) expect(acharPergunta(p.mostrarSe.pergunta)).toBeDefined();
  });

  it("pergunta condicional aparece só com a resposta certa", () => {
    const outro = acharPergunta("empresa.segmento_outro")!;
    expect(visivel(outro, {})).toBe(false);
    expect(visivel(outro, { "empresa.segmento": "Varejo" })).toBe(false);
    expect(visivel(outro, { "empresa.segmento": "Outro" })).toBe(true);
  });

  it("obrigatória pulada não bloqueia a conclusão", () => {
    const todas = pendentes({}, []).map((p) => p.chave);
    expect(todas).toContain("empresa.nome");
    expect(pendentes({}, todas)).toHaveLength(0);
  });

  it("normaliza e valida respostas", () => {
    const url: Pergunta = { id: "link", rotulo: "Link", tipo: "url" };
    expect(normalizarResposta(url, "pinterest.com/x")).toEqual({ ok: true, valor: "https://pinterest.com/x" });
    expect(normalizarResposta(url, "javascript:alert(1)").ok).toBe(false);
    const multipla = acharPergunta("posicionamento.valores")!;
    expect(normalizarResposta(multipla, ["Qualidade", "Inovação"]).ok).toBe(true);
    expect(normalizarResposta(multipla, ["Inventada"]).ok).toBe(false);
    const limitada: Pergunta = { id: "x", rotulo: "x", tipo: "multipla", max: 2, opcoes: ["a", "b", "c"] };
    expect(normalizarResposta(limitada, ["a", "b", "c"]).ok).toBe(false);
    const escolha = acharPergunta("empresa.segmento")!;
    expect(normalizarResposta(escolha, "Varejo")).toEqual({ ok: true, valor: "Varejo" });
    expect(normalizarResposta(escolha, "")).toEqual({ ok: true, valor: null });
  });
});
