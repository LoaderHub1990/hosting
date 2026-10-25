import crypto from 'node:crypto';
import { baseUrl, num } from './env.js';
import { kv, kvOn } from './kv.js';

export const TOTAL_CP = 5;
export const minStepMs = () => num('MIN_STEP_MS', 8000);
export const MAX_MS = 30 * 60_000;     // กดแล้วต้องกลับมาภายใน 30 นาที
const SESS_TTL_MS = 2 * 3600_000;

const sessions = (globalThis.__hubSess ||= new Map()); // sid -> { progress, pending, used, createdAt }
if (!globalThis.__hubSessTimer) {
  globalThis.__hubSessTimer = setInterval(() => {
    const n = Date.now();
    for (const [k, v] of sessions) if (n - v.createdAt > SESS_TTL_MS) sessions.delete(k);
    if (sessions.size > 50_000) sessions.clear();
  }, 10 * 60_000);
  globalThis.__hubSessTimer.unref?.();
}

const okSid = (sid) => typeof sid === 'string' && /^[a-f0-9]{32}$/.test(sid);
const TTL_S = SESS_TTL_MS / 1000;
/** คืน object เซสชัน (แก้แล้วต้อง saveSess) หรือ undefined */
export async function getSess(sid) {
  if (!okSid(sid)) return undefined;
  if (kvOn()) {
    const raw = await kv('GET', 'hub:cp:' + sid);
    if (!raw) return undefined;
    const s = JSON.parse(raw); s._sid = sid; return s;
  }
  const s = sessions.get(sid); if (s) s._sid = sid; return s;
}
export async function saveSess(s) {
  if (kvOn()) { const { _sid, ...rest } = s; await kv('SET', 'hub:cp:' + _sid, JSON.stringify(rest), 'EX', TTL_S); }
}
export async function newSess() {
  const sid = crypto.randomBytes(16).toString('hex');
  const s = { progress: 0, pending: null, used: false, createdAt: Date.now() };
  if (kvOn()) await kv('SET', 'hub:cp:' + sid, JSON.stringify(s), 'EX', TTL_S); else sessions.set(sid, s);
  return sid;
}
/** ตั้งสถานะ "ใช้แล้ว" แบบ atomic — คืน true เฉพาะครั้งแรก (กันรับคีย์ซ้ำจากการยิงพร้อมกัน) */
export async function claimOnce(sid) {
  if (kvOn()) return (await kv('SET', 'hub:cpused:' + sid, '1', 'NX', 'EX', TTL_S)) === 'OK';
  const s = sessions.get(sid); if (!s || s.used) return false; s.used = true; return true;
}
export const lvLink = (step) => process.env['LV_LINK_' + step] || '';
export function lvUrl(step, nonce) {
  const base = lvLink(step);
  const back = `${baseUrl()}/getkey?cp=${nonce}`;
  return base + (base.includes('?') ? '&' : '?') + 'r=' + Buffer.from(back).toString('base64');
}
export async function lvVerify(hash) {
  const token = process.env.LV_ANTIBYPASS_TOKEN || '';
  if (!token) return true;
  const r = await fetch('https://publisher.linkvertise.com/api/v1/anti_bypassing?token=' + encodeURIComponent(token) + '&hash=' + encodeURIComponent(String(hash || '').slice(0, 200)), { signal: AbortSignal.timeout(8000) });
  return (await r.text()).trim().toUpperCase().replace(/"/g, '') === 'TRUE';
}
