import { serveLua } from '@/lib/luafiles';
import { handle, getIP, rateLimit } from '@/lib/security';
import { textRes } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const GET = handle(async (req, { params }) => {
  if (!(await rateLimit('lua', getIP(req), 120, 60_000)).ok) return textRes('-- rate limited', 429);
  return serveLua(req, './private/hub', (await params).path || []);
});
