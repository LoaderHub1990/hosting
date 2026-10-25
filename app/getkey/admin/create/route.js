import { json, handle, readJson, adminAuth } from '@/lib/security';
import { keysDb, genKey, TEMP_TTL_MS } from '@/lib/keys';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const POST = handle(async (req) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  const { type = 'perm', note = '' } = await readJson(req, 4096);
  if (type !== 'perm' && type !== 'temp') return json({ error: 'invalid_type' }, 400);
  const key = genKey(type);
  const entry = { type, note: String(note).slice(0, 120), createdAt: new Date().toISOString(), ...(type === 'temp' ? { expires: new Date(Date.now() + TEMP_TTL_MS).toISOString() } : {}) };
  await keysDb().update((db, dirty) => { db.keys[key] = entry; dirty(); });
  audit('admin.key_create', { actor: a.actor, ip: a.ip, type });
  return json({ key, ...entry });
});
