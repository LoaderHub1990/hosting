import Page from '@/components/Page';
import LiveStats from '@/components/LiveStats';
import { getPublicStats } from '@/lib/analytics';

export const metadata = { title: 'สถิติการรันสคริปต์' };
export default async function DashboardPage() {
  return (
    <Page>
      <div className="pagehead"><div><span className="badge ok">Live</span><h1>สถิติการรันสคริปต์</h1><p>จำนวนครั้งที่สคริปต์ถูกรันทั้งหมด (ข้อมูลสาธารณะ)</p></div></div>
      <LiveStats initial={await getPublicStats()} />
    </Page>
  );
}
