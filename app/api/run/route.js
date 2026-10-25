import { getIP, rateLimit, handle } from '@/lib/security';
import { recordRun } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
// สคริปต์ Lua เรียกทุกครั้งที่รัน: /api/run?placeId=123&tier=free
export const GET = handle(async (req) => {
  const ip = getIP(req);
  const r = await rateLimit('run', ip, 30, 60_000);
  const end = (status, body = '') => new Response(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!r.ok) return end(429);
  const q = new URL(req.url).searchParams;
  const placeId = String(q.get('placeId') || '').trim();
  if (!/^\d{1,20}$/.test(placeId)) return end(400);
  await recordRun(placeId, String(q.get('tier') || 'free') === 'premium' ? 'premium' : 'free');
  return end(200, 'ok');
});
