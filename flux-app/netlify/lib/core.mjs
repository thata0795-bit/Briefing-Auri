// Shared server logic for FLUX APP: storage, auth, messages and WhatsApp dispatch.
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export const TZ_OFFSET = "-03:00"; // Brasília (no daylight saving since 2019)
const SETUP_SALT = "flux-setup-v1";
const SETUP_HASH = "86f93debd02375d1d4522ff468f756bdb5b061c60080d84b49a4ce45f0ad9fb9ac9252d9db3fea5df06af5700636b6b0886e9deb70dbeedc7caac0e86dff8dce";

export const store = () => getStore({ name: "flux", consistency: "strong" });

/* ---------- helpers ---------- */
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export const fail = (message, status = 400) => json({ error: message }, status);
export const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);
export const newId = (p) => `${p}-${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
export const safeId = (v) => /^[a-z0-9-]{1,60}$/.test(String(v || ""));
const pad = (n) => String(n).padStart(2, "0");

export async function listJSON(st, prefix) {
  const { blobs } = await st.list({ prefix });
  const items = await Promise.all(blobs.map((b) => st.get(b.key, { type: "json" })));
  return items.filter(Boolean);
}

/* ---------- passwords and sessions ---------- */
export const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString("hex");
export const newSalt = () => crypto.randomBytes(16).toString("hex");
export function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export const checkSetupCode = (code) => safeEq(hashPw(String(code || "").trim().toUpperCase(), SETUP_SALT), SETUP_HASH);

export async function secret(st) {
  let s = await st.get("config/secret");
  if (!s) {
    await st.set("config/secret", crypto.randomBytes(32).toString("hex"), { onlyIfNew: true });
    s = await st.get("config/secret");
  }
  return s;
}
const sign = (sec, p) => crypto.createHmac("sha256", sec).update(p).digest("base64url");
export function makeToken(sec, uid, ver) {
  const p = `${uid}.${Date.now() + 30 * 864e5}.${ver || 0}`;
  return `${Buffer.from(p).toString("base64url")}.${sign(sec, p)}`;
}
export function readToken(sec, tok) {
  if (!tok) return null;
  const [b, s] = String(tok).split(".");
  if (!b || !s) return null;
  const p = Buffer.from(b, "base64url").toString();
  if (!safeEq(sign(sec, p), s)) return null;
  const [uid, exp, ver] = p.split(".");
  if (!uid || +exp < Date.now()) return null;
  return { uid, ver: +ver || 0 };
}
export function accessCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => a[crypto.randomInt(a.length)];
  return `${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}

/* ---------- seed ---------- */
const SEED = [
  { id: "taynara", name: "Taynara", role: "Dona da agência e estrategista", isAdmin: true },
  { id: "thauana", name: "Thauana", role: "Social media", isAdmin: false },
  { id: "lucas", name: "Lucas", role: "Videomaker", isAdmin: false },
  { id: "vanessa", name: "Vanessa", role: "CRM", isAdmin: false },
];
export async function ensureSeed(st) {
  if (await st.get("config/seeded")) return;
  for (const m of SEED) {
    await st.setJSON(`users/${m.id}`, { ...m, login: m.id, whatsapp: "", createdAt: Date.now() }, { onlyIfNew: true });
  }
  await st.set("config/seeded", "1");
}
export const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role || "", whatsapp: u.whatsapp || "", login: u.login, isAdmin: !!u.isAdmin, hasPassword: !!u.passHash, codePending: !!(u.codeHash && u.codeExp > Date.now()) });

/* ---------- dates and messages ---------- */
export const evTime = (e) => new Date(`${e.date}T${e.start || "09:00"}:00${TZ_OFFSET}`).getTime();
export const evRev = (e) => `${e.date}${e.start}`.replace(/[^0-9]/g, "");
export const eventSentKey = (e, uid, win) => `sent/event/${e.id}/${uid}_${win}_${evRev(e)}`;
export const scriptSentKey = (s, uid) => `sent/script/${s.id}/${uid}_${s.releasedAt || 0}`;

const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const WD = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
function brDate(ymd) { const [y, m, d] = ymd.split("-").map(Number); return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }; }
function brToday(now) { const t = new Date(now - 3 * 36e5); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; }
function addDaysYmd(ymd, n) { const { y, m, d } = brDate(ymd); const t = new Date(Date.UTC(y, m - 1, d + n)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; }
const longDate = (ymd) => { const x = brDate(ymd); return `${WD[x.wd]}, ${x.d} de ${MONTHS[x.m - 1]}`; };
const range = (e) => (e.end ? `${e.start} às ${e.end}` : e.start);

export function eventMessage(e, member, now = Date.now()) {
  const first = String(member?.name || "").split(" ")[0];
  const today = brToday(now);
  const when = e.date === today ? "é hoje" : e.date === addDaysYmd(today, 1) ? "é amanhã" : `é ${WD[brDate(e.date).wd]}`;
  const what = e.type === "captacao" ? "A captação" : "A reunião de alinhamento";
  const lines = [
    `Olá${first ? ", " + first : ""}! Lembrete do FLUX APP.`,
    `${what} "${e.title}"${e.client ? ` com ${e.client}` : ""} ${when}.`,
    "",
    `Data: ${longDate(e.date)}`,
    `Horário: ${range(e)}`,
  ];
  if (e.location) lines.push(`Local: ${e.location}`);
  if (e.notes) lines.push("", e.notes);
  return lines.join("\n");
}
export function scriptMessage(s, member) {
  const first = String(member?.name || "").split(" ")[0];
  const lines = [`Olá${first ? ", " + first : ""}! Roteiro novo disponível no FLUX APP.`, "", `"${s.title}"${s.client ? ` para ${s.client}` : ""}`];
  if (s.recordDate) lines.push(`Gravação: ${longDate(s.recordDate)}`);
  lines.push("Abra a aba Roteiros para ver cenas, legenda e referências.");
  return lines.join("\n");
}

/* ---------- WhatsApp (Z-API) ---------- */
export const waNumber = (raw) => { let d = String(raw || "").replace(/\D/g, ""); if (!d) return ""; if (d.length <= 11) d = "55" + d; return d; };

export async function sendWhatsApp(cfg, phone, message) {
  const url = `https://api.z-api.io/instances/${encodeURIComponent(cfg.instance)}/token/${encodeURIComponent(cfg.token)}/send-text`;
  const headers = { "content-type": "application/json" };
  if (cfg.clientToken) headers["Client-Token"] = cfg.clientToken;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ phone, message }) });
  const body = await r.text();
  if (!r.ok) throw new Error(`Z-API respondeu ${r.status}: ${body.slice(0, 160)}`);
  return body;
}

async function status(st, patch) {
  const cur = (await st.get("config/wa-status", { type: "json" })) || {};
  await st.setJSON("config/wa-status", { ...cur, ...patch });
}

/* Send every reminder that is due and not sent yet. Safe to run often and concurrently. */
export async function runDue(st, now = Date.now()) {
  const cfg = await st.get("config/whatsapp", { type: "json" });
  if (!cfg || !cfg.enabled || !cfg.instance || !cfg.token) return { skipped: "whatsapp-off" };
  const [users, events, scripts] = await Promise.all([listJSON(st, "users/"), listJSON(st, "events/"), listJSON(st, "scripts/")]);
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const jobs = [];
  for (const e of events) {
    const h = (evTime(e) - now) / 36e5;
    if (!(h > 0 && h <= 48)) continue;
    const win = h <= 24 ? "24" : "48";
    for (const uid of e.participants || []) {
      const m = byId[uid];
      if (m && waNumber(m.whatsapp)) jobs.push({ key: eventSentKey(e, uid, win), phone: waNumber(m.whatsapp), text: eventMessage(e, m, now) });
    }
  }
  const week = now - 7 * 864e5;
  for (const s of scripts) {
    if (s.status !== "lancado" || !(s.releasedAt > week)) continue;
    let targets = (s.videomakers || []).filter((id) => byId[id]);
    if (!targets.length) targets = users.filter((u) => /videomaker/i.test(u.role || "")).map((u) => u.id);
    for (const uid of targets) {
      const m = byId[uid];
      if (m && waNumber(m.whatsapp)) jobs.push({ key: scriptSentKey(s, uid), phone: waNumber(m.whatsapp), text: scriptMessage(s, m) });
    }
  }
  let sent = 0, errors = 0;
  for (const j of jobs) {
    if (await st.get(j.key)) continue;
    const claim = await st.setJSON(j.key, { state: "sending", at: Date.now() }, { onlyIfNew: true });
    if (!claim.modified) continue;
    try {
      await sendWhatsApp(cfg, j.phone, j.text);
      await st.setJSON(j.key, { state: "ok", at: Date.now(), by: "auto" });
      sent++;
    } catch (err) {
      await st.delete(j.key);
      errors++;
      await status(st, { lastError: String(err.message || err).slice(0, 240), lastErrorAt: Date.now() });
    }
  }
  if (sent) await status(st, { lastOkAt: Date.now() });
  return { sent, errors, checked: jobs.length };
}
