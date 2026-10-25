import crypto from 'node:crypto';
import { json, handle, readJson, getIP, rateLimit, tooMany } from '@/lib/security';
import { getSess, saveSess, TOTAL_CP, lvLink, lvUrl } from '@/lib/checkpoints';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const r = await rateLimit('cpgo', getIP(req), 20, 60_000);
  if (!r.ok) return tooMany(r);
  const s = await getSess((await readJson(req, 2048)).sid);
  if (!s || s.used) return json({ error: 'invalid_session' }, 403);
  if (s.progress >= TOTAL_CP) return json({ error: 'all_done' }, 400);
  const step = s.progress + 1;
  if (!lvLink(step)) return json({ error: 'link_not_set' }, 500);
  const nonce = crypto.randomBytes(12).toString('hex');
  s.pending = { step, nonce, at: Date.now() };
  await saveSess(s);
  return json({ url: lvUrl(step, nonce), step });
});
