import { json, handle, readJson, getIP, rateLimit, tooMany, safeEq, lockedFor, recordFail, clearFails, setSession } from '@/lib/security';
import { adminSecret } from '@/lib/env';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const POST = handle(async (req) => {
  const ip = getIP(req);
  const wait = await lockedFor(ip);
  if (wait) return json({ error: 'locked', retryAfter: wait }, 429, { 'Retry-After': String(wait) });
  const rl = await rateLimit('login', ip, 10, 60_000);
  if (!rl.ok) return tooMany(rl);

  const { password } = await readJson(req, 1024);
  if (typeof password !== 'string' || !password || password.length > 256) { await sleep(300); return json({ error: 'invalid' }, 400); }

  if (!safeEq(password, adminSecret())) {
    await recordFail(ip); audit('admin.login_fail', { ip, ua: req.headers.get('user-agent') || '' });
    await sleep(600 + Math.random() * 400); // หน่วงให้เดารหัสช้าลง
    return json({ error: 'wrong_password' }, 401);
  }
  await clearFails(ip);
  const res = json({ ok: true });
  const { csrf } = setSession(res, req, { sub: 'secret', name: 'Admin', via: 'secret' });
  audit('admin.login', { ip, via: 'secret' });
  res.headers.set('X-CSRF-Token', csrf);
  return res;
});
