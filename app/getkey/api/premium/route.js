import fs from 'node:fs';
import path from 'node:path';
import { handle, getIP, rateLimit, isBrowser, fakeLua, textRes } from '@/lib/security';
import { checkPremium } from '@/lib/keys';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// สคริปต์ premium: เบราว์เซอร์เปิดดูไม่ได้ (ได้ 404 ปลอม) / ต้องมีคีย์ perm + HWID ตรง
export const GET = handle(async (req) => {
  if (isBrowser(req)) return fakeLua();
  const ip = getIP(req);
  const deny = (reason) => textRes(JSON.stringify({ ok: false, reason }));
  if (!(await rateLimit('premium', ip, 20, 60_000)).ok) return deny('rate_limited');
  const q = new URL(req.url).searchParams;
  const key = String(q.get('key') || '').trim();
  const r = await checkPremium(key, q.get('hwid'));
  if (!r.ok) {
    if (r.reason === 'hwid_mismatch' || r.reason === 'hwid_in_use') audit('premium.denied', { ip, reason: r.reason });
    return deny(r.reason);
  }
  const file = path.resolve(process.env.PREMIUM_FILE || './private/premium/main.lua');
  try { return textRes(fs.readFileSync(file)); } catch { return deny('server_error'); }
});
