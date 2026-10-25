import Link from 'next/link';
import Page from '@/components/Page';
import CountUp from '@/components/CountUp';
import { Icon, CopyBtn } from '@/components/Fx';
import { DiscordIcon } from '@/components/Logo';
import { getPublicStats } from '@/lib/analytics';
import { PLACE_SCRIPTS, PLACE_IDS, LOADER, DISCORD_INVITE } from '@/lib/places';

export const metadata = { title: { absolute: '128B!t Hub X — สคริปต์ Roblox เมนูภาษาไทย' } };

const FEATURES = [
  ['globe', 'เมนูภาษาไทย 100%', 'ทุกปุ่ม ทุกคำอธิบาย เป็นภาษาไทย อ่านง่าย ไม่ต้องเดา'],
  ['zap', 'ฟังก์ชันแน่นๆ ครบๆ', 'รวมฟีเจอร์ที่ใช้บ่อยไว้ในเมนูเดียว เปิด/ปิดได้ทันที'],
  ['layers', 'รองรับหลายแมพ', 'ตรวจแมพให้อัตโนมัติ แล้วโหลดสคริปต์ที่ตรงกับเกมให้เอง'],
];
const STEPS = [
  ['รับ Key', 'ทำ Checkpoint ครบ 5 ด่าน แล้วกดรับคีย์ใช้ได้ 24 ชั่วโมง'],
  ['คัดลอกสคริปต์', 'กดคัดลอกโค้ดโหลดสคริปต์ด้านบน'],
  ['วางในตัวรัน แล้วกด Execute', 'ใส่คีย์ในหน้าต่างที่ขึ้นมา แล้วเริ่มเล่นได้เลย'],
];

export default async function Home() {
  const { total, days, today } = await getPublicStats();
  return (
    <Page>
      <section className="hero">
        <span className="eyebrow"><i />ออนไลน์ · อัปเดตสม่ำเสมอ</span>
        <h1>128B!t<em>Hub X</em></h1>
        <p className="lead">สคริปต์ของทางเรา ใช้งานง่าย เมนูภาษาไทย 100% ฟังก์ชันแน่นๆ ครบๆ รองรับหลายแมพ</p>
        <div className="chips">
          <span className="badge ok">เมนูภาษาไทย</span><span className="badge ok">ฟังก์ชันครบ</span><span className="badge ok">หลายแมพ</span>
        </div>
        <div className="cta">
          <a href="#script" className="h-btn primary rp"><Icon n="terminal" s={17} />Get Script</a>
          <Link href="/getkey" className="h-btn rp"><Icon n="key" s={17} />Get Key</Link>
        </div>
      </section>

      <div className="h-stats">
        <div className="h-stat glow rim"><span className="si"><Icon n="play" s={17} /></span><b><CountUp to={total} /></b><em>รันทั้งหมด</em></div>
        <div className="h-stat glow rim"><span className="si"><Icon n="zap" s={17} /></span><b><CountUp to={days?.[today] || 0} /></b><em>รันวันนี้</em></div>
        <div className="h-stat glow rim"><span className="si"><Icon n="layers" s={17} /></span><b>{PLACE_IDS.length}</b><em>แมพที่รองรับ</em></div>
        <div className="h-stat glow rim"><span className="si"><Icon n="clock" s={17} /></span><b>24 ชม.</b><em>อายุคีย์ฟรี</em></div>
      </div>

      <section className="sec">
        <div className="grid3">
          {FEATURES.map(([ic, t, d]) => (
            <div className="feat glow rim" key={t}><span className="si"><Icon n={ic} s={20} /></span><b>{t}</b><span>{d}</span></div>
          ))}
        </div>
      </section>

      <section className="sec" id="script">
        <div className="sec-h"><h2>Get Script</h2><p>คัดลอกโค้ดนี้ไปวางในตัวรัน แล้วกด Execute</p></div>
        <div className="split">
          <div className="codebox rim">
            <div className="codebox-h"><span>main.lua</span><CopyBtn text={LOADER} label="Copy Script" /></div>
            <pre><code><span className="tk">loadstring</span>(game:HttpGet(<span className="ts">&quot;https://128bit.online/128bit-hub-x/antonymxx/main.lua&quot;</span>))()</code></pre>
          </div>
          <div className="steps">
            {STEPS.map(([t, d], i) => (
              <div className="step rim glow" key={t}><span className="n">{i + 1}</span><span className="tx"><b>{t}</b><em>{d}</em></span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-h"><h2>แมพที่รองรับ</h2><p>เพิ่มแมพใหม่เรื่อย ๆ — ดูอัปเดตได้ใน Discord</p></div>
        <div className="maps">
          {PLACE_IDS.map((id) => (
            <div className="map" key={id}><i><Icon n="play" s={15} /></i><span>{PLACE_SCRIPTS[id].name}</span></div>
          ))}
        </div>
      </section>

      <section className="sec">
        <div className="cta-card rim">
          <span className="ic-big"><DiscordIcon s={32} /></span>
          <div><h3>128B!t Hub X | Official</h3><p>เข้าร่วม Discord Server เพื่อรับข่าวสารและอัปเดตต่าง ๆ แล้วเจอกันข้างใน</p></div>
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" className="h-btn discord rp"><DiscordIcon s={16} />Join Discord</a>
        </div>
      </section>
    </Page>
  );
}
