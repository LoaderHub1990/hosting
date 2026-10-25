import Admin from '@/components/Admin';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default function AdminPage() { return <div className="wrap"><Admin /></div>; }
