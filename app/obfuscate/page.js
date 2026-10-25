import Page from '@/components/Page';
import Obfuscator from '@/components/Obfuscator';

export const metadata = { title: 'Lua Obfuscator', description: 'เครื่องมือ obfuscate โค้ด Lua / Luau ด้วย Prometheus' };
export default function ObfuscatePage() { return <Page wide><Obfuscator /></Page>; }
