import Link from 'next/link';
import { DiscordIcon } from './Logo';
import { DISCORD_INVITE } from '@/lib/places';

export default function Footer() {
  return (
    <footer className="foot">
      <span>Power by 128bit. | © 2026</span>
      <span className="foot-l">
        <Link href="/docs">Docs</Link>
        <Link href="/invite">Discord</Link>
        <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer" aria-label="Discord"><DiscordIcon s={16} /></a>
      </span>
    </footer>
  );
}
