import { json, handle, adminAuth } from '@/lib/security';
import { keysDb, validKey, maskKey } from '@/lib/keys';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const DELETE = handle(async (req, { params }) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  const { key } = await params;
  if (!validKey(key)) return json({ error: 'not found' }, 404);
  const ok = await keysDb().update((db, dirty) => {
    if (!Object.prototype.hasOwnProperty.call(db.keys, key)) return false;
    delete db.keys[key]; dirty(); return true;
  });
  if (!ok) return json({ error: 'not found' }, 404);
  audit('admin.key_revoke', { actor: a.actor, ip: a.ip, key: maskKey(key) });
  return json({ ok: true, revoked: key });
});
