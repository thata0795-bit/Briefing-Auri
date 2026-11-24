// Fase 2: um cliente novo percorre toda a entrada pelo celular, para no meio e retoma.
// Uso: node tests/e2e/fase2.mjs [pasta-de-capturas]
// Requer Supabase local com seed e o app em http://localhost:3000.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const saida = process.argv[2];
if (saida) mkdirSync(saida, { recursive: true });

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "ok  " : "FALHA"} ${msg}`);
  if (!cond) falhas++;
};
const captura = async (page, nome) => saida && page.screenshot({ path: `${saida}/${nome}.png`, fullPage: true });
const semRolagem = async (page, rotulo) => {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(extra <= 0, `${rotulo}: sem rolagem horizontal (${extra}px)`);
};

async function email(para, contem) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${para}"`)}`);
    const { messages } = await r.json();
    for (const m of messages ?? []) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
      const link = msg.HTML.match(new RegExp(`href="([^"]*${contem}[^"]*)"`));
      if (link) return { assunto: msg.Subject, link: link[1].replace(/&amp;/g, "&"), html: msg.HTML };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

const browser = await chromium.launch();
const sufixo = Date.now().toString(36);
const EMAIL = `delta.${sufixo}@exemplo.teste`;
const NOME_CLIENTE = `Café Fictício Delta ${sufixo}`;

// 1. Admin cadastra e convida
const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const admin = await ctxAdmin.newPage();
await admin.goto(`${BASE}/entrar`);
await admin.getByRole("tab", { name: "Sou da equipe" }).click();
await admin.getByLabel("E-mail").fill("admin@agencia-tc.teste");
await admin.getByLabel("Senha").fill("senha-local-123");
await admin.getByRole("button", { name: "Entrar", exact: true }).click();
await admin.waitForURL("**/inicio");

await admin.goto(`${BASE}/clientes/novo`);
await admin.getByRole("button", { name: "Cadastrar e enviar convite" }).click();
await admin.getByText("Confira os campos destacados.").waitFor();
ok(true, "formulário vazio mostra os erros");
await admin.getByLabel("Nome da empresa").fill(NOME_CLIENTE);
await admin.getByLabel("Segmento").fill("Alimentação");
await admin.getByLabel("Nome do contato").fill("Contato Delta");
await admin.getByLabel("E-mail do contato").fill(EMAIL);
await admin.getByLabel("Plano", { exact: true }).fill("Plano Essencial");
await admin.getByLabel("Valor mensal (R$)").fill("1.800,00");
await admin.getByLabel("Dia de vencimento").fill("10");
await admin.getByLabel("Responsável na agência").selectOption({ label: "Social Media Teste" });
await admin.getByLabel("Social Media Teste").check();
await captura(admin, "agencia-novo-cliente");
await admin.getByRole("button", { name: "Cadastrar e enviar convite" }).click();
await admin.waitForURL(/\/clientes\/[0-9a-f-]{36}\?convidado=1/);
const urlFicha = admin.url().split("?")[0];
await admin.getByText("Cliente cadastrado e convite enviado").waitFor();
ok(true, "admin vê a confirmação do convite");

// E-mail repetido é recusado sem deixar cadastro pela metade
await admin.goto(`${BASE}/clientes/novo`);
await admin.getByLabel("Nome da empresa").fill("Duplicado Fictício");
await admin.getByLabel("Nome do contato").fill("Outro");
await admin.getByLabel("E-mail do contato").fill(EMAIL);
await admin.getByLabel("Plano", { exact: true }).fill("Plano");
await admin.getByLabel("Valor mensal (R$)").fill("100");
await admin.getByLabel("Dia de vencimento").fill("5");
await admin.getByRole("button", { name: "Cadastrar e enviar convite" }).click();
await admin.getByText("Esse e-mail já tem acesso").first().waitFor();
ok((await admin.getByLabel("Nome da empresa").inputValue()) === "Duplicado Fictício", "e-mail repetido é recusado e o formulário mantém o que foi digitado");
await admin.goto(`${BASE}/clientes`);
ok(!(await admin.locator("main").innerText()).includes("Duplicado Fictício"), "cadastro recusado não fica pela metade");

// 2. Convite por e-mail
const convite = await email(EMAIL, "/convite/");
ok(!!convite, "convite chegou por e-mail");
ok(convite?.assunto.includes("Agência Taynara Castro"), `assunto com o nome da agência (${convite?.assunto})`);

// 3. Cliente no celular (360 px)
const celular = { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
let ctxCli = await browser.newContext(celular);
let cli = await ctxCli.newPage();
await cli.goto(convite.link);
await captura(cli, "cliente-convite");
await cli.getByRole("button", { name: "Entrar no portal" }).click();
await cli.waitForURL("**/entrada/boas-vindas");
ok(true, "convite abre a sessão e leva às boas-vindas");
ok((await cli.locator("main").innerText()).includes("Social Media Teste"), "boas-vindas mostram o responsável");
await semRolagem(cli, "boas-vindas 360px");
await captura(cli, "cliente-boas-vindas");
await cli.getByRole("checkbox").check();
await cli.getByRole("button", { name: "Começar" }).click();
await cli.waitForURL("**/entrada/contrato");

// Contrato
await cli.getByRole("link", { name: /Assinar contrato/ }).waitFor();
// O formato de moeda usa espaço não separável entre "R$" e o valor.
const textoContrato = (await cli.locator("main").innerText()).replace(/\u00a0/g, " ");
ok(textoContrato.includes(NOME_CLIENTE) && textoContrato.includes("R$ 1.800,00"), "contrato preenchido com nome e valor do cliente");
await semRolagem(cli, "contrato 360px");
await captura(cli, "cliente-contrato");
await cli.goto(`${BASE}/entrada/briefing`);
ok(cli.url().endsWith("/entrada/contrato"), "briefing fica bloqueado até assinar o contrato");
await cli.getByRole("link", { name: /Assinar contrato/ }).click();
await cli.waitForURL("**/assinatura-simulada/**");
await cli.getByLabel("Nome completo de quem assina").fill("Contato Delta");
await cli.getByRole("button", { name: "Assinar contrato" }).click();
await cli.waitForURL("**/entrada/contrato?assinado=1");
await cli.getByText("Contrato assinado").first().waitFor({ timeout: 15000 });
ok(true, "assinatura confirmada pelo webhook libera a próxima etapa");

// Webhook sem assinatura é recusado
const semAssinatura = await fetch(`${BASE}/api/webhooks/assinatura`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ evento: "assinado", ref: "qualquer" }),
});
ok(semAssinatura.status === 401, "webhook sem assinatura HMAC é recusado");

// Manual da parceria
await cli.goto(`${BASE}/entrada`);
await cli.waitForURL("**/entrada/manual");
await cli.getByRole("checkbox").check();
await cli.getByRole("button", { name: "Concordo e continuar" }).click();
await cli.waitForURL("**/entrada/briefing", { timeout: 15000 });
ok(true, "manual da parceria aceito");

// Briefing: começa e para no meio
await cli.getByLabel(/Nome da empresa ou da marca/).fill(NOME_CLIENTE);
await cli.getByRole("button", { name: "Alimentação", exact: true }).click();
await cli.getByLabel(/Conte a história da empresa/).fill("Cafés especiais e bolos caseiros.");
await cli.getByLabel(/Cidades de atuação/).fill("Belo Horizonte");
await cli.getByText("Tudo salvo").waitFor({ timeout: 10000 });
await cli.waitForTimeout(1200);
await captura(cli, "cliente-briefing");
await semRolagem(cli, "briefing 360px");
await ctxCli.close();
ok(true, "cliente fecha o navegador no meio do briefing");

// Retoma em outro aparelho, entrando por link mágico
await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
ctxCli = await browser.newContext(celular);
cli = await ctxCli.newPage();
await cli.goto(`${BASE}/entrar`);
await cli.getByLabel("Seu e-mail").fill(EMAIL);
await cli.getByRole("button", { name: "Receber link de acesso" }).click();
const magico = await email(EMAIL, "auth/confirm");
await cli.goto(magico.link);
await cli.waitForURL("**/entrada/briefing");
ok(true, "ao voltar, o cliente cai direto na etapa onde parou");
// O briefing reabre na primeira parte com pergunta obrigatória em aberto; volta para a 01.
ok((await cli.getByRole("button", { name: "02" }).getAttribute("aria-current")) === "step", "reabre na primeira parte ainda pendente");
await cli.getByRole("button", { name: "01" }).click();
ok((await cli.getByLabel(/Nome da empresa ou da marca/).inputValue()) === NOME_CLIENTE, "resposta de texto continua lá");
ok((await cli.getByLabel(/Cidades de atuação/).inputValue()) === "Belo Horizonte", "texto digitado logo antes de sair foi salvo");
ok((await cli.getByRole("button", { name: "Alimentação", exact: true }).getAttribute("aria-pressed")) === "true", "escolha continua marcada");

// Concluir cedo mostra o que falta
await cli.getByRole("button", { name: /^10 / }).click();
await cli.waitForTimeout(800);
await semRolagem(cli, "briefing na parte 10, 360px");
await cli.getByRole("button", { name: "Concluir briefing" }).click();
await cli.getByText("Faltam algumas respostas obrigatórias.").waitFor();
ok(true, "concluir antes da hora aponta as perguntas que faltam");

// Responde tudo, seção por seção
for (let s = 0; s < 10; s++) {
  await cli.getByRole("button", { name: new RegExp(`^${String(s + 1).padStart(2, "0")} `) }).click();
  const secao = cli.locator("section").filter({ has: cli.locator("header h2") }).first();
  if (s === 6) {
    await secao.getByLabel("Envie a logo").setInputFiles("public/brand/monograma-dourado.png");
    await secao.getByText("monograma-dourado.png", { exact: true }).waitFor({ timeout: 15000 });
    ok((await secao.getByText("monograma-dourado.png", { exact: true }).count()) === 1, "arquivo enviado aparece uma vez na pergunta");
  }
  if (s === 8) {
    // Uma obrigatória fica para depois
    await secao.locator("#q-objetivos-sucesso").waitFor();
    await secao.getByRole("button", { name: "Responder depois" }).nth(1).click();
    await secao.getByText("Marcada para responder depois").waitFor();
  }
  for (const grupo of await secao.getByRole("group").all()) {
    if ((await grupo.locator('button[aria-pressed="true"]').count()) === 0) {
      await grupo.locator("button:not([disabled])").first().click();
    }
  }
  for (const campo of await secao.locator('input[type="text"], input[type="url"], textarea').all()) {
    if (!(await campo.isVisible()) || (await campo.inputValue())) continue;
    if ((await campo.getAttribute("id")) === "q-objetivos-sucesso") continue; // ficou para depois
    const tipo = await campo.getAttribute("type");
    await campo.fill(tipo === "url" ? "pinterest.com/exemplo" : "Resposta de teste");
  }
}
await cli.getByText("Tudo salvo").waitFor({ timeout: 10000 });
await cli.waitForTimeout(1200);
await cli.getByRole("button", { name: "Concluir briefing" }).click();
try {
  await cli.waitForURL("**/entrada/acessos", { timeout: 15000 });
} catch (e) {
  await captura(cli, "erro-concluir-briefing");
  console.log("ALERTAS", await cli.getByRole("alert").allInnerTexts(), cli.url());
  throw e;
}
ok(true, "briefing concluído com uma pergunta para responder depois");

// Acessos
await semRolagem(cli, "acessos 360px");
for (const titulo of ["Instagram", "Meta Business (Facebook e Instagram)", "Perfil da Empresa no Google"]) {
  await cli.getByRole("group", { name: `Situação de ${titulo}` }).getByRole("button", { name: "Já liberei" }).click();
}
await cli.getByRole("group", { name: "Situação de Domínio do site" }).getByRole("button", { name: "Não tenho essa conta" }).click();
await cli.waitForTimeout(800);
await captura(cli, "cliente-acessos");
await cli.getByRole("button", { name: "Concluir checklist" }).click();
await cli.waitForURL("**/entrada/reuniao");

// Primeira reunião
await semRolagem(cli, "reunião 360px");
await captura(cli, "cliente-reuniao");
await cli.locator('label:has(input[name="horario"])').first().click();
await cli.getByRole("button", { name: "Confirmar horário" }).click();
await cli.waitForURL("**/entrada/reuniao?marcada=1");
ok((await cli.locator("main").innerText()).includes("Tudo pronto para começar"), "entrada concluída");
const hrefIcs = await cli.getByRole("link", { name: /\.ics/ }).getAttribute("href");
const ics = await cli.request.get(new URL(hrefIcs, BASE).toString());
const textoIcs = await ics.text();
ok(textoIcs.includes("BEGIN:VCALENDAR"), `arquivo .ics da reunião (${ics.status()} ${hrefIcs})`);
await captura(cli, "cliente-pronto");
await cli.getByRole("link", { name: "Ir para o painel" }).click();
await cli.waitForURL("**/inicio");
await cli.getByText("Estratégia do primeiro mês").waitFor();
ok(true, "painel mostra a estratégia em preparação");
await semRolagem(cli, "painel do cliente 360px");
await captura(cli, "cliente-painel");

// Convite usado não vale de novo
const outra = await (await browser.newContext()).newPage();
await outra.goto(convite.link);
ok((await outra.locator("main").innerText()).includes("não vale mais"), "convite só funciona uma vez");

// 4. Agência vê tudo concluído
await admin.goto(urlFicha);
await admin.getByRole("heading", { name: "Briefing" }).waitFor();
await admin.waitForLoadState("networkidle");
await admin.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
const ficha = await admin.locator("main").innerText();
ok((ficha.match(/Concluído/g) ?? []).length >= 6, "as 6 etapas aparecem concluídas na ficha");
ok(ficha.includes("Cafés especiais e bolos caseiros."), "agência lê as respostas do briefing");
ok(ficha.includes("Cliente vai responder depois"), "agência vê a pergunta deixada para depois");
ok(ficha.includes("monograma-dourado.png"), "agência vê o arquivo enviado");
const linkArquivo = await admin.getByRole("link", { name: /monograma-dourado\.png/ }).getAttribute("href");
ok((await admin.request.get(linkArquivo)).ok(), "link assinado do arquivo abre");
ok(ficha.includes("Assinado"), "contrato aparece assinado");
await admin.getByRole("listitem").filter({ hasText: "Instagram" }).first().getByRole("button", { name: "Confirmar" }).click();
await admin.getByText("Confirmado pela agência").first().waitFor();
ok(true, "agência confirma o acesso liberado");
await captura(admin, "agencia-ficha-cliente");

// Designer (não atribuído) não abre a ficha
const ctxDes = await browser.newContext();
const des = await ctxDes.newPage();
await des.goto(`${BASE}/entrar`);
await des.getByRole("tab", { name: "Sou da equipe" }).click();
await des.getByLabel("E-mail").fill("designer@agencia-tc.teste");
await des.getByLabel("Senha").fill("senha-local-123");
await des.getByRole("button", { name: "Entrar", exact: true }).click();
await des.waitForURL("**/inicio");
const r = await des.goto(urlFicha);
ok(r.status() === 404, "equipe não atribuída recebe 404 na ficha");

await browser.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
