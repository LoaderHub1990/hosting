import { json, handle, getSession, csrfFor } from '@/lib/security';

export const dynamic = 'force-dynamic';
const discordOn = () => !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.ADMIN_DISCORD_IDS);

export const GET = handle(async (req) => {
  const s = getSession(req);
  if (!s) return json({ error: 'unauthorized', discord: discordOn() }, 401);
  return json({ name: s.name, avatar: s.avatar || '', via: s.via, csrf: csrfFor(s.sid), discord: discordOn() });
});
