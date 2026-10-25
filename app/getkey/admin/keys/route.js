import { json, handle, adminAuth } from '@/lib/security';
import { keysDb, cleanExpired } from '@/lib/keys';

export const dynamic = 'force-dynamic';
export const GET = handle(async (req) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  const list = await keysDb().update((db, dirty) => {
    cleanExpired(db, dirty);
    const now = Date.now();
    return Object.entries(db.keys).map(([k, v]) => ({
      key: k, type: v.type, note: v.note || '', createdAt: v.createdAt, expires: v.expires, ip: v.ip, hwidBound: !!v.hwid,
      active: v.type === 'perm' || new Date(v.expires).getTime() > now,
    }));
  });
  return json(list);
});
