import { json, handle, getIP, rateLimit, tooMany } from '@/lib/security';
import { validateKey } from '@/lib/keys';

export const dynamic = 'force-dynamic';
export const GET = handle(async (req) => {
  const r = await rateLimit('validate', getIP(req), 60, 60_000);
  if (!r.ok) return tooMany(r);
  const q = new URL(req.url).searchParams;
  return json(await validateKey(String(q.get('key') || '').trim(), q.get('hwid')));
});
