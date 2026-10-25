import Page from '@/components/Page';
import DocsView from '@/components/DocsView';
import data from '@/lib/docs.json';

export const metadata = { title: '128bitUI Docs', description: 'เอกสาร 128bitUI — Roblox Lua UI Library สำหรับ script executor' };
export default function DocsPage() { return <Page wide><DocsView data={data} /></Page>; }
