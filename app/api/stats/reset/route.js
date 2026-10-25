import { json, handle, adminAuth } from '@/lib/security';
import { resetStats } from '@/lib/analytics';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  await resetStats();
  audit('admin.stats_reset', { actor: a.actor, ip: a.ip });
  return json({ ok: true });
});
