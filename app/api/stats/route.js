import { json, handle, adminAuth } from '@/lib/security';
import { getStats } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export const GET = handle(async (req) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  return json(await getStats());
});
