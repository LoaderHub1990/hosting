'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Fx';
import { Mark } from './Logo';

const LINKS = [
  ['/home', 'หน้าแรก', 'home'],
  ['/getkey', 'Get Key', 'key'],
  ['/docs', 'Docs', 'book'],
  ['/obfuscate', 'Obfuscate', 'shield'],
  ['/dashboard', 'สถิติ', 'chart'],
];

// แถบนำทางลอยแบบ "dock" เหมือนแดชบอร์ด Flexozy
export default function Nav() {
  const path = usePathname() || '/';
  const on = (h) => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));
  return (
    <nav className="dock site-dock rim" aria-label="เมนูหลัก">
      <Link href="/home" className="dock-brand" aria-label="128B!t Hub X">
        <Mark size={40} />
        <span className="dock-tx"><b>128B!t Hub X</b><span>Roblox Script Hub</span></span>
      </Link>
      <div className="dock-links">
        {LINKS.map(([h, t, ic]) => (
          <Link key={h} href={h} className={'nv rp' + (on(h) ? ' on' : '')} aria-current={on(h) ? 'page' : undefined}>
            <Icon n={ic} s={16} /><span>{t}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
