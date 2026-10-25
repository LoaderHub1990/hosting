import { NextResponse } from 'next/server';
import { verify, setSession, getIP, rateLimit, safeEq } from '@/lib/security';
import { baseUrl } from '@/lib/env';
import { audit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export async function GET(req) {
  const ip = getIP(req);
  const back = (e) => { const r = NextResponse.redirect(`${baseUrl()}/admin${e ? '?error=' + e : ''}`); r.cookies.set('hub_oauth', '', { path: '/admin/auth', maxAge: 0 }); return r; };
  if (!(await rateLimit('oauth', ip, 20, 60_000)).ok) return back('oauth');

  const q = new URL(req.url).searchParams;
  const code = q.get('code') || '', state = q.get('state') || '';
  const saved = verify(req.cookies.get('hub_oauth')?.value);
  if (!code || !saved || !safeEq(state, saved.state)) return back('state');

  try {
    const tok = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(8000),
      body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: `${baseUrl()}/admin/auth/callback` }),
    }).then((r) => r.json());
    if (!tok.access_token) return back('oauth');
    const u = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${tok.access_token}` }, signal: AbortSignal.timeout(8000) }).then((r) => r.json());
    const allowed = String(process.env.ADMIN_DISCORD_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!u.id || !allowed.includes(String(u.id))) { audit('admin.discord_denied', { ip, id: u.id }); return back('forbidden'); }

    const res = back('');
    setSession(res, req, { sub: String(u.id), name: u.global_name || u.username || 'Admin', avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : '', via: 'discord' });
    audit('admin.login', { ip, via: 'discord', id: u.id });
    return res;
  } catch { return back('oauth'); }
}
