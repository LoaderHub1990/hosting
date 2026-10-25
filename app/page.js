import Intro from '@/components/Intro';

export const metadata = { title: { absolute: '128B!t Hub X — เริ่มต้นใช้งาน' } };

// หน้าแรกสุด: อินโทรแบบเดียวกับสคริปต์ Lua แล้วค่อยไปหน้า /home
export default function Entry() {
  return <Intro />;
}
