import { json, handle, getIP, rateLimit, tooMany } from '@/lib/security';
import { getPublicStats } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const GET = handle(async (req) => {
  const r = await rateLimit('pubstats', getIP(req), 60, 60_000);
  if (!r.ok) return tooMany(r);
  return json(await getPublicStats());
});
