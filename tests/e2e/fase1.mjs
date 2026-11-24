// Verificação ponta a ponta da Fase 1 no navegador, contra o Supabase local.
// Uso: node tests/e2e/fase1.mjs [pasta-de-capturas]
// Requer: `npx supabase start`, `npx supabase db reset` e o app rodando em http://localhost:3000.
import { createRequire } from "node:module";
// Usa o Playwright instalado no sistema ou no projeto.
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";
import { createHmac } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const SENHA = "senha-local-123";
const saida = process.argv[2];
if (saida) mkdirSync(saida, { recursive: true });

let falhas = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "ok  " : "FALHA"} ${msg}`);
  if (!cond) falhas++;
};

const browser = await chromium.launch();

async function semRolagemHorizontal(page, rotulo) {
  const largura = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(largura <= 0, `${rotulo}: sem rolagem horizontal (${largura}px)`);
}

async function captura(page, nome) {
  if (saida) await page.screenshot({ path: `${saida}/${nome}.png`, fullPage: true });
}

async function novoContexto(largura = 1280, altura = 860) {
  return browser.newContext({ viewport: { width: largura, height: altura } });
}

async function entrarComSenha(page, email) {
  await page.goto(`${BASE}/entrar`);
  await page.getByRole("tab", { name: "Sou da equipe" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL("**/inicio");
}

async function textoDaPagina(page) {
  // Espera o conteúdo real substituir o esqueleto de carregamento.
  await page.locator("main#conteudo h1").first().waitFor();
  await page.waitForLoadState("networkidle");
  return page.locator("main#conteudo").innerText();
}

async function barrado(page, rota) {
  await page.goto(`${BASE}${rota}`);
  try {
    await page.waitForURL("**/inicio", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// 1. Visitante vai para a entrada
{
  const ctx = await novoContexto();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/clientes`);
  ok(page.url().includes("/entrar"), "visitante sem login é levado para /entrar");
  await captura(page, "entrar-desktop");
  await ctx.close();
  for (const largura of [360, 390]) {
    const c = await novoContexto(largura, 800);
    const p = await c.newPage();
    await p.goto(`${BASE}/entrar`);
    await semRolagemHorizontal(p, `entrar ${largura}px`);
    if (largura === 390) await captura(p, "entrar-celular");
    await c.close();
  }
}

// 2. Perfis com senha
const casos = [
  { email: "admin@agencia-tc.teste", ve: ["Padaria Fictícia Aurora", "Estúdio Fictício Bravo"], naoVe: ["Loja Fictícia Cedro"], pode: ["/equipe"], naoPode: ["/plataforma"], nome: "admin-tc" },
  { email: "social@agencia-tc.teste", ve: ["Padaria Fictícia Aurora", "Estúdio Fictício Bravo"], naoVe: ["Loja Fictícia Cedro"], pode: [], naoPode: ["/equipe", "/plataforma"], nome: "social" },
  { email: "designer@agencia-tc.teste", ve: ["Estúdio Fictício Bravo"], naoVe: ["Padaria Fictícia Aurora", "Loja Fictícia Cedro"], pode: [], naoPode: ["/equipe"], nome: "designer" },
  { email: "admin@exemplo-norte.teste", ve: ["Loja Fictícia Cedro"], naoVe: ["Padaria Fictícia Aurora", "Estúdio Fictício Bravo"], pode: ["/equipe"], naoPode: [], nome: "admin-norte" },
];

for (const caso of casos) {
  const ctx = await novoContexto();
  const page = await ctx.newPage();
  await entrarComSenha(page, caso.email);
  const texto = await textoDaPagina(page);
  for (const v of caso.ve) ok(texto.includes(v), `${caso.nome} vê ${v}`);
  for (const v of caso.naoVe) ok(!texto.includes(v), `${caso.nome} não vê ${v}`);
  await captura(page, `${caso.nome}-inicio-desktop`);
  for (const rota of caso.pode) {
    await page.goto(`${BASE}${rota}`);
    ok(page.url().endsWith(rota), `${caso.nome} abre ${rota}`);
  }
  for (const rota of caso.naoPode) ok(await barrado(page, rota), `${caso.nome} é barrado em ${rota}`);
  await ctx.close();
}

// Senha errada
{
  const ctx = await novoContexto();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`);
  await page.getByRole("tab", { name: "Sou da equipe" }).click();
  await page.getByLabel("E-mail").fill("admin@agencia-tc.teste");
  await page.getByLabel("Senha").fill("errada-123456");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const aviso = page.getByText("E-mail ou senha incorretos.");
  await aviso.waitFor();
  ok(await aviso.isVisible(), "senha errada mostra aviso");
  await ctx.close();
}

// 3. Dono da plataforma
{
  const ctx = await novoContexto();
  const page = await ctx.newPage();
  await entrarComSenha(page, "dono@plataforma.teste");
  await page.goto(`${BASE}/plataforma`);
  const texto = await textoDaPagina(page);
  ok(texto.includes("Agência Taynara Castro") && texto.includes("Agência Exemplo Norte"), "dono vê as agências");
  ok(!texto.includes("Padaria Fictícia Aurora"), "dono não vê nomes de clientes");
  await captura(page, "plataforma-desktop");
  await ctx.close();
}

// 4. Cliente por link mágico, no celular
async function linkDoEmail(email) {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages } = await r.json();
    if (messages?.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json();
      const m = msg.HTML.match(/href="([^"]*auth\/confirm[^"]*)"/);
      if (m) return m[1].replace(/&amp;/g, "&");
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  return null;
}

{
  await fetch(`${MAILPIT}/api/v1/messages`, { method: "DELETE" });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`);
  await page.getByLabel("Seu e-mail").fill("cliente.aurora@exemplo.teste");
  await page.getByRole("button", { name: "Receber link de acesso" }).click();
  await page.getByText("Confira seu e-mail").waitFor();
  await captura(page, "entrar-link-enviado-celular");
  const link = await linkDoEmail("cliente.aurora@exemplo.teste");
  ok(!!link, "e-mail com link mágico chegou");
  // Link aberto em outro "aparelho" (contexto novo) também funciona
  const outro = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p2 = await outro.newPage();
  await p2.goto(link);
  await p2.waitForURL("**/inicio");
  const texto = await textoDaPagina(p2);
  ok(texto.includes("Padaria Fictícia Aurora"), "cliente vê a própria conta");
  ok(!texto.includes("Estúdio Fictício Bravo"), "cliente não vê outro cliente");
  ok(texto.includes("Social Media Teste"), "cliente vê o responsável");
  await semRolagemHorizontal(p2, "inicio do cliente 390px");
  await captura(p2, "cliente-inicio-celular");
  await p2.getByRole("button", { name: "Abrir menu" }).click();
  await captura(p2, "cliente-menu-celular");
  await p2.keyboard.press("Escape");
  ok(await barrado(p2, "/clientes"), "cliente é barrado em /clientes");
  // link já usado não funciona de novo
  const p3 = await (await browser.newContext()).newPage();
  await p3.goto(link);
  ok(p3.url().includes("erro=link"), "link mágico não funciona duas vezes");
  await outro.close();
  await ctx.close();
}

// 5. E-mail desconhecido recebe a mesma resposta (sem revelar quem é cliente)
{
  const ctx = await novoContexto();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`);
  await page.getByLabel("Seu e-mail").fill("ninguem@exemplo.teste");
  await page.getByRole("button", { name: "Receber link de acesso" }).click();
  await page.getByText("Confira seu e-mail").waitFor();
  ok(true, "e-mail desconhecido recebe a mesma mensagem");
  await ctx.close();
}

// 6. Telas em 360px para a equipe
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await entrarComSenha(page, "admin@agencia-tc.teste");
  for (const rota of ["/inicio", "/clientes", "/equipe", "/conta/seguranca"]) {
    await page.goto(`${BASE}${rota}`);
    await semRolagemHorizontal(page, `${rota} 360px`);
    await captura(page, `admin${rota.replace(/\//g, "-")}-360`);
  }
  await ctx.close();
}

// 7. Verificação em duas etapas do admin
function totp(segredoBase32, deslocamento = 0) {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of segredoBase32.replace(/=+$/, "").toUpperCase()) bits += alfabeto.indexOf(c).toString(2).padStart(5, "0");
  const chave = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + deslocamento));
  const h = createHmac("sha1", chave).update(contador).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

{
  const ctx = await novoContexto();
  const page = await ctx.newPage();
  await entrarComSenha(page, "admin@agencia-tc.teste");
  await page.goto(`${BASE}/conta/seguranca`);
  await page.getByRole("button", { name: "Ligar verificação" }).click();
  const segredo = (await page.locator("code").innerText()).trim();
  await captura(page, "seguranca-cadastro-desktop");
  await page.getByLabel("Código do aplicativo").fill(totp(segredo));
  await page.getByRole("button", { name: "Confirmar e ligar" }).click();
  await page.getByText("Ligada.").waitFor();
  ok(true, "admin liga a verificação em duas etapas");

  // Nova entrada exige o código
  const ctx2 = await novoContexto();
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/entrar`);
  await p2.getByRole("tab", { name: "Sou da equipe" }).click();
  await p2.getByLabel("E-mail").fill("admin@agencia-tc.teste");
  await p2.getByLabel("Senha").fill(SENHA);
  await p2.getByRole("button", { name: "Entrar", exact: true }).click();
  await p2.waitForURL("**/entrar/verificacao");
  ok(true, "nova entrada pede o código");
  await p2.goto(`${BASE}/clientes`);
  ok(p2.url().includes("/entrar/verificacao"), "sem código, o painel continua fechado");
  // Espera a próxima janela de 30s para não reaproveitar o mesmo código.
  await new Promise((r) => setTimeout(r, 30000 - (Date.now() % 30000) + 500));
  await p2.getByLabel("Código").fill(totp(segredo));
  await p2.getByRole("button", { name: "Confirmar" }).click();
  await p2.waitForURL("**/inicio");
  ok((await textoDaPagina(p2)).includes("Padaria Fictícia Aurora"), "com o código, o admin entra e vê os clientes");

  // Desliga para o teste poder rodar de novo
  await p2.goto(`${BASE}/conta/seguranca`);
  await p2.getByRole("button", { name: "Desligar verificação" }).click();
  await p2.getByRole("button", { name: "Ligar verificação" }).waitFor();
  ok(true, "admin desliga a verificação");
  await ctx2.close();
  await ctx.close();
}

await browser.close();
console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
