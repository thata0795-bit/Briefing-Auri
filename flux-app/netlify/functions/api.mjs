import { getStore } from "@netlify/blobs";
import {
  store, json, fail, str, newId, safeId, listJSON, hashPw, newSalt, safeEq, checkSetupCode, secret, makeToken, readToken,
  accessCode, ensureSeed, publicUser, runDue, sendWhatsApp, waNumber
} from "../lib/core.mjs";

const COOKIE = "flux_s";
const ymdRe = /^\d{4}-\d{2}-\d{2}$/, hmRe = /^\d{2}:\d{2}$/, ymRe = /^\d{4}-\d{2}$/;
const slow = () => new Promise((r) => setTimeout(r, 400));
const pwOk = (p) => typeof p === "string" && p.length >= 6 && p.length <= 100;

function setSession(context, token) {
  context.cookies.set({ name: COOKIE, value: token, httpOnly: true, secure: true, sameSite: "Lax", path: "/", expires: new Date(Date.now() + 30 * 864e5) });
}

async function currentUser(st, context) {
  const t = readToken(await secret(st), context.cookies.get(COOKIE));
  if (!t || !safeId(t.uid)) return null;
  const u = await st.get(`users/${t.uid}`, { type: "json" });
  if (!u || !u.passHash || (u.sessionVer || 0) !== t.ver) return null;
  return u;
}

async function login(st, context, u) {
  setSession(context, makeToken(await secret(st), u.id, u.sessionVer || 0));
  return json({ ok: true });
}

function cleanEvent(b, prev, me) {
  const type = b.type === "captacao" ? "captacao" : "reuniao";
  if (!ymdRe.test(b.date || "") || !hmRe.test(b.start || "")) return null;
  const end = hmRe.test(b.end || "") && b.end > b.start ? b.end : "";
  return {
    type, title: str(b.title, 90) || (type === "captacao" ? "Captação" : "Reunião"), client: str(b.client, 60),
    date: b.date, start: b.start, end, location: str(b.location, 160), notes: str(b.notes, 1500),
    participants: Array.isArray(b.participants) ? b.participants.filter(safeId).slice(0, 30) : [],
    scriptId: type === "captacao" && safeId(b.scriptId) ? b.scriptId : "",
    createdBy: prev ? prev.createdBy : me.id, updatedBy: me.id, updatedAt: Date.now(),
  };
}

function cleanScript(b, prev, me) {
  if (!ymRe.test(b.month || "")) return null;
  const files = (Array.isArray(b.files) ? b.files : []).filter((f) => f && safeId(f.id)).slice(0, 20)
    .map((f) => ({ id: f.id, name: str(f.name, 120) || "arquivo", size: Math.max(0, +f.size || 0), type: str(f.type, 80) }));
  const links = String(b.links || "").split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 20).map((l) => l.slice(0, 500)).join("\n");
  if (!files.length && !links) return null;
  const status = prev && ["lancado", "gravado"].includes(b.status) ? b.status : "lancado";
  const first = files[0] ? files[0].name.replace(/\.[a-z0-9]{1,5}$/i, "") : "";
  return {
    title: first || (prev && prev.title) || "Roteiro de Reels", month: b.month, files, links,
    status, releasedAt: prev ? prev.releasedAt || Date.now() : Date.now(), videomakers: [],
    createdBy: prev ? prev.createdBy : me.id, updatedAt: Date.now(),
  };
}

const fileStore = () => getStore({ name: "flux-files", consistency: "strong" });
const CHUNK = 3 * 1024 * 1024, MAX_CHUNKS = 7;

async function deleteFile(fid) {
  const fs = fileStore();
  const { blobs } = await fs.list({ prefix: `f/${fid}/` });
  await Promise.all(blobs.map((b) => fs.delete(b.key)));
}

export default async (req, context) => {
  const st = store();
  await ensureSeed(st);
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = req.method;
  let body = {};
  const isChunk = parts[0] === "files" && parts[2] === "chunk";
  if (method !== "GET" && !isChunk) { try { body = await req.json(); } catch { body = {}; } }

  /* ---------- public routes ---------- */
  if (parts[0] === "session" && method === "GET") {
    const me = await currentUser(st, context);
    const users = await listJSON(st, "users/");
    const needsSetup = !users.some((u) => u.isAdmin && u.passHash);
    if (!me) return json({ auth: false, needsSetup, team: needsSetup ? users.map((u) => ({ id: u.id, name: u.name })) : [] });
    return json({ auth: true, me: publicUser(me) });
  }
  if (parts[0] === "setup" && method === "POST") {
    const users = await listJSON(st, "users/");
    if (users.some((u) => u.isAdmin && u.passHash)) return fail("O FLUX já foi configurado. Entre com seu usuário e senha.", 409);
    if (!checkSetupCode(body.code)) { await slow(); return fail("Código de instalação incorreto.", 401); }
    if (!pwOk(body.password)) return fail("A senha precisa ter pelo menos 6 caracteres.");
    const u = users.find((x) => x.id === body.memberId);
    if (!u) return fail("Escolha seu nome na lista.");
    const salt = newSalt();
    const next = { ...u, isAdmin: true, salt, passHash: hashPw(body.password, salt), sessionVer: (u.sessionVer || 0) + 1, codeHash: "", codeExp: 0 };
    await st.setJSON(`users/${u.id}`, next);
    return login(st, context, next);
  }
  if (parts[0] === "login" && method === "POST") {
    const lg = str(body.login, 40).toLowerCase();
    const u = (await listJSON(st, "users/")).find((x) => x.login === lg);
    if (!u || !u.passHash || !safeEq(hashPw(String(body.password || ""), u.salt), u.passHash)) { await slow(); return fail("Usuário ou senha incorretos.", 401); }
    return login(st, context, u);
  }
  if (parts[0] === "first-access" && method === "POST") {
    const lg = str(body.login, 40).toLowerCase();
    const u = (await listJSON(st, "users/")).find((x) => x.login === lg);
    const code = String(body.code || "").trim().toUpperCase();
    if (!u || !u.codeHash || u.codeExp < Date.now() || !safeEq(hashPw(code, u.codeSalt), u.codeHash)) { await slow(); return fail("Usuário ou código de acesso inválido. Peça um código novo para quem administra o FLUX.", 401); }
    if (!pwOk(body.password)) return fail("A senha precisa ter pelo menos 6 caracteres.");
    const salt = newSalt();
    const next = { ...u, salt, passHash: hashPw(body.password, salt), sessionVer: (u.sessionVer || 0) + 1, codeHash: "", codeExp: 0, codeSalt: "" };
    await st.setJSON(`users/${u.id}`, next);
    return login(st, context, next);
  }
  if (parts[0] === "logout" && method === "POST") {
    context.cookies.delete({ name: COOKIE, path: "/" });
    return json({ ok: true });
  }

  /* ---------- signed-in routes ---------- */
  const me = await currentUser(st, context);
  if (!me) return fail("Sua sessão terminou. Entre de novo.", 401);
  const admin = !!me.isAdmin;

  if (parts[0] === "state" && method === "GET") {
    const [users, events, scripts, sentList, cfg, wst] = await Promise.all([
      listJSON(st, "users/"), listJSON(st, "events/"), listJSON(st, "scripts/"),
      st.list({ prefix: "sent/" }), st.get("config/whatsapp", { type: "json" }), st.get("config/wa-status", { type: "json" }),
    ]);
    const sent = {};
    await Promise.all(sentList.blobs.map(async (b) => { const v = await st.get(b.key, { type: "json" }); if (v && v.state === "ok") sent[b.key] = v; }));
    return json({
      me: publicUser(me), members: users.map(publicUser), events, scripts, sent,
      whatsapp: { configured: !!(cfg && cfg.instance && cfg.token), enabled: !!(cfg && cfg.enabled), instance: admin && cfg ? cfg.instance : undefined, ...(wst || {}) },
    });
  }

  if (parts[0] === "password" && method === "POST") {
    if (!safeEq(hashPw(String(body.current || ""), me.salt), me.passHash)) { await slow(); return fail("A senha atual não confere.", 401); }
    if (!pwOk(body.next)) return fail("A nova senha precisa ter pelo menos 6 caracteres.");
    const salt = newSalt();
    const next = { ...me, salt, passHash: hashPw(body.next, salt), sessionVer: (me.sessionVer || 0) + 1 };
    await st.setJSON(`users/${me.id}`, next);
    return login(st, context, next);
  }

  if (parts[0] === "members") {
    const id = parts[1];
    if (method === "POST" && !id) {
      if (!admin) return fail("Só quem administra o FLUX pode adicionar pessoas.", 403);
      const name = str(body.name, 60); if (!name) return fail("Informe o nome.");
      const login = str(body.login || name.split(" ")[0], 40).toLowerCase().normalize("NFD").replace(/[^a-z0-9.]/g, "");
      const users = await listJSON(st, "users/");
      if (!login || users.some((u) => u.login === login)) return fail("Esse usuário já existe. Escolha outro.");
      const nid = newId("m");
      await st.setJSON(`users/${nid}`, { id: nid, name, login, role: str(body.role, 60), whatsapp: str(body.whatsapp, 20), isAdmin: !!body.isAdmin, createdAt: Date.now() });
      return json({ ok: true, id: nid });
    }
    if (!safeId(id)) return fail("Pessoa não encontrada.", 404);
    const u = await st.get(`users/${id}`, { type: "json" });
    if (!u) return fail("Pessoa não encontrada.", 404);
    if (method === "POST" && !parts[2]) {
      if (!admin && id !== me.id) return fail("Você só pode editar o seu perfil.", 403);
      const next = { ...u, name: str(body.name, 60) || u.name, whatsapp: str(body.whatsapp, 20) };
      if (admin) {
        next.role = str(body.role, 60);
        if (id !== me.id) next.isAdmin = !!body.isAdmin;
        const lg = str(body.login, 40).toLowerCase().normalize("NFD").replace(/[^a-z0-9.]/g, "");
        if (lg && lg !== u.login) {
          const users = await listJSON(st, "users/");
          if (users.some((x) => x.login === lg)) return fail("Esse usuário já existe.");
          next.login = lg;
        }
      }
      await st.setJSON(`users/${id}`, next);
      return json({ ok: true });
    }
    if (method === "POST" && parts[2] === "code") {
      if (!admin) return fail("Só quem administra o FLUX pode gerar códigos.", 403);
      const code = accessCode(), codeSalt = newSalt();
      await st.setJSON(`users/${id}`, { ...u, codeSalt, codeHash: hashPw(code, codeSalt), codeExp: Date.now() + 7 * 864e5 });
      return json({ ok: true, code, login: u.login });
    }
    if (method === "DELETE") {
      if (!admin || id === me.id) return fail("Não é possível remover esta pessoa.", 403);
      await st.delete(`users/${id}`);
      return json({ ok: true });
    }
  }

  if (parts[0] === "events") {
    const id = parts[1];
    if (method === "POST") {
      const eid = id && safeId(id) ? id : newId("e");
      const prev = id ? await st.get(`events/${eid}`, { type: "json" }) : null;
      const data = cleanEvent(body, prev, me);
      if (!data) return fail("Confira a data e o horário.");
      await st.setJSON(`events/${eid}`, { id: eid, ...data });
      context.waitUntil(runDue(st).catch(() => {}));
      return json({ ok: true, id: eid });
    }
    if (method === "DELETE" && safeId(id)) {
      await st.delete(`events/${id}`);
      const { blobs } = await st.list({ prefix: `sent/event/${id}/` });
      await Promise.all(blobs.map((b) => st.delete(b.key)));
      return json({ ok: true });
    }
  }

  if (parts[0] === "scripts") {
    const id = parts[1];
    if (method === "POST") {
      const sid = id && safeId(id) ? id : newId("s");
      const prev = id ? await st.get(`scripts/${sid}`, { type: "json" }) : null;
      const data = cleanScript(body, prev, me);
      if (!data) return fail("Adicione pelo menos um arquivo ou um link.");
      await st.setJSON(`scripts/${sid}`, { id: sid, ...data });
      if (prev) {
        const keep = new Set(data.files.map((f) => f.id));
        await Promise.all((prev.files || []).filter((f) => !keep.has(f.id)).map((f) => deleteFile(f.id)));
      }
      if (data.status === "lancado") context.waitUntil(runDue(st).catch(() => {}));
      return json({ ok: true, id: sid });
    }
    if (method === "DELETE" && safeId(id)) {
      const prev = await st.get(`scripts/${id}`, { type: "json" });
      await Promise.all(((prev && prev.files) || []).map((f) => deleteFile(f.id)));
      await st.delete(`scripts/${id}`);
      const { blobs } = await st.list({ prefix: `sent/script/${id}/` });
      await Promise.all(blobs.map((b) => st.delete(b.key)));
      return json({ ok: true });
    }
  }

  if (parts[0] === "files") {
    const fid = parts[1];
    const fs = fileStore();
    if (method === "POST" && !fid) return json({ ok: true, id: newId("f"), chunkSize: CHUNK });
    if (!safeId(fid)) return fail("Arquivo não encontrado.", 404);
    if (method === "POST" && isChunk) {
      const n = Number(parts[3]);
      if (!Number.isInteger(n) || n < 0 || n >= MAX_CHUNKS) return fail("Arquivo grande demais. O limite é 20 MB.", 413);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > CHUNK) return fail("Parte do arquivo grande demais.", 413);
      await fs.set(`f/${fid}/${n}`, buf);
      return json({ ok: true });
    }
    if (method === "POST" && parts[2] === "done") {
      const chunks = Math.min(MAX_CHUNKS, Math.max(1, +body.chunks || 1));
      const meta = { name: str(body.name, 120) || "arquivo", type: str(body.type, 80) || "application/octet-stream", size: +body.size || 0, chunks, by: me.id, at: Date.now() };
      await fs.setJSON(`f/${fid}/meta`, meta);
      return json({ ok: true, file: { id: fid, name: meta.name, size: meta.size, type: meta.type } });
    }
    if (method === "DELETE") {
      const scripts = await listJSON(st, "scripts/");
      if (!scripts.some((s) => (s.files || []).some((f) => f.id === fid))) await deleteFile(fid);
      return json({ ok: true });
    }
    if (method === "GET") {
      const meta = await fs.get(`f/${fid}/meta`, { type: "json" });
      if (!meta) return fail("Arquivo não encontrado.", 404);
      let i = 0;
      const stream = new ReadableStream({
        async pull(ctrl) {
          if (i >= meta.chunks) { ctrl.close(); return; }
          const part = await fs.get(`f/${fid}/${i++}`, { type: "arrayBuffer" });
          if (part) ctrl.enqueue(new Uint8Array(part));
        },
      });
      const safeType = /^[\w.+-]+\/[\w.+-]+$/.test(meta.type) ? meta.type : "application/octet-stream";
      return new Response(stream, { headers: {
        "content-type": safeType, "cache-control": "private, no-store", "x-content-type-options": "nosniff",
        "content-disposition": `${safeType === "application/pdf" || safeType.startsWith("image/") ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
      } });
    }
  }

  if (parts[0] === "sent" && method === "POST") {
    const key = String(body.key || "");
    if (!/^sent\/(event|script)\/[a-z0-9-]+\/[a-z0-9_-]+$/.test(key)) return fail("Item inválido.");
    await st.setJSON(key, { state: "ok", at: Date.now(), by: "manual", who: me.id });
    return json({ ok: true });
  }

  if (parts[0] === "whatsapp") {
    if (!admin) return fail("Só quem administra o FLUX pode mexer no WhatsApp.", 403);
    if (method === "POST" && !parts[1]) {
      const cur = (await st.get("config/whatsapp", { type: "json" })) || {};
      const next = {
        instance: str(body.instance, 120) || cur.instance || "",
        token: str(body.token, 200) || cur.token || "",
        clientToken: body.clientToken === undefined ? cur.clientToken || "" : str(body.clientToken, 200) || cur.clientToken || "",
        enabled: !!body.enabled,
      };
      await st.setJSON("config/whatsapp", next);
      if (next.enabled) context.waitUntil(runDue(st).catch(() => {}));
      return json({ ok: true });
    }
    if (method === "POST" && parts[1] === "test") {
      const cfg = await st.get("config/whatsapp", { type: "json" });
      if (!cfg || !cfg.instance || !cfg.token) return fail("Salve os dados da Z-API antes de testar.");
      const phone = waNumber(me.whatsapp);
      if (!phone) return fail("Cadastre o seu WhatsApp no Time para receber o teste.");
      try { await sendWhatsApp(cfg, phone, "FLUX APP: teste de envio automático. Se esta mensagem chegou, os lembretes estão prontos."); }
      catch (err) { return fail(`O envio falhou. ${String(err.message || err).slice(0, 200)}`, 502); }
      return json({ ok: true });
    }
  }

  return fail("Rota não encontrada.", 404);
};

export const config = { path: "/api/*" };
