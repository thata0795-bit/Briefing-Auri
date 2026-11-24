import { describe, expect, it } from "vitest";
import { gerarIcs, hora, linkGoogleAgenda } from "@/lib/agenda";
import { preencherModelo } from "@/lib/contratos/modelo";

const evento = { id: "x", titulo: "Primeira reunião", inicio: "2026-11-26T13:00:00Z", fim: "2026-11-26T14:00:00Z", link: "https://meet.google.com/abc" };

describe("agenda", () => {
  it("mostra o horário de São Paulo", () => {
    expect(hora(evento.inicio)).toBe("10:00");
  });
  it("gera .ics em UTC com alarme", () => {
    const ics = gerarIcs(evento, "Agência, Teste");
    expect(ics).toContain("DTSTART:20261126T130000Z");
    expect(ics).toContain("SUMMARY:Primeira reunião · Agência\\, Teste");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.endsWith("\r\n")).toBe(true);
  });
  it("monta o link do Google Agenda", () => {
    expect(linkGoogleAgenda(evento, "Agência")).toContain("dates=20261126T130000Z%2F20261126T140000Z");
  });
});

describe("modelo de contrato", () => {
  it("preenche campos e deixa visível o que não conhece", () => {
    const t = preencherModelo("{{cliente.nome}} paga {{plano.valor}} todo dia {{plano.vencimento}}. {{campo.errado}}", {
      cliente: { nome: "Loja X" },
      contato: { nome: "A", email: "a@x.teste" },
      agencia: { nome: "Ag" },
      plano: { nome: "P", valor: 1800, vencimento: 10, forma_pagamento: "boleto" },
      contrato: {},
    });
    expect(t.replace(/ /g, " ")).toBe("Loja X paga R$ 1.800,00 todo dia 10. {{campo.errado}}");
  });
});
