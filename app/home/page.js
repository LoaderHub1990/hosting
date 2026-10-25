import Link from 'next/link';
import Page from '@/components/Page';
import CountUp from '@/components/CountUp';
import LuaCode from '@/components/LuaCode';
import { Icon, CopyBtn } from '@/components/Fx';
import { DiscordIcon } from '@/components/Logo';
import { getPublicStats } from '@/lib/analytics';
import { PLACE_SCRIPTS, PLACE_IDS, LOADER, DISCORD_INVITE } from '@/lib/places';

export const metadata = { title: { absolute: '128B!t Hub X — สคริปต์ Roblox เมนูภาษาไทย' }, alternates: { canonical: '/home' } };

const STEPS = [
  ['รับ Key', 'ทำ Checkpoint ให้ครบ ใช้ได้ 24 ชั่วโมง'],
  ['คัดลอกสคริปต์', 'กดปุ่ม Copy ที่กล่องโค้ด'],
  ['วางแล้วกด Execute', 'ใส่คีย์ในหน้าต่างที่ขึ้นมา แล้วเล่นได้เลย'],
];

export default async function Home() {
  const { total, days, today } = await getPublicStats();
  return (
    <Page>
      <section className="v2-hero">
        <span className="eyebrow"><i />ออนไลน์ · อัปเดตสม่ำเสมอ</span>
        <h1>128B!t<em>Hub X</em></h1>
        <p className="lead">สคริปต์ Roblox เมนูภาษาไทย 100% ฟังก์ชันครบ รองรับหลายแมพ</p>
        <div className="cta">
          <a href="#start" className="h-btn primary rp"><Icon n="play" s={16} />เริ่มต้นใช้งาน</a>
          <Link href="/getkey" className="h-btn ghost rp"><Icon n="key" s={16} />รับคีย์</Link>
        </div>
        <div className="v2-meta">
          <span><b><CountUp to={total} /></b> รันทั้งหมด</span>
          <span><b><CountUp to={days?.[today] || 0} /></b> รันวันนี้</span>
          <span><b>{PLACE_IDS.length}</b> แมพ</span>
        </div>
      </section>

      <section className="v2-start" id="start">
        <div className="v2-win rim">
          <div className="v2-win-h">
            <span className="dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="fn">main.lua</span>
            <CopyBtn text={LOADER} label="Copy" />
          </div>
          <LuaCode code={LOADER} />
        </div>
        <ol className="v2-steps">
          {STEPS.map(([t, d], i) => (
            <li key={t}><span className="n">{i + 1}</span><span className="tx"><b>{t}</b><em>{d}</em></span></li>
          ))}
        </ol>
      </section>

      <section className="v2-maps">
        <h2>แมพที่รองรับ</h2>
        <div className="v2-pills">
          {PLACE_IDS.map((id) => <span key={id}>{PLACE_SCRIPTS[id].name}</span>)}
        </div>
      </section>

      <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="v2-discord rim rp">
        <DiscordIcon s={22} /><span><b>128B!t Hub X | Official</b><em>เข้า Discord รับข่าวสารและอัปเดต</em></span><Icon n="arrow" s={18} />
      </a>
    </Page>
  );
}
