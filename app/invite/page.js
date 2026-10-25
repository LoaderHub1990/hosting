import Page from '@/components/Page';
import { Icon } from '@/components/Fx';
import { DiscordIcon } from '@/components/Logo';
import { DISCORD_CODE, DISCORD_INVITE } from '@/lib/places';

export const metadata = { title: 'เข้าร่วม Discord' };
export const revalidate = 60;

async function getInvite() {
  try {
    const r = await fetch(`https://discord.com/api/v10/invites/${DISCORD_CODE}?with_counts=true`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const d = await r.json();
    return { online: d.approximate_presence_count, members: d.approximate_member_count, name: d.guild?.name };
  } catch { return null; }
}

export default async function InvitePage() {
  const inv = await getInvite();
  const n = (v) => (typeof v === 'number' ? v.toLocaleString('th-TH') : '—');
  return (
    <Page>
      <section className="pn inv rim">
        <span className="big-ic" style={{ background: 'rgba(88,101,242,.18)', color: '#aab3ff' }}><DiscordIcon s={34} /></span>
        <div><h1 style={{ fontSize: 24, fontWeight: 800 }}>{inv?.name || '128B!t'}</h1><p className="h-sub">เข้าร่วมเซิร์ฟเวอร์เพื่อรับข่าวสารและอัปเดตสคริปต์</p></div>
        <div className="nums">
          <div className="h-stat rim"><span className="si"><Icon n="activity" s={17} /></span><b>{n(inv?.online)}</b><em>ออนไลน์</em></div>
          <div className="h-stat rim"><span className="si"><Icon n="users" s={17} /></span><b>{n(inv?.members)}</b><em>สมาชิก</em></div>
        </div>
        {!inv && <div className="alert">โหลดสถิติไม่ได้ในตอนนี้ — ยังกดเข้าร่วมได้ตามปกติ</div>}
        <span className="code">discord.gg/{DISCORD_CODE}</span>
        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="h-btn discord wide rp"><DiscordIcon s={16} />เข้าร่วมเซิร์ฟเวอร์</a>
      </section>
    </Page>
  );
}
