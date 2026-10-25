import { json, handle, readJson, getIP, rateLimit, tooMany } from '@/lib/security';
import { getSess, newSess, TOTAL_CP } from '@/lib/checkpoints';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const body = await readJson(req, 2048);
  const old = await getSess(body.sid);
  if (old && !old.used) return json({ sid: body.sid, progress: old.progress, total: TOTAL_CP });
  const r = await rateLimit('sess', getIP(req), 20, 60_000);
  if (!r.ok) return tooMany(r);
  return json({ sid: await newSess(), progress: 0, total: TOTAL_CP });
});
