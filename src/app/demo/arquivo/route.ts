import { NextResponse, type NextRequest } from "next/server";
import { DEMO } from "@/lib/demo/config";

/** Demonstração: os arquivos não são guardados. Mostra uma imagem no lugar. */
export async function GET(request: NextRequest) {
  if (!DEMO) return new NextResponse(null, { status: 404 });
  const nome = (request.nextUrl.searchParams.get("nome") ?? "arquivo").replace(/[<>&"']/g, "").slice(0, 80);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="#F3EBDC"/><rect x="40" y="40" width="720" height="420" fill="none" stroke="#C9A45F" stroke-width="2"/><text x="400" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#3F2616">${nome}</text><text x="400" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6E5B48">Na demonstração, os arquivos enviados não são guardados.</text></svg>`;
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" } });
}
