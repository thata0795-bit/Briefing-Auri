#!/usr/bin/env node
// Renderiza pecas de design feitas em HTML (posts, carrosseis, stories, capas, logos) em PNG e, se pedido, PDF.
//
//   node render.mjs peca.html --saida pasta [--cliente slug] [--escala 1] [--pdf nome.pdf] [--transparente]
//
// Cada elemento com a classe .pagina vira um arquivo (pagina-01.png, pagina-02.png...), no tamanho exato do
// elemento. Com --cliente, as cores e fontes do perfil entram como variaveis CSS (--bg, --fg, --acc, --dark,
// --claro, --destaque, --fonte-titulo, --fonte-corpo, --fonte-acento) e as fontes do Google Fonts sao carregadas.
// Elementos <svg class="logo-svg" data-nome="x"> tambem sao exportados como x.svg (vetor editavel).
// --transparente exporta sem fundo (logo em PNG).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (!args.length || args[0] === '-h') {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).join('\n'));
  process.exit(0);
}
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
const html = path.resolve(args[0]);
const saida = path.resolve(opt('--saida', path.join(path.dirname(html), 'export')));
const escala = Number(opt('--escala', '1'));
const slug = opt('--cliente');
fs.mkdirSync(saida, { recursive: true });

const aqui = path.dirname(fileURLToPath(import.meta.url));
let raiz = path.resolve(aqui, '../../../..');
if (!fs.existsSync(path.join(raiz, 'estudio'))) raiz = process.cwd();

let css = '';
if (slug) {
  const pf = JSON.parse(fs.readFileSync(path.join(raiz, 'estudio/clientes', slug, 'perfil.json'), 'utf8'));
  const pal = pf.visual?.paleta || {};
  const fx = pf.visual?.fontes || {};
  const vars = Object.entries(pal).map(([k, v]) => `--${k}:${v};`).join('');
  const fam = (f) => (f ? `'${f}', ` : '');
  css = `:root{${vars}--fonte-titulo:${fam(fx.titulo)}Georgia,serif;--fonte-corpo:${fam(fx.corpo)}Arial,sans-serif;` +
        `--fonte-acento:${fam(fx.acento)}${fam(fx.titulo)}serif;}`;
  const familias = [fx.titulo, fx.corpo, fx.acento].filter(Boolean)
    .map((f) => `family=${f.replace(/ /g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500`).join('&');
  if (familias) css = `@import url('https://fonts.googleapis.com/css2?${familias}&display=block');` + css;
  // fontes proprias do cliente (arquivos que nao estao no Google Fonts, ex.: Sloop)
  const pastaF = path.join(raiz, 'estudio/clientes', slug, 'fontes');
  if (fs.existsSync(pastaF)) {
    for (const f of fs.readdirSync(pastaF).filter((x) => /\.(ttf|otf|woff2?)$/i.test(x))) {
      const nome = f.replace(/[-_ ]?(Regular|Bold|Italic|Medium|Light)?\.(ttf|otf|woff2?)$/i, '');
      css = `@font-face{font-family:'${nome}';src:url('file://${path.join(pastaF, f)}');}` + css;
    }
  }
}

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = createRequire(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'x'))('playwright')); }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: escala });
await page.goto('file://' + html, { waitUntil: 'networkidle' });
if (css) await page.addStyleTag({ content: css });
// forca o carregamento de cada familia e peso usados na pagina antes da captura
await page.evaluate(async () => {
  const pedidos = new Set();
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (!el.textContent.trim()) return;
    for (const f of cs.fontFamily.split(',')) pedidos.add(`${cs.fontStyle} ${cs.fontWeight} 40px ${f.trim()}`);
  });
  await Promise.all([...pedidos].map((p) => document.fonts.load(p).catch(() => null)));
  await document.fonts.ready;
});
await page.waitForTimeout(300);

const faltando = await page.evaluate(() => {
  const genericas = ['serif', 'sans-serif', 'monospace', 'Georgia', 'Arial', 'system-ui'];
  const ruins = new Set();
  document.querySelectorAll('*').forEach((el) => {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
    const cs = getComputedStyle(el);
    const f = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    if (f && !genericas.includes(f) && !document.fonts.check(`${cs.fontStyle} ${cs.fontWeight} 16px "${f}"`)) ruins.add(`${f} ${cs.fontWeight}${cs.fontStyle === 'italic' ? ' italico' : ''}`);
  });
  return [...ruins];
});
if (faltando.length) console.log('AVISO fontes nao carregadas (a peca saiu com fonte substituta):', faltando.join(', '));

const paginas = await page.$$('.pagina');
const alvos = paginas.length ? paginas : [await page.$('body')];
const arquivos = [];
for (let i = 0; i < alvos.length; i++) {
  const nome = (await alvos[i].getAttribute('data-nome')) || `pagina-${String(i + 1).padStart(2, '0')}`;
  const out = path.join(saida, `${nome}.png`);
  await alvos[i].screenshot({ path: out, omitBackground: flag('--transparente') });
  const box = await alvos[i].boundingBox();
  arquivos.push(out);
  console.log(`${out}  ${Math.round(box.width * escala)}x${Math.round(box.height * escala)}`);
}
for (const svg of await page.$$('svg.logo-svg')) {
  const nome = (await svg.getAttribute('data-nome')) || 'logo';
  let src = await svg.evaluate((n) => n.outerHTML);
  if (!src.includes('xmlns=')) src = src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  fs.writeFileSync(path.join(saida, `${nome}.svg`), src);
  console.log(path.join(saida, `${nome}.svg`));
}
await browser.close();

const pdf = opt('--pdf');
if (pdf) {
  const py = 'import sys\nfrom PIL import Image\nims=[Image.open(p).convert("RGB") for p in sys.argv[2:]]\n' +
             'ims[0].save(sys.argv[1], save_all=True, append_images=ims[1:], resolution=150)';
  execFileSync('python3', ['-c', py, path.join(saida, pdf), ...arquivos]);
  console.log(path.join(saida, pdf));
}
