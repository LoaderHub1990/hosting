import { json, handle, adminAuth } from '@/lib/security';
import { readAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const GET = handle(async (req) => {
  const a = await adminAuth(req); if (!a.ok) return a.res;
  const secretOk = (process.env.TOKEN_SECRET || '').length >= 32;
  const adminSet = !!process.env.ADMIN_SECRET;
  return json({
    events: await readAudit(150),
    checks: {
      tokenSecret: secretOk,
      adminSecretSeparate: adminSet,
      adminSecretStrong: (process.env.ADMIN_SECRET || '').length >= 16,
      https: (process.env.BASE_URL || '').startsWith('https://'),
      secureCookies: process.env.COOKIE_SECURE != null ? process.env.COOKIE_SECURE === '1' : process.env.NODE_ENV === 'production',
      trustProxy: process.env.TRUST_PROXY !== '0',
      antibypass: !!process.env.LV_ANTIBYPASS_TOKEN,
      discordLogin: !!(process.env.DISCORD_CLIENT_ID && process.env.ADMIN_DISCORD_IDS),
    },
  });
});
