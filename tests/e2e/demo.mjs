// Demonstração (NEXT_PUBLIC_DEMO=1): confere os perfis e a entrada completa de um cliente novo.
// Uso: node tests/e2e/demo.mjs [pasta-de-capturas]   (BASE_URL opcional para testar o site publicado)
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const saida = process.argv[2];
if (saida) mkdirSync(saida, { recursive: true });
let falhas = 0;
const ok = (c, m) => {
  console.log(`${c ? "ok  " : "FALHA"} ${m}`);
  if (!c) falhas++;
};
const captura = async (p, n) => saida && p.screenshot({ path: `${saida}/${n}.png`, fullPage: true });
const texto = async (p) => {
  await p.waitForLoadState("networkidle");
  return p.locator("main").first().innerText();
};
const browser = await chromium.launch();
const celular = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

async function entrarComo(ctx, nome) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/entrar`);
  await p.getByRole("button", { name: new RegExp(nome) }).click();
  await p.waitForURL(/\/(inicio|entrada)/);
  return p;
}

// Dona da agência
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const a = await entrarComo(ctxA, "Taynara Castro");
await captura(a, "demo-entrar");
await a.goto(`${BASE}/clientes`);
let t = await texto(a);
ok(t.includes("Padaria Aurora") && t.includes("Estúdio Bravo") && t.includes("Clínica Serena"), "dona vê os três clientes");
await a.getByRole("link", { name: "Padaria Aurora" }).first().click();
await a.getByRole("heading", { name: "Briefing" }).waitFor();
await a.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
t = await texto(a);
ok(t.includes("Pão de fermentação natural"), "ficha da Aurora mostra o briefing");
await captura(a, "demo-ficha-aurora");

// Equipe
const ctxJ = await browser.newContext();
const j = await entrarComo(ctxJ, "Júlia Martins");
await j.goto(`${BASE}/clientes`);
t = await texto(j);
ok(t.includes("Padaria Aurora") && !t.includes("Clínica Serena"), "social media vê só os clientes dela");
const ctxR = await browser.newContext();
const r = await entrarComo(ctxR, "Rafael Souza");
await r.goto(`${BASE}/clientes`);
t = await texto(r);
ok(t.includes("Estúdio Bravo") && !t.includes("Padaria Aurora"), "designer vê só o Estúdio Bravo");

// Cliente ativo
const ctxM = await browser.newContext(celular);
const m = await entrarComo(ctxM, "Marina Lopes");
await m.getByText("Estratégia do primeiro mês").waitFor();
t = await texto(m);
ok(t.includes("Captação de reels na padaria"), "cliente ativo vê a agenda no painel");
await captura(m, "demo-cliente-painel");

// Cliente no meio da entrada: assina o contrato
const ctxC = await browser.newContext(celular);
const c = await entrarComo(ctxC, "Carla Mendes");
await c.waitForURL("**/entrada/contrato");
ok(true, "cliente no meio da entrada cai no contrato");
await c.getByRole("link", { name: /Assinar contrato/ }).click();
await c.getByLabel("Nome completo de quem assina").fill("Carla Mendes");
await c.getByRole("button", { name: "Assinar contrato" }).click();
await c.getByText("Contrato assinado").first().waitFor({ timeout: 15000 });
ok(true, "assinatura simulada conclui o contrato");

// Cliente novo pelo convite
const ctxN = await browser.newContext(celular);
const n = await ctxN.newPage();
await n.goto(`${BASE}/entrar`);
await n.getByRole("link", { name: /Começar como cliente novo/ }).click();
await n.getByRole("button", { name: "Entrar no portal" }).click();
await n.waitForURL("**/entrada/boas-vindas");
await n.getByRole("checkbox").check();
await n.getByRole("button", { name: "Começar", exact: true }).click();
try {
  await n.waitForURL("**/entrada/contrato", { timeout: 15000 });
  ok(true, "boas-vindas levam ao contrato, que já veio com o convite");
} catch (e) {
  console.log("DEBUG", n.url(), await n.getByRole("alert").allInnerTexts());
  await captura(n, "debug-boas-vindas");
  throw e;
}
await n.getByRole("link", { name: /Assinar contrato/ }).click();
await n.getByLabel("Nome completo de quem assina").fill("Helena Prado");
await n.getByRole("button", { name: "Assinar contrato" }).click();
await n.getByText("Contrato assinado").first().waitFor({ timeout: 15000 });
await n.goto(`${BASE}/entrada/briefing`);
for (let s = 0; s < 10; s++) {
  await n.getByRole("button", { name: String(s + 1).padStart(2, "0") }).click();
  const secao = n.locator("section").filter({ has: n.locator("header h2") }).first();
  for (const g of await secao.getByRole("group").all()) {
    if ((await g.locator('button[aria-pressed="true"]').count()) === 0) await g.locator("button:not([disabled])").first().click();
  }
  for (const f of await secao.locator('input[type="text"], input[type="url"], textarea').all()) {
    if (!(await f.isVisible()) || (await f.inputValue())) continue;
    await f.fill((await f.getAttribute("type")) === "url" ? "pinterest.com/exemplo" : "Resposta de teste");
  }
}
await n.getByRole("button", { name: "Concluir briefing" }).click();
await n.waitForURL("**/entrada/acessos", { timeout: 20000 });
for (const tit of ["Instagram", "Meta Business (Facebook e Instagram)", "Perfil da Empresa no Google", "Domínio do site"]) {
  await n.getByRole("group", { name: `Situação de ${tit}` }).getByRole("button", { name: "Já liberei" }).click();
}
await n.waitForTimeout(800);
await n.getByRole("button", { name: "Concluir checklist" }).click();
await n.waitForURL("**/entrada/reuniao");
await n.locator('label:has(input[name="horario"])').first().click();
await n.getByRole("button", { name: "Confirmar horário" }).click();
await n.waitForURL("**/entrada/reuniao?marcada=1");
ok((await texto(n)).includes("Tudo pronto para começar"), "cliente novo conclui a entrada inteira");
await captura(n, "demo-cliente-pronto");

// No mesmo navegador, a agência vê a Serena ativa
await n.getByRole("button", { name: "Sair" }).first().click();
await n.waitForURL("**/entrar");
await n.getByRole("button", { name: /Taynara Castro/ }).click();
await n.waitForURL("**/inicio");
await n.goto(`${BASE}/clientes`);
t = await texto(n);
ok(/Clínica Serena[\s\S]*Ativo/.test(t), "no mesmo navegador, a agência vê a Clínica Serena ativa");

// Agência gera de novo um contrato pela ficha (Estúdio Bravo)
await a.goto(`${BASE}/clientes`);
await a.getByRole("link", { name: "Estúdio Bravo" }).first().click();
await a.getByRole("button", { name: "Gerar de novo e reenviar" }).click();
await a.getByText("Aguardando assinatura").first().waitFor({ timeout: 15000 });
ok(true, "agência gera e reenvia o contrato pela ficha");

// Cadastro de cliente novo na demonstração
await a.goto(`${BASE}/clientes/novo`);
await a.getByLabel("Nome da empresa").fill("Loja Teste Demo");
await a.getByLabel("Nome do contato").fill("Pessoa Teste");
await a.getByLabel("E-mail do contato").fill(`teste.${Date.now()}@exemplo.com.br`);
await a.getByLabel("Plano", { exact: true }).fill("Plano Essencial");
await a.getByLabel("Valor mensal (R$)").fill("1500");
await a.getByLabel("Dia de vencimento").fill("10");
await a.getByRole("button", { name: "Cadastrar e enviar convite" }).click();
await a.waitForURL(/\/clientes\/[0-9a-f-]{36}\?convidado=1/);
await a.getByRole("link", { name: "Abrir convite" }).waitFor();
ok(true, "cadastro de cliente novo mostra o link do convite");

// Visitantes separados: outra sessão não vê o cliente criado
const ctxX = await browser.newContext();
const x = await entrarComo(ctxX, "Taynara Castro");
await x.goto(`${BASE}/clientes`);
ok(!(await texto(x)).includes("Loja Teste Demo"), "cada visitante tem os próprios dados");

// Recomeçar
await a.getByRole("button", { name: "Recomeçar a demonstração" }).first().click();
await a.waitForURL("**/entrar");
const a2 = await entrarComo(ctxA, "Taynara Castro");
await a2.goto(`${BASE}/clientes`);
ok(!(await texto(a2)).includes("Loja Teste Demo"), "recomeçar volta os dados ao início");

await browser.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
