// Gera guia-portal.pdf a partir de guia-portal.html.
// Fluxo: HTML -> captura de cada página A4 no Chromium -> PDF montado com PIL.
// Uso: node docs/apresentacao/gerar-pdf.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const pasta = dirname(fileURLToPath(import.meta.url));
const corpo = readFileSync(join(pasta, "guia-portal.html"), "utf8");
const montado = join(pasta, ".render.html");
writeFileSync(
  montado,
  `<!doctype html><html lang="pt-BR" class="pdf"><head><meta charset="utf-8"><meta name="viewport" content="width=794">${corpo.replace(/<\/style>/, "</style></head><body>")}</body></html>`,
);

const saida = join(pasta, ".paginas");
rmSync(saida, { recursive: true, force: true });
mkdirSync(saida);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
await page.goto(`file://${montado}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState("networkidle");

const paginas = await page.locator(".pagina").all();
let problemas = 0;
for (const [i, p] of paginas.entries()) {
  const { altura, sobra } = await p.evaluate((el) => {
    const r = el.querySelector(".rodape");
    return { altura: el.scrollHeight, sobra: r ? el.getBoundingClientRect().bottom - r.getBoundingClientRect().bottom : 0 };
  });
  if (altura > 1123) {
    console.log(`Página ${i + 1}: conteúdo passa da folha (${altura}px)`);
    problemas++;
  }
  await p.screenshot({ path: join(saida, `${String(i + 1).padStart(2, "0")}.png`) });
  console.log(`Página ${i + 1}: ok (${altura}px, rodapé a ${Math.round(sobra)}px da borda)`);
}
await browser.close();

execFileSync("python3", [
  "-c",
  `import glob
from PIL import Image
arqs = sorted(glob.glob(${JSON.stringify(saida)} + "/*.png"))
imgs = [Image.open(a).convert("RGB") for a in arqs]
imgs[0].save(${JSON.stringify(join(pasta, "guia-portal.pdf"))}, save_all=True, append_images=imgs[1:], resolution=192.0)
print(len(imgs), "páginas no PDF")`,
]);
rmSync(montado);
process.exit(problemas ? 1 : 0);
