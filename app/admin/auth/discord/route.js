import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sign, getIP, rateLimit } from '@/lib/security';
import { baseUrl, secureCookies } from '@/lib/env';

export const dynamic = 'force-dynamic';
// เริ่มล็อกอินด้วย Discord — Redirect URI ที่ต้องตั้งใน Discord Developer Portal:  {BASE_URL}/admin/auth/callback
export async function GET(req) {
  const back = (e) => NextResponse.redirect(`${baseUrl()}/admin?error=${e}`);
  const id = process.env.DISCORD_CLIENT_ID;
  if (!id || !process.env.DISCORD_CLIENT_SECRET || !process.env.ADMIN_DISCORD_IDS) return back('oauth');
  if (!(await rateLimit('oauth', getIP(req), 20, 60_000)).ok) return back('oauth');
  const state = crypto.randomBytes(16).toString('base64url');
  const url = new URL('https://discord.com/oauth2/authorize');
  url.search = new URLSearchParams({ client_id: id, response_type: 'code', scope: 'identify', redirect_uri: `${baseUrl()}/admin/auth/callback`, state, prompt: 'none' }).toString();
  const res = NextResponse.redirect(url.toString());
  // state เก็บใน cookie ที่เซ็นลายเซ็น (Lax เพราะ Discord พากลับมาจากเว็บอื่น)
  res.cookies.set('hub_oauth', sign({ state }, 10 * 60_000), { httpOnly: true, secure: secureCookies(), sameSite: 'lax', path: '/admin/auth', maxAge: 600 });
  return res;
}
