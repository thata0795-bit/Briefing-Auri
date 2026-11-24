#!/usr/bin/env node
// Grava cenas de motion design feitas em HTML/CSS/JS como video, quadro a quadro (sem perder quadros).
//
//   node anima.mjs cena.html --dur 4.5 --saida cena.mp4 [--cliente slug] [--fps 30] [--largura 1080 --altura 1920] [--hash nome] [--alfa]
// --alfa: fundo transparente, saida .mov (qtrle) para sobrepor a um video com ffmpeg overlay (sem perder qualidade do video)
//
// A cena e controlada pelo tempo: todas as animacoes CSS/Web Animations sao pausadas e posicionadas em t,
// e se a pagina definir window.cena = (t) => {...} (t em segundos), ela e chamada a cada quadro
// (use para canvas, particulas, contadores). Com --cliente, as cores e fontes do perfil entram como
// variaveis CSS (--bg, --fg, --acc, --dark, --claro, --destaque, --luz, --fonte-titulo, --fonte-corpo, --fonte-acento).
// --hash define location.hash (ex.: um arquivo com varias cenas escolhe qual mostrar pelo hash).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (!args.length || args[0] === '-h') {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 11).join('\n'));
  process.exit(0);
}
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const html = path.resolve(args[0]);
const dur = Number(opt('--dur', '4'));
const fps = Number(opt('--fps', '30'));
const W = Number(opt('--largura', '1080'));
const H = Number(opt('--altura', '1920'));
const saida = path.resolve(opt('--saida', html.replace(/\.html$/, '.mp4')));
const slug = opt('--cliente');
const hash = opt('--hash', '');
const alfa = args.includes('--alfa');  // fundo transparente: gera .mov com canal alfa para sobrepor ao video

const aqui = path.dirname(fileURLToPath(import.meta.url));
let raiz = path.resolve(aqui, '../../../..');
if (!fs.existsSync(path.join(raiz, 'estudio'))) raiz = process.cwd();
let css = '';
if (slug) {
  const pf = JSON.parse(fs.readFileSync(path.join(raiz, 'estudio/clientes', slug, 'perfil.json'), 'utf8'));
  const pal = pf.visual?.paleta || {};
  const fx = pf.visual?.fontes || {};
  const fam = (f) => (f ? `'${f}', ` : '');
  css = `:root{${Object.entries(pal).map(([k, v]) => `--${k}:${v};`).join('')}` +
        `--fonte-titulo:${fam(fx.titulo)}Georgia,serif;--fonte-corpo:${fam(fx.corpo)}Arial,sans-serif;--fonte-acento:${fam(fx.acento)}serif;}`;
  const fams = [fx.titulo, fx.corpo, fx.acento].filter(Boolean)
    .map((f) => `family=${f.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600`).join('&');
  if (fams) css = `@import url('https://fonts.googleapis.com/css2?${fams}&display=block');` + css;
}

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = createRequire(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'x'))('playwright')); }
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file://' + html + (hash ? '#' + hash : ''), { waitUntil: 'networkidle' });
if (css) await page.addStyleTag({ content: css });
await page.evaluate(async () => {
  const pedidos = new Set();
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    for (const f of cs.fontFamily.split(',')) pedidos.add(`${cs.fontStyle} ${cs.fontWeight} 40px ${f.trim()}`);
  });
  await Promise.all([...pedidos].map((p) => document.fonts.load(p).catch(() => null)));
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))));
});

fs.mkdirSync(path.dirname(saida), { recursive: true });
const cod = alfa ? ['-c:v', 'qtrle', '-pix_fmt', 'argb'] : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p'];
const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  ...cod, '-r', String(fps), saida], { stdio: ['pipe', 'inherit', 'inherit'] });
const n = Math.round(dur * fps);
for (let i = 0; i < n; i++) {
  const t = i / fps;
  await page.evaluate(async (t) => {
    document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t * 1000; });
    if (window.cena) await window.cena(t);
  }, t);
  const buf = alfa ? await page.screenshot({ type: 'png', omitBackground: true }) : await page.screenshot({ type: 'jpeg', quality: 94 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`${saida}  ${n} quadros  ${dur}s`);
