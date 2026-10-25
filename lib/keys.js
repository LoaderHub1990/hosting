import crypto from 'node:crypto';
import { store } from './db.js';
import { safeEq } from './security.js';

export const TEMP_TTL_MS = 24 * 3600_000;
export const keysDb = () => store('keys.db.json', () => ({ keys: {} }));

const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
export function genKey(type = 'temp') {
  const body = `${seg()}${seg()}-${seg()}${seg()}-${seg()}${seg()}-${seg()}${seg()}`;
  return type === 'perm' ? `128BIT-HUB-X-PERM-${body}` : `128BIT-HUB-X-${body}`;
}

// กันค่าแปลก ๆ (เช่น __proto__) ก่อนเอาไปค้นใน object
export const validKey = (k) => typeof k === 'string' && /^[A-Za-z0-9._-]{8,128}$/.test(k) && !k.startsWith('__');
const has = (db, k) => Object.prototype.hasOwnProperty.call(db.keys, k);

export function cleanExpired(db, dirty) {
  const now = Date.now();
  for (const [k, v] of Object.entries(db.keys)) {
    if (v.type === 'temp' && new Date(v.expires).getTime() < now) { delete db.keys[k]; dirty?.(); }
  }
}

/** ตรวจ premium + ผูก HWID (เรียกภายใน update เพื่อกัน race) */
export function checkPremiumIn(db, key, hwidRaw, dirty) {
  if (!validKey(key) || !has(db, key)) return { ok: false, reason: 'invalid' };
  const e = db.keys[key];
  if (e.type !== 'perm') return { ok: false, reason: 'invalid' };
  const raw = String(hwidRaw || '').trim();
  if (!raw || raw.length > 256) return { ok: false, reason: 'hwid_required' };
  const h = crypto.createHash('sha256').update(raw).digest('hex');
  if (!e.hwid) {
    if (Object.entries(db.keys).some(([k, v]) => k !== key && v.hwid === h)) return { ok: false, reason: 'hwid_in_use' };
    e.hwid = h; e.hwidBoundAt = new Date().toISOString(); dirty();
    return { ok: true };
  }
  return safeEq(e.hwid, h) ? { ok: true } : { ok: false, reason: 'hwid_mismatch' };
}
export const checkPremium = (key, hwid) => keysDb().update((db, dirty) => checkPremiumIn(db, key, hwid, dirty));

export async function validateKey(key, hwid) {
  if (!validKey(key)) return { valid: false };
  return keysDb().update((db, dirty) => {
    if (!has(db, key)) return { valid: false };
    const e = db.keys[key];
    if (e.type === 'perm') {
      const r = checkPremiumIn(db, key, hwid, dirty);
      return r.ok ? { valid: true, type: 'perm' } : { valid: false, reason: r.reason };
    }
    if (new Date(e.expires).getTime() < Date.now()) { delete db.keys[key]; dirty(); return { valid: false, reason: 'expired' }; }
    return { valid: true, type: 'temp', expires: e.expires };
  });
}

export const maskKey = (k) => (k.length > 14 ? `${k.slice(0, 10)}…${k.slice(-4)}` : '***');
