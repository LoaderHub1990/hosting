import './hub.css';
import './site.css';
import { connection } from 'next/server';
import Providers from '@/components/Providers';

export const metadata = {
  metadataBase: new URL(process.env.BASE_URL || 'https://128bit.online'),
  title: { default: '128B!t Hub X — Roblox Script Hub', template: '%s · 128B!t Hub X' },
  description: 'สคริปต์ Roblox เมนูภาษาไทย 100% ฟังก์ชันครบ รองรับหลายแมพ ใช้งานง่าย',
  robots: { index: true, follow: true },
  openGraph: { title: '128B!t Hub X', description: 'สคริปต์ Roblox เมนูภาษาไทย 100% ฟังก์ชันครบ รองรับหลายแมพ', type: 'website' },
  icons: { icon: '/icon.svg' },
};
export const viewport = { themeColor: '#09090b', width: 'device-width', initialScale: 1, colorScheme: 'dark' };

export default async function RootLayout({ children }) {
  await connection(); // ทุกหน้า render ใหม่ต่อ request → ใส่ CSP nonce ให้ script ของ Next ได้
  return (
    <html lang="th">
      <body className="hub">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
