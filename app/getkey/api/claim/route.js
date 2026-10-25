import { json, handle, readJson, getIP, rateLimit, tooMany } from '@/lib/security';
import { getSess, claimOnce, TOTAL_CP } from '@/lib/checkpoints';
import { keysDb, genKey, TEMP_TTL_MS } from '@/lib/keys';
import { num } from '@/lib/env';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const ip = getIP(req);
  const sid = (await readJson(req, 2048)).sid;
  const s = await getSess(sid);
  if (!s || s.used) return json({ error: 'invalid_session' }, 403);
  if (s.progress < TOTAL_CP) return json({ error: 'not_finished' }, 403);
  // กันคนปั่นคีย์: จำกัดต่อ IP ต่อวัน
  const r = await rateLimit('claim', ip, num('MAX_KEYS_PER_IP_PER_DAY', 3), 24 * 3600_000);
  if (!r.ok) { audit('getkey.claim_limit', { ip }); return json({ error: 'daily_limit' }, 429, { 'Retry-After': String(r.retryAfter) }); }
  if (!(await claimOnce(sid))) return json({ error: 'invalid_session' }, 403); // 1 เซสชัน = 1 คีย์ (atomic)
  const key = genKey('temp');
  const expires = new Date(Date.now() + TEMP_TTL_MS).toISOString();
  await keysDb().update((db, dirty) => { db.keys[key] = { type: 'temp', expires, createdAt: new Date().toISOString(), ip }; dirty(); });
  return json({ key, expires, type: 'temp' });
});
