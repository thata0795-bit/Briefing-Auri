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
await n.goto(`${BASE}/entrada`);
await n.waitForURL("**/entrada/manual");
await n.getByText("Prazos e aprovações").first().waitFor();
await n.getByRole("checkbox").check();
await n.getByRole("button", { name: "Concordo e continuar" }).click();
await n.waitForURL("**/entrada/briefing", { timeout: 15000 });
ok(true, "manual da parceria aceito na entrada");
for (let s = 0; s < 10; s++) {
  await n.getByRole("button", { name: new RegExp(`^${String(s + 1).padStart(2, "0")} `) }).click();
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

// Calendário, aprovações e ajustes (Fase 3)
{
  const cm = await entrar(celular, "marina");
  await cm.goto(`${BASE}/calendario`);
  t = await texto(cm);
  // Os itens da demonstração ficam nos próximos dias: lê também o mês seguinte.
  await cm.getByRole("link", { name: "Próximo mês" }).click();
  await cm.waitForURL(/mes=/);
  t += await texto(cm);
  await cm.goBack();
  ok(t.includes("Promoção da semana: bolo de fubá") && t.includes("Um dia na padaria"), "calendário do cliente mostra posts e roteiros");
  ok(!t.includes("Encomendas de Natal"), "roteiro não publicado não aparece para o cliente");
  ok(!t.includes("Apresentação do Estúdio Bravo"), "calendário não mistura clientes");
  const larg = await cm.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(larg <= 0, `calendário sem rolagem horizontal no celular (${larg}px)`);
  await captura(cm, "demo-calendario-celular");

  await cm.goto(`${BASE}/aprovacoes`);
  t = await texto(cm);
  ok(/esperando você \(5\)/i.test(t), "aprovações lista 3 posts e 2 roteiros");
  await captura(cm, "demo-aprovacoes");
  await cm.getByLabel("Selecionar Promoção da semana: bolo de fubá").check();
  await cm.getByLabel("Selecionar Um dia na padaria").check();
  await cm.getByRole("button", { name: /Aprovar 2 selecionados/ }).click();
  await cm.getByText(/Esperando você \(3\)/i).waitFor({ timeout: 15000 });
  ok(true, "aprova dois itens de uma vez");

  await cm.getByRole("link", { name: /Ingredientes de produtores de Minas/ }).click();
  await cm.getByRole("button", { name: "Solicitar ajuste" }).click();
  await cm.getByLabel("O que precisa mudar?").fill("Troca a segunda foto, por favor. Prefiro a do queijo.");
  await cm.getByRole("button", { name: "Enviar pedido de ajuste" }).click();
  await cm.getByText("Pedido de ajuste").first().waitFor({ timeout: 15000 });
  ok((await texto(cm)).includes("Troca a segunda foto"), "pedido de ajuste fica no histórico");
  await captura(cm, "demo-post-ajuste");

  const ca = await entrar({ viewport: { width: 1280, height: 900 } }, "taynara");
  await ca.goto(`${BASE}/aprovacoes`);
  t = await texto(ca);
  ok(t.includes("Ingredientes de produtores de Minas"), "agência vê o pedido de ajuste");
  await ca.getByRole("link", { name: /Ingredientes de produtores de Minas/ }).first().click();
  await ca.getByRole("button", { name: "Ajuste feito: reenviar para aprovação" }).click();
  await ca.getByText("Reenviado").first().waitFor({ timeout: 15000 });
  ok(true, "agência reenvia depois do ajuste");

  await ca.goto(`${BASE}/calendario?cliente=c0000000-0000-4000-8000-0000000000d1`);
  await ca.getByRole("link", { name: "Novo post" }).click();
  await ca.getByLabel("Título interno").fill("Post novo do teste");
  await ca.getByLabel("Data de publicação").fill(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10));
  await ca.getByLabel("Legenda").fill("Legenda de teste.");
  await ca.getByRole("button", { name: "Salvar e enviar para aprovação" }).click();
  await ca.waitForURL(/\/conteudos\/[0-9a-f-]{36}/, { timeout: 15000 });
  await ca.getByText("Aguardando aprovação").first().waitFor();
  ok(true, "agência cria post e envia para aprovação");
  await captura(ca, "demo-calendario-agencia");

  await cm.goto(`${BASE}/aprovacoes`);
  t = await texto(cm);
  ok(t.includes("Post novo do teste") && t.includes("Ingredientes de produtores de Minas"), "cliente recebe o post novo e o reenviado");

  const cr = await entrar({}, "rafael");
  await cr.goto(`${BASE}/calendario?cliente=c0000000-0000-4000-8000-0000000000d1`);
  t = await texto(cr);
  ok(!t.includes("Promoção da semana"), "equipe não vê posts de cliente que não atende");

  await cm.goto(`${BASE}/feed`);
  ok((await texto(cm)).includes("@padaria.aurora.exemplo"), "prévia do feed abre com o perfil do cliente");
  await captura(cm, "demo-feed");
}

// Chat, estratégia, documentos e financeiro
{
  const cm = await entrar(celular, "marina");
  await cm.goto(`${BASE}/mensagens`);
  await cm.getByText("Já ajustei o horário na agenda").waitFor();
  ok(true, "cliente vê o histórico do chat com a agência");
  await cm.getByLabel("Mensagem").fill("Pode me mandar a arte da cesta antes de sexta?");
  await cm.getByRole("button", { name: "Enviar" }).click();
  await cm.getByText("Pode me mandar a arte da cesta antes de sexta?").waitFor({ timeout: 15000 });
  await captura(cm, "demo-chat-cliente");

  const ct = await entrar({ viewport: { width: 1280, height: 900 } }, "taynara");
  await ct.goto(`${BASE}/mensagens`);
  t = await texto(ct);
  ok(t.includes("Padaria Aurora") && t.includes("Estúdio Bravo"), "agência vê a caixa de entrada com os clientes");
  ok(/não lidas/.test(await ct.locator("nav[aria-label=Conversas]").innerHTML()), "caixa de entrada marca as não lidas");
  await ct.getByRole("link", { name: /Padaria Aurora/ }).first().click();
  await ct.getByText("Pode me mandar a arte da cesta antes de sexta?").last().waitFor();
  await ct.getByLabel("Mensagem").fill("Mando sim, Marina. Até quinta à tarde.");
  await ct.keyboard.press("Enter");
  await ct.getByText("Mando sim, Marina. Até quinta à tarde.").last().waitFor({ timeout: 15000 });
  await captura(ct, "demo-chat-agencia");
  await cm.getByText("Mando sim, Marina. Até quinta à tarde.").last().waitFor({ timeout: 15000 });
  ok(true, "resposta da agência chega no chat do cliente sem recarregar");

  const cj = await entrar({}, "julia");
  await cj.goto(`${BASE}/mensagens?cliente=c0000000-0000-4000-8000-0000000000d1`);
  await cj.getByText("Mando sim, Marina. Até quinta à tarde.").last().waitFor();
  ok(true, "conversa fica gravada para a equipe que atende o cliente");

  await cm.goto(`${BASE}/estrategia`);
  t = await texto(cm);
  ok(t.includes("Encomendas de fim de ano") && t.includes("Alinhamento mensal") && t.includes("Briefing enviado"), "cliente vê estratégia, reuniões e briefing");
  await captura(cm, "demo-estrategia");

  await cj.goto(`${BASE}/estrategia?cliente=c0000000-0000-4000-8000-0000000000d1`);
  await cj.getByLabel("Metas do mês").fill("50 encomendas de cestas até o dia 20");
  await cj.getByRole("button", { name: "Salvar e publicar para o cliente" }).click();
  await cj.getByText(/Versão 2, publicada/).waitFor({ timeout: 15000 });
  await cm.reload();
  ok((await texto(cm)).includes("50 encomendas de cestas"), "estratégia nova chega ao cliente como versão 2");

  await cm.goto(`${BASE}/documentos`);
  ok((await texto(cm)).includes("Prazos e aprovações"), "documentos mostram o manual da parceria");

  await cm.goto(`${BASE}/financeiro`);
  t = await texto(cm);
  ok(t.includes("R$") && /Pago/.test(t), "cliente vê as próprias mensalidades");
  await captura(cm, "demo-financeiro-cliente");
  await cj.goto(`${BASE}/financeiro`);
  ok(cj.url().endsWith("/inicio"), "equipe não abre o financeiro");
  await ct.goto(`${BASE}/financeiro`);
  t = await texto(ct);
  ok(/previsto/i.test(t) && t.includes("Padaria Aurora") && t.includes("Estúdio Bravo"), "dona vê o financeiro de todos");
  await captura(ct, "demo-financeiro-agencia");
}

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
