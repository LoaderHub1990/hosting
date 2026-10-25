import { json, handle, readJson, getIP, rateLimit, tooMany, adminAuth } from '@/lib/security';
import { obfuscate, VALID_PRESETS, findPrometheus, diagnose } from '@/lib/obf';
import { num } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = handle(async (req) => {
  const ip = getIP(req);
  const r = await rateLimit('obf', ip, 10, 60_000);
  if (!r.ok) return tooMany(r);

  const max = num('OBF_MAX_BYTES', 512_000);
  const body = await readJson(req, max + 2048).catch((e) => { if (e.status === 413) return null; throw e; });
  if (!body) return json({ ok: false, error: 'too_large' }, 413);

  const { source, preset = 'Medium', luaTarget } = body;
  if (!source || typeof source !== 'string') return json({ ok: false, error: 'missing source' }, 400);
  if (Buffer.byteLength(source) > max) return json({ ok: false, error: 'too_large' }, 413);
  if (!VALID_PRESETS.includes(preset)) return json({ ok: false, error: 'invalid_preset', valid: VALID_PRESETS }, 400);

  try {
    const result = await obfuscate(source, preset, luaTarget);
    return json({ ok: true, preset, result, size: result.length });
  } catch (e) {
    if (e.message === 'obfuscator_not_available') return json({ ok: false, error: 'obfuscator_not_available' }, 503);
    if (e.message === 'busy') return json({ ok: false, error: 'busy' }, 429, { 'Retry-After': '5' });
    // ข้อความ error ภายใน (path/สแตก) ไม่ส่งให้ผู้ใช้ทั่วไป
    return json({ ok: false, error: 'obfuscate_failed' }, e.status === 400 ? 400 : 500);
  }
});

// แอดมินเท่านั้น: เช็กว่าเครื่องมือพร้อมไหม (ไม่เปิดเผย path ให้สาธารณะ)
export const GET = handle(async (req) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  return json({ ready: !!findPrometheus(), diag: diagnose(), presets: VALID_PRESETS });
});
