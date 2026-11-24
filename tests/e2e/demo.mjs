// Demonstração (NEXT_PUBLIC_DEMO=1): acesso particular com senha e dados compartilhados.
// Uso: DEMO_SENHAS=/caminho/senhas.json node tests/e2e/demo.mjs [pasta-de-capturas]
// O arquivo de senhas é um JSON { "email": "senha" } e não fica no repositório.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SENHAS = JSON.parse(readFileSync(process.env.DEMO_SENHAS ?? "/tmp/claude-0/senhas-demo.json", "utf8"));
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
const EMAIL = {
  taynara: "taynara@agencia-exemplo.com.br",
  julia: "julia@agencia-exemplo.com.br",
  rafael: "rafael@agencia-exemplo.com.br",
  marina: "marina@padaria-exemplo.com.br",
  carla: "carla@estudio-exemplo.com.br",
  helena: "helena@clinica-exemplo.com.br",
};

async function entrar(opcoes, quem) {
  const ctx = await browser.newContext(opcoes);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/entrar`);
  await p.getByLabel("E-mail").fill(EMAIL[quem]);
  await p.getByLabel("Senha").fill(SENHAS[EMAIL[quem]]);
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.waitForURL(/\/(inicio|entrada)/);
  return p;
}
const barrado = async (p, rota) => {
  await p.goto(`${BASE}${rota}`);
  try {
    await p.waitForURL(/\/(inicio|entrada)/, { timeout: 8000 });
    return true;
  } catch {
    return (await p.locator("main").first().innerText()).includes("não encontrada");
  }
};

// Senha errada e cookie forjado
{
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/entrar`);
  await captura(p, "demo-entrar");
  await p.getByLabel("E-mail").fill(EMAIL.taynara);
  await p.getByLabel("Senha").fill("senha-errada");
  await p.getByRole("button", { name: "Entrar" }).click();
  await p.getByText("E-mail ou senha incorretos").waitFor();
  ok(true, "senha errada não entra");
  await ctx.addCookies([{ name: "demo_usuario", value: "d0000000-0000-4000-8000-000000000001", url: BASE }]);
  await p.goto(`${BASE}/clientes`);
  ok(p.url().includes("/entrar"), "cookie forjado sem assinatura não entra");
  await ctx.close();
}

const a = await entrar({ viewport: { width: 1280, height: 900 } }, "taynara");
await a.goto(`${BASE}/clientes`);
let t = await texto(a);
ok(t.includes("Padaria Aurora") && t.includes("Estúdio Bravo") && t.includes("Clínica Serena"), "dona vê os três clientes");

const j = await entrar({}, "julia");
await j.goto(`${BASE}/clientes`);
t = await texto(j);
ok(t.includes("Padaria Aurora") && !t.includes("Clínica Serena"), "social media vê só os clientes dela");
ok(await barrado(j, "/equipe"), "equipe não abre a tela de equipe");

const r = await entrar({}, "rafael");
await r.goto(`${BASE}/clientes`);
t = await texto(r);
ok(t.includes("Estúdio Bravo") && !t.includes("Padaria Aurora"), "designer vê só o Estúdio Bravo");

const m = await entrar(celular, "marina");
await m.getByText("Estratégia do primeiro mês").waitFor();
ok((await texto(m)).includes("Captação de reels na padaria"), "cliente vê a própria agenda");
ok(await barrado(m, "/clientes"), "cliente não abre a lista de clientes");
ok(await barrado(m, "/clientes/c0000000-0000-4000-8000-0000000000d2"), "cliente não abre a ficha de outro cliente");
await captura(m, "demo-cliente-painel");

// Carla assina; a agência vê na hora (dados compartilhados)
const c = await entrar(celular, "carla");
await c.waitForURL("**/entrada/contrato");
await c.getByRole("link", { name: /Assinar contrato/ }).click();
await c.getByLabel("Nome completo de quem assina").fill("Carla Mendes");
await c.getByRole("button", { name: "Assinar contrato" }).click();
await c.getByText("Contrato assinado").first().waitFor({ timeout: 15000 });
await a.goto(`${BASE}/clientes`);
await a.getByRole("link", { name: "Estúdio Bravo" }).first().click();
await a.getByRole("heading", { name: "Briefing" }).waitFor();
ok((await texto(a)).includes("Assinado"), "agência vê a assinatura da cliente em outro aparelho");

// Helena faz a entrada inteira
const n = await entrar(celular, "helena");
await n.waitForURL("**/entrada/boas-vindas");
await n.getByRole("checkbox").check();
await n.getByRole("button", { name: "Começar", exact: true }).click();
await n.waitForURL("**/entrada/contrato", { timeout: 15000 });
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
ok((await texto(n)).includes("Tudo pronto para começar"), "cliente nova conclui a entrada inteira");
await a.goto(`${BASE}/clientes`);
ok(/Clínica Serena[\s\S]*Ativo/.test(await texto(a)), "agência vê a Clínica Serena ativa");

// Cadastro de cliente e link de acesso
const emailNovo = `teste.${Date.now()}@exemplo.com.br`;
await a.goto(`${BASE}/clientes/novo`);
await a.getByLabel("Nome da empresa").fill("Loja Teste Demo");
await a.getByLabel("Nome do contato").fill("Pessoa Teste");
await a.getByLabel("E-mail do contato").fill(emailNovo);
await a.getByLabel("Plano", { exact: true }).fill("Plano Essencial");
await a.getByLabel("Valor mensal (R$)").fill("1500");
await a.getByLabel("Dia de vencimento").fill("10");
await a.getByRole("button", { name: "Cadastrar e enviar convite" }).click();
await a.waitForURL(/\/clientes\/[0-9a-f-]{36}\?convidado=1/);
const link = await a.getByRole("link", { name: "Link de acesso" }).getAttribute("href");
const ctxNovo = await browser.newContext(celular);
const novo = await ctxNovo.newPage();
await novo.goto(`${BASE}${link}`);
await novo.getByRole("button", { name: "Entrar no portal" }).click();
await novo.waitForURL("**/entrada/boas-vindas");
ok((await texto(novo)).includes("Loja Teste Demo"), "cliente cadastrado entra pelo link de acesso");
await novo.goto(`${BASE}${link}`);
ok((await texto(novo)).includes("não vale mais"), "o link de acesso funciona uma vez só");

// Só a dona zera a demonstração
const resp = await m.request.post(`${BASE}/demo/recomecar`, { headers: { origin: BASE } });
ok(resp.status() === 403, "cliente não consegue zerar a demonstração");
await a.goto(`${BASE}/conta/seguranca`);
await a.getByRole("button", { name: "Zerar e começar de novo" }).click();
await a.waitForURL("**/inicio?recomecado=1");
await a.goto(`${BASE}/clientes`);
t = await texto(a);
ok(!t.includes("Loja Teste Demo") && /Clínica Serena[\s\S]*Convidado/.test(t), "dona zera a demonstração");

await browser.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
