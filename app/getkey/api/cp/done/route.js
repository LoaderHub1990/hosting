import { json, handle, readJson, getIP, rateLimit, tooMany, safeEq } from '@/lib/security';
import { getSess, saveSess, TOTAL_CP, minStepMs, MAX_MS, lvVerify } from '@/lib/checkpoints';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const ip = getIP(req);
  const r = await rateLimit('cpdone', ip, 30, 60_000);
  if (!r.ok) return tooMany(r);
  const { sid, nonce, hash } = await readJson(req, 4096);
  const s = await getSess(sid), p = s && s.pending;
  if (!s || s.used || !p || typeof nonce !== 'string' || !safeEq(nonce, p.nonce)) return json({ error: 'invalid_checkpoint' }, 403);
  const age = Date.now() - p.at;
  if (age < minStepMs()) { audit('getkey.too_fast', { ip, step: p.step, ms: age }); return json({ error: 'too_fast' }, 403); }
  if (age > MAX_MS) { s.pending = null; await saveSess(s); return json({ error: 'expired' }, 403); }
  try {
    if (!(await lvVerify(hash))) { audit('getkey.bypass', { ip, step: p.step }); return json({ error: 'bypass_detected' }, 403); }
  } catch { return json({ error: 'verify_failed' }, 502); }
  s.pending = null; s.progress = p.step;
  await saveSess(s);
  return json({ progress: s.progress, total: TOTAL_CP });
});
