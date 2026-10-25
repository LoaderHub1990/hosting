import { serveLua } from '@/lib/luafiles';
import { handle, getIP, rateLimit, textRes } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const GET = handle(async (req, { params }) => {
  if (!(await rateLimit('lua', getIP(req), 120, 60_000)).ok) return textRes('-- rate limited', 429);
  const { name, file } = await params;
  return serveLua(req, './private/scripts', [name, file]);
});
