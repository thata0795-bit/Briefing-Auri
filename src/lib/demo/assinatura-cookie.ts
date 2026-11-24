/**
 * Cookie de acesso assinado (HMAC-SHA256) para a demonstração.
 * Usa Web Crypto, que funciona tanto no middleware quanto no servidor.
 */
const codificador = new TextEncoder();

function segredo() {
  const s = process.env.DEMO_SEGREDO;
  if (!s || s.length < 32) throw new Error("DEMO_SEGREDO ausente ou curto demais (mínimo 32 caracteres).");
  return s;
}

async function chave() {
  return crypto.subtle.importKey("raw", codificador.encode(segredo()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function assinarUsuario(uid: string) {
  const assinatura = hex(await crypto.subtle.sign("HMAC", await chave(), codificador.encode(`usuario:${uid}`)));
  return `${uid}.${assinatura}`;
}

/** Devolve o id do usuário se a assinatura confere; senão, null. */
export async function lerUsuarioAssinado(valor: string | undefined | null) {
  if (!valor) return null;
  const ponto = valor.lastIndexOf(".");
  if (ponto < 1) return null;
  const uid = valor.slice(0, ponto);
  if (!/^[0-9a-f-]{36}$/.test(uid)) return null;
  const esperado = await assinarUsuario(uid);
  if (esperado.length !== valor.length) return null;
  let diferenca = 0;
  for (let i = 0; i < esperado.length; i++) diferenca |= esperado.charCodeAt(i) ^ valor.charCodeAt(i);
  return diferenca === 0 ? uid : null;
}
