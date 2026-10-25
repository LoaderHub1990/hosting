import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { secret, adminSecret, secureCookies } from './env.js';
import { audit } from './audit.js';
import { kv, kvPipe, kvOn } from './kv.js';

const G = globalThis;

/* ────────────────────────── IP + rate limit ────────────────────────── */
export function getIP(req) {
  if (process.env.TRUST_PROXY === '0') return 'direct';
  const h = req.headers;
  const ip = process.env.VERCEL
    ? (h.get('x-vercel-forwarded-for') || h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim())
    : h.get('cf-connecting-ip') || h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim();
  return /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : 'unknown';
}

const RL = (G.__hubRL ||= new Map());
if (!G.__hubRLTimer) {
  G.__hubRLTimer = setInterval(() => {
    const n = Date.now();
    for (const [k, v] of RL) { v.a = v.a.filter((t) => n - t < v.w); if (!v.a.length) RL.delete(k); }
    if (RL.size > 100_000) RL.clear(); // กัน memory บวมถ้าโดนยิงด้วย IP ปลอมจำนวนมาก
  }, 5 * 60_000);
  G.__hubRLTimer.unref?.();
}
/** จำกัด `limit` ครั้งต่อ `windowMs` ต่อ (name, ip) — Redis: fixed window / ไม่มี Redis: sliding window ในหน่วยความจำ */
export async function rateLimit(name, ip, limit, windowMs) {
  if (kvOn()) {
    try {
      const k = `hub:rl:${name}:${ip}`;
      const [n, ttl] = await kvPipe([['INCR', k], ['PTTL', k]]);
      if (n === 1 || ttl < 0) await kv('PEXPIRE', k, windowMs);
      if (n > limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((ttl > 0 ? ttl : windowMs) / 1000)) };
      return { ok: true };
    } catch (e) { console.error('[rl] redis', e.message); return { ok: true }; } // Redis ล่ม → ไม่ปิดเว็บ
  }
  const k = `${name}|${ip}`, now = Date.now();
  const e = RL.get(k) || { a: [], w: windowMs };
  e.a = e.a.filter((t) => now - t < windowMs); e.w = windowMs;
  if (e.a.length >= limit) { RL.set(k, e); return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - e.a[0])) / 1000)) }; }
  e.a.push(now); RL.set(k, e);
  return { ok: true };
}

/* ล็อกเอาต์ IP ที่เดารหัสผิดซ้ำ ๆ */
const LOCK = (G.__hubLock ||= new Map());
export async function lockedFor(ip) {
  if (kvOn()) { try { const t = await kv('PTTL', `hub:locked:${ip}`); return t > 0 ? Math.ceil(t / 1000) : 0; } catch { return 0; } }
  const s = LOCK.get(ip);
  return s && s.until > Date.now() ? Math.ceil((s.until - Date.now()) / 1000) : 0;
}
export async function recordFail(ip, max = 5, windowMs = 15 * 60_000, lockMs = 15 * 60_000) {
  if (kvOn()) {
    try {
      const k = `hub:fail:${ip}`;
      const n = await kv('INCR', k);
      if (n === 1) await kv('PEXPIRE', k, windowMs);
      if (n >= max) { await kvPipe([['SET', `hub:locked:${ip}`, '1', 'PX', lockMs], ['DEL', k]]); audit('security.lockout', { ip }); }
    } catch {}
    return;
  }
  const n = Date.now(); let s = LOCK.get(ip);
  if (!s || n - s.first > windowMs) s = { n: 0, first: n, until: 0 };
  s.n++; if (s.n >= max) { s.until = n + lockMs; s.n = 0; s.first = n; audit('security.lockout', { ip }); }
  LOCK.set(ip, s);
}
export async function clearFails(ip) {
  if (kvOn()) { try { await kv('DEL', `hub:fail:${ip}`); } catch {} return; }
  LOCK.delete(ip);
}

/* ────────────────────────── response helpers ────────────────────────── */
export function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
export const tooMany = (r) => json({ error: 'rate_limited' }, 429, { 'Retry-After': String(r.retryAfter) });
export const fail = (status, code) => Object.assign(new Error(code), { status, code });

export function handle(fn) {
  return async (req, ctx) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e && e.status) return json({ error: e.code || 'error' }, e.status);
      console.error('[api]', req.method, new URL(req.url).pathname, e && e.message);
      return json({ error: 'server_error' }, 500); // ไม่เปิดเผยรายละเอียดภายใน
    }
  };
}

/** อ่าน JSON body พร้อมจำกัดขนาด (ผ่านทั้ง content-length และขนาดจริง) */
export async function readJson(req, max = 16 * 1024) {
  if (Number(req.headers.get('content-length') || 0) > max) throw fail(413, 'too_large');
  const text = await req.text();
  if (text.length > max) throw fail(413, 'too_large');
  if (!text) return {};
  try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  catch { throw fail(400, 'bad_json'); }
}

/* ────────────────────────── crypto ────────────────────────── */
export function safeEq(a, b) { // เทียบแบบ constant-time และไม่รั่วความยาว
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
const mac = (s) => crypto.createHmac('sha256', secret()).update(s).digest('base64url');
export function sign(payload, ttlMs) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString('base64url');
  return `${body}.${mac(body)}`;
}
export function verify(tok) {
  if (typeof tok !== 'string' || tok.length > 2048) return null;
  const [body, sig] = tok.split('.');
  if (!body || !sig || !safeEq(sig, mac(body))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
export const uaHash = (req) => crypto.createHash('sha256').update(req.headers.get('user-agent') || '').digest('base64url').slice(0, 16);

/* ────────────────────────── admin session + CSRF ────────────────────────── */
const SESSION_TTL = 8 * 3600_000;
export const cookieName = () => (secureCookies() ? '__Host-hub_admin' : 'hub_admin');
export const csrfFor = (sid) => mac('csrf|' + sid);

export function setSession(res, req, user) {
  const sid = crypto.randomBytes(18).toString('base64url');
  const token = sign({ sid, sub: user.sub, name: user.name, avatar: user.avatar || '', via: user.via, ua: uaHash(req) }, SESSION_TTL);
  res.cookies.set(cookieName(), token, { httpOnly: true, secure: secureCookies(), sameSite: 'strict', path: '/', maxAge: SESSION_TTL / 1000 });
  return { sid, csrf: csrfFor(sid) };
}
export function clearSession(res) {
  res.cookies.set(cookieName(), '', { httpOnly: true, secure: secureCookies(), sameSite: 'strict', path: '/', maxAge: 0 });
}
export function getSession(req) {
  const p = verify(req.cookies.get(cookieName())?.value);
  if (!p || p.ua !== uaHash(req)) return null; // ขโมย cookie ไปใช้คนละเบราว์เซอร์ → ใช้ไม่ได้
  return p;
}

/**
 * ตรวจสิทธิ์แอดมิน — รับ 2 แบบ:
 *  1) cookie session (เว็บแอดมิน) + CSRF token สำหรับคำสั่งที่เปลี่ยนข้อมูล
 *  2) header x-admin-token (บอท/สคริปต์) — ล็อกเอาต์ IP ที่เดาผิดซ้ำ
 * คืน { ok:true, actor } หรือ { ok:false, res }
 */
export async function adminAuth(req) {
  const ip = getIP(req);
  const wait = await lockedFor(ip);
  if (wait) return { ok: false, res: json({ error: 'locked' }, 429, { 'Retry-After': String(wait) }) };

  const hdr = req.headers.get('x-admin-token');
  if (hdr) {
    const r = await rateLimit('adm-token', ip, 60, 60_000);
    if (!r.ok) return { ok: false, res: tooMany(r) };
    if (safeEq(hdr, adminSecret())) return { ok: true, actor: 'token', ip };
    await recordFail(ip); audit('admin.token_fail', { ip, path: new URL(req.url).pathname });
    return { ok: false, res: json({ error: 'unauthorized' }, 401) };
  }
  const s = getSession(req);
  if (!s) return { ok: false, res: json({ error: 'unauthorized' }, 401) };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (!safeEq(req.headers.get('x-csrf-token') || '', csrfFor(s.sid))) {
      audit('admin.csrf_fail', { ip, actor: s.name });
      return { ok: false, res: json({ error: 'csrf' }, 403) };
    }
  }
  return { ok: true, actor: s.name || s.sub, ip, session: s };
}

/* ────────────────────────── ตรวจว่าเป็นเบราว์เซอร์ (ไฟล์ Lua ไม่ให้เปิดดูผ่านเว็บ) ────────────────────────── */
export function isBrowser(req) {
  const h = req.headers;
  if (h.get('sec-fetch-mode') || h.get('sec-fetch-dest') || h.get('sec-fetch-site') || h.get('upgrade-insecure-requests')) return true;
  return String(h.get('accept') || '').includes('text/html');
}
export const fakeLua = () => new Response('404: Not Found', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
export const textRes = (body, status = 200) => new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' } });
