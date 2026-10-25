'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon, Tabs, Select, Modal, CopyBtn, useToast } from './Fx';
import { Mark, DiscordIcon } from './Logo';
import CountUp from './CountUp';
import { PLACE_SCRIPTS, PLACE_IDS } from '@/lib/places';

const TABS = [
  ['overview', 'ภาพรวม', 'grid'],
  ['keys', 'คีย์', 'key'],
  ['analytics', 'สถิติการรัน', 'chart'],
  ['security', 'ความปลอดภัย', 'shield'],
];
const LOGIN_ERR = { forbidden: 'บัญชี Discord นี้ไม่มีสิทธิ์แอดมิน', state: 'เซสชันล็อกอินหมดอายุ ลองใหม่อีกครั้ง', oauth: 'เข้าสู่ระบบกับ Discord ไม่สำเร็จ ลองใหม่อีกครั้ง' };
const fmt = (d) => (d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const left = (d) => { const ms = new Date(d) - Date.now(); return ms > 0 ? `เหลือ ${Math.floor(ms / 36e5)} ชม. ${Math.floor((ms % 36e5) / 6e4)} นาที` : 'หมดอายุแล้ว'; };

export default function Admin() {
  const [me, setMe] = useState(null); // null = กำลังเช็ก, false = ยังไม่ล็อกอิน
  const [cfg, setCfg] = useState({ discord: false });

  const check = useCallback(async () => {
    try {
      const r = await fetch('/admin/auth/me', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      setCfg({ discord: !!d.discord });
      setMe(r.ok ? d : false);
    } catch { setMe(false); }
  }, []);
  useEffect(() => { check(); }, [check]);

  if (me === null) return <div className="loading" style={{ minHeight: '60vh' }}><div><span className="h-spin" />กำลังตรวจสอบสิทธิ์…</div></div>;
  if (!me) return <Login discord={cfg.discord} onDone={check} />;
  return <Panel me={me} onLogout={() => setMe(false)} />;
}

/* ───────────────────────────── Login ───────────────────────────── */
function Login({ discord, onDone }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    const e = new URLSearchParams(location.search).get('error');
    if (e) { setErr(LOGIN_ERR[e] || LOGIN_ERR.oauth); history.replaceState(null, '', '/admin'); }
  }, []);

  const submit = async (ev) => {
    ev.preventDefault(); if (busy || !pw) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setPw(''); toast.ok('เข้าสู่ระบบแล้ว'); await onDone(); return; }
      if (r.status === 429) setErr(d.error === 'locked' ? `ลองผิดหลายครั้ง ถูกล็อกชั่วคราว (${Math.ceil((d.retryAfter || 900) / 60)} นาที)` : 'ลองถี่เกินไป รอสักครู่');
      else setErr('รหัสไม่ถูกต้อง');
    } catch { setErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'); }
    setBusy(false);
  };

  return (
    <section className="pn login-card rim glow">
      <div className="top"><Mark size={56} /><h1>Admin</h1><p className="h-sub">128B!t Hub X — เฉพาะผู้ดูแลระบบ</p></div>
      {err ? <div className="alert bad" role="alert"><Icon n="warn" s={16} />{err}</div> : null}
      {discord ? (<>
        <a href="/admin/auth/discord" className="h-btn discord wide rp"><DiscordIcon s={16} />เข้าสู่ระบบด้วย Discord</a>
        <div className="or">หรือ</div>
      </>) : null}
      <form className="f" onSubmit={submit}>
        <label className="h-fl">รหัสแอดมิน
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="••••••••••••" maxLength={256} autoFocus />
        </label>
        <button className="h-btn primary wide rp" disabled={busy || !pw}><Icon n="lock" s={16} />{busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}</button>
      </form>
      <Link href="/" className="h-sub" style={{ textAlign: 'center' }}>← กลับหน้าแรก</Link>
    </section>
  );
}

/* ───────────────────────────── Panel ───────────────────────────── */
function Panel({ me, onLogout }) {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [keys, setKeys] = useState(null);
  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState(null);
  const [modal, setModal] = useState(null); // {kind:'create'|'revoke'|'reset'|'resetStats', key?}
  const csrf = useRef(me.csrf);
  csrf.current = me.csrf;

  const api = useCallback(async (method, url, body) => {
    const r = await fetch(url, { method, cache: 'no-store', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf.current }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) { onLogout(); throw new Error('401'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || String(r.status));
    return d;
  }, [onLogout]);

  const loadKeys = useCallback(async () => { try { setKeys(await api('GET', '/getkey/admin/keys')); } catch (e) { if (e.message !== '401') toast.bad('โหลดคีย์ไม่สำเร็จ', e.message); } }, [api, toast]);
  const loadStats = useCallback(async () => { try { setStats(await api('GET', '/api/stats')); } catch (e) { if (e.message !== '401') toast.bad('โหลดสถิติไม่สำเร็จ', e.message); } }, [api, toast]);
  const loadAudit = useCallback(async () => { try { setAudit(await api('GET', '/admin/api/audit')); } catch (e) { if (e.message !== '401') toast.bad('โหลดข้อมูลความปลอดภัยไม่สำเร็จ', e.message); } }, [api, toast]);
  const refresh = useCallback(() => { loadKeys(); loadStats(); if (tab === 'security') loadAudit(); }, [loadKeys, loadStats, loadAudit, tab]);

  useEffect(() => { loadKeys(); loadStats(); }, [loadKeys, loadStats]);
  useEffect(() => { if (tab === 'security') loadAudit(); }, [tab, loadAudit]);
  useEffect(() => {
    const h = location.hash.slice(1);
    if (TABS.some((t) => t[0] === h)) setTab(h);
    const on = () => { const x = location.hash.slice(1); if (TABS.some((t) => t[0] === x)) setTab(x); };
    addEventListener('hashchange', on); return () => removeEventListener('hashchange', on);
  }, []);
  const go = (k) => { setTab(k); try { history.replaceState(null, '', '#' + k); } catch {} };

  const logout = async () => {
    try { await fetch('/admin/auth/logout', { method: 'POST', headers: { 'x-csrf-token': csrf.current } }); } catch {}
    onLogout();
  };

  return (
    <>
      <header className="dock rim">
        <span className="dock-av">{me.avatar ? <img src={me.avatar} alt="" referrerPolicy="no-referrer" /> : <i>{(me.name || 'A')[0].toUpperCase()}</i>}</span>
        <div className="dock-tx"><b>{me.name}</b><span className="on">Admin · {me.via === 'discord' ? 'Discord' : 'รหัสผ่าน'}</span></div>
        <div className="dock-act">
          <button className="ibtn rp" onClick={refresh} aria-label="รีเฟรช" title="รีเฟรช"><Icon n="refresh" s={18} /></button>
          <Link className="ibtn rp" href="/" aria-label="หน้าเว็บ" title="หน้าเว็บ"><Icon n="home" s={18} /></Link>
          <button className="ibtn danger rp" onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ"><Icon n="logout" s={18} /></button>
        </div>
      </header>
      <div className="dash-nav"><Tabs tabs={TABS} value={tab} onChange={go} /></div>

      <div className="view" key={tab}>
        {tab === 'overview' && <Overview keys={keys} stats={stats} onCreate={() => setModal({ kind: 'create' })} go={go} />}
        {tab === 'keys' && <Keys keys={keys} onCreate={() => setModal({ kind: 'create' })} onRevoke={(k) => setModal({ kind: 'revoke', key: k })} onReset={(k) => setModal({ kind: 'reset', key: k })} />}
        {tab === 'analytics' && <Analytics stats={stats} onReset={() => setModal({ kind: 'resetStats' })} />}
        {tab === 'security' && <Security data={audit} reload={loadAudit} />}
      </div>

      {modal?.kind === 'create' && <CreateModal api={api} onClose={() => setModal(null)} onDone={loadKeys} />}
      {modal?.kind === 'revoke' && <Confirm icon="trash" title="เพิกถอนคีย์" sub="คีย์นี้จะใช้งานไม่ได้ทันที และย้อนกลับไม่ได้" danger label="เพิกถอน" code={modal.key} onClose={() => setModal(null)}
        run={async () => { await api('DELETE', '/getkey/admin/key/' + encodeURIComponent(modal.key)); toast.ok('เพิกถอนแล้ว'); loadKeys(); }} />}
      {modal?.kind === 'reset' && <Confirm icon="refresh" title="รีเซ็ต HWID" sub="เจ้าของคีย์จะผูกกับเครื่องใหม่ได้ 1 ครั้ง" label="รีเซ็ต" code={modal.key} onClose={() => setModal(null)}
        run={async () => { await api('POST', '/getkey/admin/key/' + encodeURIComponent(modal.key) + '/reset-hwid'); toast.ok('รีเซ็ต HWID แล้ว'); loadKeys(); }} />}
      {modal?.kind === 'resetStats' && <Confirm icon="trash" title="ล้างสถิติทั้งหมด" sub="ตัวเลขการรันทุกแมพและรายวันจะถูกลบ" danger label="ล้างสถิติ" onClose={() => setModal(null)}
        run={async () => { await api('POST', '/api/stats/reset'); toast.ok('ล้างสถิติแล้ว'); loadStats(); }} />}
    </>
  );
}

/* ───────────────────────────── Overview ───────────────────────────── */
function Overview({ keys, stats, onCreate, go }) {
  const c = useMemo(() => {
    const k = keys || [];
    return { total: k.length, perm: k.filter((x) => x.type === 'perm').length, temp: k.filter((x) => x.type === 'temp' && x.active).length, bound: k.filter((x) => x.hwidBound).length };
  }, [keys]);
  const todayRuns = stats?.days?.[stats.today] || 0;
  const recent = useMemo(() => [...(keys || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5), [keys]);
  return (
    <>
      <div className="pagehead"><div><h1>ภาพรวม</h1><p>สรุปคีย์และการรันสคริปต์ทั้งหมด</p></div><button className="h-btn primary rp" onClick={onCreate}><Icon n="plus" s={16} />สร้างคีย์</button></div>
      <div className="h-stats">
        <Stat ic="key" l="คีย์ทั้งหมด" v={c.total} />
        <Stat ic="crown" l="Premium" v={c.perm} />
        <Stat ic="clock" l="Temp ที่ใช้ได้" v={c.temp} />
        <Stat ic="play" l="รันวันนี้" v={todayRuns} />
      </div>
      <div className="tiles" style={{ marginTop: 16 }}>
        <section className="pn rim">
          <div className="pn-h"><h3><Icon n="key" s={18} />คีย์ล่าสุด</h3><button className="h-btn ghost sm rp" onClick={() => go('keys')}>ดูทั้งหมด<Icon n="arrow" s={14} /></button></div>
          {!keys ? <Loading /> : recent.length === 0 ? <Empty ic="key" t="ยังไม่มีคีย์" /> : <div className="plist stack">{recent.map((k) => <KeyRow key={k.key} k={k} compact />)}</div>}
        </section>
        <section className="pn rim">
          <div className="pn-h"><h3><Icon n="chart" s={18} />รันทั้งหมด</h3><button className="h-btn ghost sm rp" onClick={() => go('analytics')}>รายละเอียด<Icon n="arrow" s={14} /></button></div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-.03em' }}><CountUp to={stats?.total || 0} /></div>
          <p className="h-sub">ทุกแมพรวมกัน · HWID ที่ผูกแล้ว {c.bound} คีย์</p>
        </section>
      </div>
    </>
  );
}
const Stat = ({ ic, l, v }) => <div className="h-stat glow rim"><span className="si"><Icon n={ic} s={17} /></span><b><CountUp to={v} /></b><em>{l}</em></div>;
const Loading = () => <div className="loading" style={{ minHeight: 120 }}><div><span className="h-spin" /></div></div>;
const Empty = ({ ic, t, s }) => <div className="h-empty"><Icon n={ic} s={28} /><b>{t}</b>{s ? <span>{s}</span> : null}</div>;

/* ───────────────────────────── Keys ───────────────────────────── */
function KeyRow({ k, onRevoke, onReset, compact }) {
  const perm = k.type === 'perm';
  return (
    <div className={'krow' + (k.active ? '' : ' off')}>
      <div className="kk">
        <code title={k.key}>{k.key}</code>
        <span>{perm ? 'ตลอดชีพ' : k.expires ? `${fmt(k.expires)} · ${left(k.expires)}` : '—'}{k.note ? ` · ${k.note}` : ''}{!compact && k.createdAt ? ` · สร้าง ${fmt(k.createdAt)}` : ''}</span>
      </div>
      <div className="tags">
        <span className={'badge ' + (perm ? 'warn' : '')}>{perm ? 'Premium' : 'Temp'}</span>
        <span className={'badge ' + (k.active ? 'ok' : 'bad')}>{k.active ? 'Active' : 'Expired'}</span>
        {perm && k.hwidBound ? <span className="badge plain" title="ผูกกับเครื่องแล้ว">HWID</span> : null}
      </div>
      <div className="acts">
        <CopyBtn text={k.key} label="" done="" className="ibtn" />
        {!compact && perm && k.hwidBound ? <button className="ibtn rp" onClick={() => onReset(k.key)} title="รีเซ็ต HWID" aria-label="รีเซ็ต HWID"><Icon n="refresh" s={16} /></button> : null}
        {!compact ? <button className="ibtn danger rp" onClick={() => onRevoke(k.key)} title="เพิกถอน" aria-label="เพิกถอน"><Icon n="trash" s={16} /></button> : null}
      </div>
    </div>
  );
}

function Keys({ keys, onCreate, onRevoke, onReset }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [st, setSt] = useState('all');
  const list = useMemo(() => (keys || [])
    .filter((k) => (type === 'all' || k.type === type) && (st === 'all' || (st === 'active') === k.active) && (!q || [k.key, k.note, k.ip].some((v) => (v || '').toLowerCase().includes(q.toLowerCase()))))
    .sort((a, b) => (a.type !== b.type ? (a.type === 'perm' ? -1 : 1) : new Date(b.createdAt || 0) - new Date(a.createdAt || 0))), [keys, q, type, st]);
  return (
    <>
      <div className="pagehead"><div><h1>คีย์</h1><p>{keys ? `${list.length} / ${keys.length} รายการ` : 'กำลังโหลด…'}</p></div></div>
      <section className="pn rim">
        <div className="filters">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา คีย์ / โน้ต / IP" aria-label="ค้นหา" />
          <Select value={type} onChange={setType} options={[{ value: 'all', label: 'ทุกประเภท' }, { value: 'perm', label: 'Premium' }, { value: 'temp', label: 'Temp' }]} />
          <Select value={st} onChange={setSt} options={[{ value: 'all', label: 'ทุกสถานะ' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }]} />
          <button className="h-btn primary rp" onClick={onCreate}><Icon n="plus" s={16} />สร้างคีย์</button>
        </div>
        {!keys ? <Loading /> : list.length === 0 ? <Empty ic="key" t="ไม่พบคีย์" s="ลองเปลี่ยนตัวกรอง หรือสร้างคีย์ใหม่" /> : <div className="plist stack">{list.map((k) => <KeyRow key={k.key} k={k} onRevoke={onRevoke} onReset={onReset} />)}</div>}
      </section>
    </>
  );
}

function CreateModal({ api, onClose, onDone }) {
  const toast = useToast();
  const [type, setType] = useState('perm');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState(null);
  const create = async () => {
    setBusy(true);
    try { const d = await api('POST', '/getkey/admin/create', { type, note }); setMade(d.key); onDone(); }
    catch (e) { toast.bad('สร้างคีย์ไม่สำเร็จ', e.message); }
    setBusy(false);
  };
  return (
    <Modal onClose={onClose} icon="key" title="สร้างคีย์ใหม่" sub="Premium = ถาวร ผูก HWID · Temp = ใช้ได้ 24 ชั่วโมง">
      {(close) => made ? (
        <div className="keybox"><span className="h-sub">คัดลอกเก็บไว้ได้เลย</span><div className="key">{made}</div>
          <div className="h-row"><CopyBtn text={made} label="คัดลอก" className="h-btn primary" /><button className="h-btn ghost rp" onClick={close}>ปิด</button></div></div>
      ) : (
        <div className="f">
          <label className="h-fl">ประเภท<Select value={type} onChange={setType} options={[{ value: 'perm', label: 'Premium (ถาวร)' }, { value: 'temp', label: 'Temp (24 ชั่วโมง)' }]} /></label>
          <label className="h-fl">โน้ต (ไม่บังคับ)<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="เช่น ชื่อผู้ซื้อ / Discord" /></label>
          <button className="h-btn primary wide rp" onClick={create} disabled={busy}><Icon n="plus" s={16} />{busy ? 'กำลังสร้าง…' : 'สร้างคีย์'}</button>
        </div>
      )}
    </Modal>
  );
}

function Confirm({ icon, title, sub, label, danger, code, run, onClose }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={onClose} icon={icon} title={title} sub={sub}>
      {(close) => (
        <div className="f">
          {code ? <div className="out" style={{ minHeight: 0, padding: '12px 16px' }}>{code}</div> : null}
          <div className="h-row" style={{ justifyContent: 'flex-end' }}>
            <button className="h-btn ghost rp" onClick={close}>ยกเลิก</button>
            <button className={'h-btn rp ' + (danger ? 'danger' : 'primary')} disabled={busy} onClick={async () => { setBusy(true); try { await run(); close(); } catch (e) { toast.bad('ไม่สำเร็จ', e.message); setBusy(false); } }}>{busy ? 'กำลังทำ…' : label}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ───────────────────────────── Analytics ───────────────────────────── */
function Analytics({ stats, onReset }) {
  const rows = useMemo(() => {
    const runs = stats?.runs || {};
    const get = (id) => { const r = runs[id]; return typeof r === 'number' ? { free: r, premium: 0 } : { free: r?.free || 0, premium: r?.premium || 0 }; };
    return PLACE_IDS.map((id) => ({ id, name: PLACE_SCRIPTS[id].name, ...get(id) })).map((m) => ({ ...m, total: m.free + m.premium })).sort((a, b) => b.total - a.total);
  }, [stats]);
  const tot = rows.reduce((a, r) => ({ free: a.free + r.free, premium: a.premium + r.premium }), { free: 0, premium: 0 });
  const max = Math.max(1, rows[0]?.total || 1);
  const days = useMemo(() => {
    if (!stats) return [];
    return Array.from({ length: 30 }, (_, i) => { const d = new Date(stats.today + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (29 - i)); const k = d.toISOString().slice(0, 10); return { k, v: stats.days?.[k] || 0 }; });
  }, [stats]);
  const dmax = Math.max(1, ...days.map((d) => d.v));
  return (
    <>
      <div className="pagehead"><div><h1>สถิติการรัน</h1><p>แยกตามแมพ · Free / Premium</p></div><button className="h-btn danger rp" onClick={onReset}><Icon n="trash" s={16} />ล้างสถิติ</button></div>
      <div className="h-stats">
        <Stat ic="play" l="รันทั้งหมด" v={tot.free + tot.premium} /><Stat ic="users" l="Free" v={tot.free} /><Stat ic="crown" l="Premium" v={tot.premium} />
        <div className="h-stat glow rim"><span className="si"><Icon n="star" s={17} /></span><b style={{ fontSize: 17 }}>{rows[0]?.total ? rows[0].name : '—'}</b><em>แมพยอดนิยม</em></div>
      </div>
      <section className="pn rim" style={{ marginTop: 16 }}>
        <div className="pn-h"><h3><Icon n="layers" s={18} />รันต่อแมพ</h3><span className="legend"><span><i style={{ background: '#e8e8ee' }} />Free</span><span><i style={{ background: '#ffb454' }} />Premium</span></span></div>
        {!stats ? <Loading /> : rows.map((m) => (
          <div className="hbar" key={m.id} title={`Place ID ${m.id}`}>
            <b>{m.name}</b>
            <div className="tr"><i className="f" style={{ width: `${(m.free / max) * 100}%` }} /><i className="p" style={{ width: `${(m.premium / max) * 100}%` }} /></div>
            <em>{m.total.toLocaleString()}</em>
          </div>
        ))}
      </section>
      <section className="pn rim" style={{ marginTop: 16 }}>
        <div className="pn-h"><h3><Icon n="chart" s={18} />30 วันล่าสุด</h3></div>
        <div className="bars">{days.map((d) => <div key={d.k} className={'b' + (d.k === stats?.today ? ' today' : '')}><span>{d.k.slice(5)} · {d.v.toLocaleString()}</span><i style={{ height: `${Math.max(2, (d.v / dmax) * 100)}%` }} /></div>)}</div>
      </section>
    </>
  );
}

/* ───────────────────────────── Security ───────────────────────────── */
const CHECKS = [
  ['tokenSecret', 'TOKEN_SECRET ยาว ≥ 32 ตัวอักษร', 'ใช้เซ็น session / state'],
  ['adminSecretSeparate', 'ตั้ง ADMIN_SECRET แยกจาก TOKEN_SECRET', 'ลดความเสี่ยงถ้าตัวใดตัวหนึ่งหลุด'],
  ['adminSecretStrong', 'ADMIN_SECRET ยาว ≥ 16 ตัวอักษร', ''],
  ['https', 'BASE_URL เป็น https://', 'เปิด HSTS + upgrade-insecure-requests'],
  ['secureCookies', 'Cookie แบบ Secure + __Host-', 'ส่งเฉพาะผ่าน HTTPS'],
  ['antibypass', 'Linkvertise Anti-Bypass เปิดอยู่', 'ตรวจ hash ของแต่ละด่านกับ Linkvertise'],
  ['discordLogin', 'ล็อกอินแอดมินด้วย Discord (จำกัด ID)', 'ไม่บังคับ แต่แนะนำ'],
];
const ACTIVE = [
  ['CSP แบบ nonce + strict-dynamic', 'สคริปต์ที่ไม่ได้มาจากเรา รันไม่ได้'],
  ['HSTS · X-Frame-Options · nosniff · COOP/CORP · Permissions-Policy', 'header ป้องกันทั่วไปทุกหน้า'],
  ['Rate limit ทุก endpoint สาธารณะ', 'ต่อ IP แบบ sliding window'],
  ['ล็อกเอาต์ IP ที่เดารหัสผิดซ้ำ', '5 ครั้ง / 15 นาที → ล็อก 15 นาที'],
  ['Session cookie HttpOnly + SameSite=Strict + ผูก User-Agent', 'ขโมย cookie ไปใช้ที่อื่นไม่ได้'],
  ['CSRF token + ตรวจ Origin', 'ทุกคำสั่งที่เปลี่ยนข้อมูลของแอดมิน'],
  ['เขียนฐานข้อมูลแบบคิว + atomic', 'กัน race (เช่น ผูก HWID พร้อมกัน) และไฟล์พัง'],
  ['ไฟล์ Lua ไม่เสิร์ฟให้เบราว์เซอร์ + กัน path traversal', 'ได้ 404 ปลอมแทนโค้ดจริง'],
  ['Obfuscator: spawn แบบไม่ผ่าน shell, timeout, จำกัดงานพร้อมกัน/ขนาด', 'ไม่ส่งรายละเอียด error ภายในออกไป'],
  ['บล็อกเส้นทางสแกนช่องโหว่ (.env, .git, wp-admin, *.php)', 'ตอบ 404 ตั้งแต่ middleware'],
];
function Security({ data, reload }) {
  const bad = (e) => /fail|denied|lockout|csrf|bypass|too_fast|limit/.test(e);
  return (
    <>
      <div className="pagehead"><div><h1>ความปลอดภัย</h1><p>สถานะการตั้งค่า และบันทึกเหตุการณ์ล่าสุด</p></div><button className="h-btn ghost rp" onClick={reload}><Icon n="refresh" s={16} />โหลดใหม่</button></div>
      <div className="tiles">
        <section className="pn rim">
          <div className="pn-h"><h3><Icon n="shield" s={18} />ตรวจการตั้งค่า</h3></div>
          {!data ? <Loading /> : <div className="stack">{CHECKS.map(([k, t, d]) => <div key={k} className={'chk ' + (data.checks[k] ? 'ok' : 'bad')}><Icon n={data.checks[k] ? 'check' : 'warn'} s={16} sw={2.2} />{t}<small>{d}</small></div>)}</div>}
        </section>
        <section className="pn rim">
          <div className="pn-h"><h3><Icon n="lock" s={18} />ระบบป้องกันที่ทำงานอยู่</h3></div>
          <div className="stack">{ACTIVE.map(([t, d]) => <div key={t} className="chk ok"><Icon n="check" s={16} sw={2.2} /><span>{t}</span><small>{d}</small></div>)}</div>
        </section>
      </div>
      <section className="pn rim" style={{ marginTop: 16 }}>
        <div className="pn-h"><h3><Icon n="list" s={18} />บันทึกเหตุการณ์</h3><span className="h-sub">150 รายการล่าสุด</span></div>
        {!data ? <Loading /> : data.events.length === 0 ? <Empty ic="shield" t="ยังไม่มีเหตุการณ์" s="เหตุการณ์ล็อกอิน / ถูกบล็อก / จัดการคีย์ จะแสดงที่นี่" /> : (
          <div className="aud">{data.events.map((e, i) => (
            <div key={i}><span>{new Date(e.t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' })}</span><span className={'e ' + (bad(e.e) ? 'bad' : e.e === 'admin.login' ? 'ok' : '')}>{e.e}</span>
              <span className="d">{Object.entries(e).filter(([k]) => k !== 't' && k !== 'e').map(([k, v]) => `${k}=${v}`).join('  ')}</span></div>
          ))}</div>
        )}
      </section>
    </>
  );
}
