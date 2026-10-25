import Link from 'next/link';
import Page from '@/components/Page';
import { Icon } from '@/components/Fx';

export const metadata = { title: '404' };
export default function NotFound() {
  return (
    <Page>
      <section className="pn center-card rim">
        <span className="big-ic"><Icon n="warn" s={30} /></span>
        <h1>ไม่พบหน้านี้</h1>
        <p className="h-sub">ลิงก์อาจผิด หรือหน้านี้ถูกย้ายไปแล้ว</p>
        <Link href="/home" className="h-btn primary rp"><Icon n="home" s={16} />กลับหน้าแรก</Link>
      </section>
    </Page>
  );
}
