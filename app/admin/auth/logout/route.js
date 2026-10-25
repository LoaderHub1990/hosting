import { json, handle, getSession, csrfFor, safeEq, clearSession } from '@/lib/security';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const s = getSession(req);
  const res = json({ ok: true });
  // ถ้ามี session ต้องมี CSRF ถูกต้องก่อนถึงจะล็อกเอาต์ (กันเว็บอื่นยิงให้ออกจากระบบ) — ไม่มี session ก็แค่ล้าง cookie
  if (s && !safeEq(req.headers.get('x-csrf-token') || '', csrfFor(s.sid))) return json({ error: 'csrf' }, 403);
  if (s) audit('admin.logout', { actor: s.name });
  clearSession(res);
  return res;
});
