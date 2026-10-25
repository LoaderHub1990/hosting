'use client';
import { Icon } from '@/components/Fx';

export default function Error({ reset }) {
  return (
    <div className="wrap">
      <section className="pn center-card rim">
        <span className="big-ic"><Icon n="warn" s={30} /></span>
        <h1>เกิดข้อผิดพลาด</h1>
        <p className="h-sub">ลองโหลดใหม่อีกครั้ง ถ้ายังเป็นอยู่แจ้งแอดมินใน Discord</p>
        <button className="h-btn primary rp" onClick={() => reset()}><Icon n="refresh" s={16} />ลองใหม่</button>
      </section>
    </div>
  );
}
