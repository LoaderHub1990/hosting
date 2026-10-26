'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mark } from './Logo';

// ทำซ้ำอินโทรของสคริปต์ Lua (Flexozy X) ให้เหมือนเป๊ะ: การ์ดกว้าง 560×400, 7 หน้า, เคอร์เซอร์จำลอง
const CFG = { name: '128B!t Hub X', keyName: 'K', prefix: ';' };
const TINT = {
  white: ['#2a2a2e', '#f2f2f4'],
  blue: ['#0d2833', '#40baff'], purple: ['#261c3e', '#a878ff'],
  teal: ['#0e2e28', '#38e0ba'], orange: ['#3e2410', '#ff9632'],
};
const W = 560, HMAX = 520, hFor = (pg) => (pg === 3 ? 520 : 400);
const at = (x, y, w, h) => ({ left: x, top: y, width: w, height: h });

function useAnim(fn) {
  useEffect(() => {
    let alive = true;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    fn({ sleep, ok: () => alive });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function useCursor(x, y) {
  const [c, setC] = useState({ x, y, press: false });
  const [rip, setRip] = useState(null);
  const k = useRef(0);
  const go = (nx, ny) => setC((s) => ({ ...s, x: nx, y: ny }));
  const click = async (nx, ny, sleep) => {
    setC((s) => ({ ...s, press: true })); setRip({ x: nx, y: ny, k: ++k.current });
    await sleep(140); setC((s) => ({ ...s, press: false }));
  };
  const node = (
    <>
      {rip && <i key={rip.k} className="in-rip" style={{ left: rip.x, top: rip.y }} />}
      <b className={'in-cur' + (c.press ? ' press' : '')} style={{ left: c.x, top: c.y }}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4.5 2.5l15 8.6-6.6 1.9-3.4 6.4z" fill="#fff" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" /></svg></b>
    </>
  );
  return { go, click, node };
}

const Head = ({ t, b }) => (
  <>
    <h2 className="in-t" style={at(40, 144, W - 80, 30)}>{t}</h2>
    <p className="in-b" style={at(60, 182, W - 120, 60)}>{b}</p>
  </>
);
const Tg = ({ on }) => <span className={'in-tg' + (on ? ' on' : '')}><i /></span>;

function P1() {
  const words = ['Hello', 'Hola', 'Bonjour', 'Hallo', 'Ciao', 'Hej', 'Aloha'];
  const [n, setN] = useState(0), [vis, setVis] = useState(true);
  useAnim(async ({ sleep, ok }) => {
    let i = 0;
    while (ok()) {
      await sleep(2400); if (!ok()) break;
      setVis(false); await sleep(340); if (!ok()) break;
      i = (i + 1) % words.length; setN(i); setVis(true);
    }
  });
  return (
    <>
      <div className="in-face" style={at(244, 8, 72, 72)}><Mark size={72} /></div>
      <h1 className={'in-hello' + (vis ? '' : ' off')} style={at(24, 86, W - 48, 48)}>{words[n]}, Player</h1>
      <p className="in-w" style={at(24, 138, W - 48, 22)}>Welcome to {CFG.name}</p>
      <p className="in-b" style={at(70, 170, W - 140, 44)}>Fly, speed, noclip and more, all one click away.</p>
    </>
  );
}

function P2() {
  const names = ['Character', 'World', 'Utility', 'Settings'];
  const iw = 60, pad = 6, dw = names.length * iw + pad * 2, x0 = (W - dw) / 2;
  const [sel, setSel] = useState(-1);
  const cur = useCursor(x0 + dw + 40, 110);
  useAnim(async ({ sleep, ok }) => {
    let i = 0;
    while (ok()) {
      const cx = x0 + pad + i * iw + iw / 2;
      cur.go(cx, 46); await sleep(600); if (!ok()) return;
      await cur.click(cx, 46, sleep); setSel(i); await sleep(900);
      i = (i + 1) % names.length;
    }
  });
  return (
    <>
      <div className="in-glass in-dock" style={at(x0, 20, dw, 52)}>
        <i className="in-cap" style={{ ...at(pad, pad, iw, 40), transform: `translateX(${Math.max(sel, 0) * iw}px)` }} />
        {names.map((n, i) => <u key={n} className={i === sel ? 'on' : ''} style={at(pad + i * iw + (iw - 14) / 2, pad + 13, 14, 14)} />)}
      </div>
      {names.map((n, i) => <span key={n} className={'in-dl' + (i === sel ? ' on' : '')} style={at(x0 + pad + i * iw - 4, 82, iw + 8, 14)}>{n}</span>)}
      {cur.node}
      <Head t="The dock" b="Everything lives in the bar on the side of your screen. Click an icon to jump straight to it." />
    </>
  );
}

// เมนูจริงของสคริปต์ (แท็บ → กลุ่ม → ปุ่มควบคุม)  t=สวิตช์ s=สไลเดอร์ d=ดรอปดาวน์ b=ปุ่ม k=คีย์
const MENU = [
  ['General', 'house', [
    [['Automatic', [['t', 'AutoFarm Coin'], ['s', 'Farm Speed', 10, 30], ['b', 'Unlock Camera Zoom']]]],
    [['Fling', [['d', 'Select Player', ['Player1', 'Player2']], ['s', 'Fling Timeout', 1, 10], ['b', 'Fling Selected']]]],
  ]],
  ['Combat', 'crosshair', [
    [['Murder Operations', [['t', 'Kill All'], ['b', 'Kill Sheriff/Hero'], ['k', 'Throw Knife', 'F']]]],
    [['Sheriff Operations', [['d', 'Shoot Mode', ['Wallbang', 'Silent Aim']], ['t', 'Aimlock Murder'], ['b', 'Grab Gun']]]],
  ]],
];
const ICO = {
  house: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  crosshair: <><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></>,
  zap: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  skull: <><path d="m12.5 17-.5-1-.5 1h1z" /><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="12" r="1" /></>,
};
const GI = { Automatic: 'zap', Fling: 'zap', 'Murder Operations': 'skull', 'Sheriff Operations': 'shield' };
const Ico = ({ n }) => <svg className="in-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICO[n]}</svg>;
const SLIDER_DEF = { 'Farm Speed': 21, 'Fling Timeout': 3, 'Local Volume': 50, 'Speed Value': 16, JumpPower: 50 };
const DD_DEF = { 'Radio Mode': 'FE Radio', 'Aimlock Target Part': 'HumanoidRootPart', 'Shoot Mode': 'Wallbang', 'Toggle Button': 'Mobile only', Theme: 'Mono' };
const menuDefaults = () => {
  const v = {};
  MENU.forEach(([tab, , cols]) => cols.forEach((col) => col.forEach(([, ctls]) => ctls.forEach(([t, n]) => {
    const k = tab + ':' + n;
    v[k] = t === 't' ? n === 'Loop Local Radio' : t === 's' ? SLIDER_DEF[n] : t === 'd' ? (DD_DEF[n] || '') : null;
  }))));
  return v;
};

function Ctl({ tab, c, vals }) {
  const [t, n, a, b] = c, key = tab + ':' + n, v = vals[key];
  if (t === 't') return <div className="in-wr" data-ctl={key}><span>{n}</span><i className={'in-wsw' + (v ? ' on' : '')}><u /></i></div>;
  if (t === 's') {
    const f = ((v - a) / (b - a)) * 100;
    return <div className="in-wr s" data-ctl={key}><span>{n}</span><em>{v}</em><div className="in-wtr"><b style={{ width: f + '%' }} /><u style={{ left: f + '%' }} /></div></div>;
  }
  if (t === 'd') return <div className="in-wr d" data-ctl={key}><span>{n}</span><kbd>{v || 'Select…'}<em>▾</em></kbd></div>;
  if (t === 'k') return <div className="in-wr" data-ctl={key}><span>{n}</span><kbd>{a}</kbd></div>;
  return <div className="in-wr b" data-ctl={key}>{n}</div>;
}

function P5() {
  const wrap = useRef(null), win = useRef(null);
  const [tab, setTab] = useState(0), [vals, setVals] = useState(menuDefaults), [dd, setDd] = useState(null);
  const [scroll, setScroll] = useState(0), [hide, setHide] = useState(false);
  const cur = useCursor(520, 215);
  useAnim(async ({ sleep, ok }) => {
    const find = (sel, fx = 0.5, fy = 0.5) => {
      const el = win.current && win.current.querySelector(sel), w = wrap.current && wrap.current.getBoundingClientRect();
      if (!el || !w) return null;
      const r = el.getBoundingClientRect(), k = w.width / W;
      return { x: (r.left + r.width * fx - w.left) / k, y: (r.top + r.height * fy - w.top) / k, l: (r.left - w.left) / k, b: (r.bottom - w.top) / k, w: r.width / k };
    };
    const hit = async (sel, fx, fy) => {
      const p = find(sel, fx, fy); if (!p) return null;
      cur.go(p.x, p.y); await sleep(680); if (!ok()) return null;
      await cur.click(p.x, p.y, sleep); return p;
    };
    const flip = (key) => setVals((s) => ({ ...s, [key]: !s[key] }));
    const pick = async (key, idx, items) => {
      const p = await hit(`[data-ctl="${key}"]`, 0.5, 0.65); if (!p || !ok()) return;
      setDd({ x: p.l, y: p.b - 4, w: p.w, items }); await sleep(550); if (!ok()) return;
      const x = p.l + p.w / 2, y = p.b - 4 + 6 + idx * 28 + 14;
      cur.go(x, y); await sleep(680); if (!ok()) return; await cur.click(x, y, sleep);
      setVals((s) => ({ ...s, [key]: items[idx] })); setDd(null); await sleep(450);
    };
    const goTab = async (i) => { if (!(await hit(`[data-tab="${i}"]`, 0.5, 0.5)) || !ok()) return false; setTab(i); setScroll(0); await sleep(600); return ok(); };

    await sleep(700);
    while (ok()) {
      setTab(0); setVals(menuDefaults()); setDd(null); setScroll(0); setHide(false); cur.go(520, 215); await sleep(900); if (!ok()) return;
      // General: สวิตช์ + สไลเดอร์ + เลื่อนหน้า + ดรอปดาวน์
      if (!(await hit('[data-ctl="General:AutoFarm Coin"]', 0.88, 0.5))) return; flip('General:AutoFarm Coin'); await sleep(500); if (!ok()) return;
      const p1 = find('[data-ctl="General:Farm Speed"] .in-wtr', 0.9, 0.5), p0 = find('[data-ctl="General:Farm Speed"] .in-wtr', 0.55, 0.5);
      if (!p0 || !p1) return;
      cur.go(p0.x, p0.y); await sleep(680); if (!ok()) return; await cur.click(p0.x, p0.y, sleep);
      cur.go(p1.x, p1.y);
      for (let v = 22; v <= 28; v++) { setVals((s) => ({ ...s, 'General:Farm Speed': v })); await sleep(85); }
      await sleep(500); if (!ok()) return;
      await pick('General:Select Player', 1, ['Player1', 'Player2']); if (!ok()) return;
      // Combat
      if (!(await goTab(1))) return;
      if (!(await hit('[data-ctl="Combat:Kill All"]', 0.88, 0.5))) return; flip('Combat:Kill All'); await sleep(500); if (!ok()) return;
      await pick('Combat:Shoot Mode', 1, ['Wallbang', 'Silent Aim']); if (!ok()) return; await sleep(900); if (!ok()) return;
      // ปิด/เปิดเมนู
      cur.go(520, 215); setHide(true); await sleep(1500); if (!ok()) return; setHide(false); await sleep(1800);
    }
  });

  return (
    <div ref={wrap} className="in-wrap" style={at(0, 0, W, 372)}>
      <div ref={win} className={'in-win' + (hide ? ' hide' : '')}>
        <div className="in-wside">
          <div className="in-wbrand"><b>Realize</b><em>v.4.0.0</em></div>
          {MENU.map(([n, ic], i) => <div key={n} data-tab={i} className={'in-wtb' + (i === tab ? ' on' : '')}><b><Ico n={ic} /></b>{n}</div>)}
        </div>
        <div className="in-wc">
          <div className="in-wci" key={tab} style={{ transform: `translateY(${-scroll}px)` }}>
            {MENU[tab][2].map((col, ci) => (
              <div className="in-wcol" key={ci}>
                {col.map(([title, ctls]) => (
                  <div className="in-wg" key={title}>
                    <h4>{GI[title] && <Ico n={GI[title]} />}{title}</h4>
                    {ctls.map((c) => <Ctl key={c[1]} tab={MENU[tab][0]} c={c} vals={vals} />)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <i className={'in-wtab' + (hide ? ' on' : '')} />
      {dd && <div className="in-wdd" style={{ left: dd.x, top: dd.y, width: dd.w }}>{dd.items.map((it) => <span key={it}>{it}</span>)}</div>}
      {cur.node}
      <div className="in-links" style={at(0, 332, W, 38)}>
        <a className="in-lk primary" href="/home">เข้าสู่หน้าเว็บ</a>
        <a className="in-lk" href="/getkey">รับคีย์</a>
      </div>
      <h2 className="in-t sm" style={at(40, 262, W - 80, 24)}>Open and close</h2>
      <p className="in-b sm" style={at(60, 288, W - 120, 36)}>{`Press ${CFG.keyName}, or click the little arrow, to slide the menu into the edge. Press ${CFG.keyName} again or click the tab to bring it back.`}</p>
    </div>
  );
}

function P6({ accent, setAccent }) {
  const list = Object.keys(TINT), size = 52, gap = 14, x0 = (W - (list.length * size + (list.length - 1) * gap)) / 2;
  return (
    <>
      <h2 className="in-t left" style={at(48, 16, W - 96, 30)}>Pick your look</h2>
      <p className="in-b left" style={at(48, 52, W - 96, 40)}>Choose a color for {CFG.name}. Change it anytime in Settings.</p>
      {list.map((nm, i) => (
        <button key={nm} type="button" aria-label={nm} className={'in-sw' + (accent === nm ? ' on' : '')}
          style={{ ...at(x0 + i * (size + gap), 112, size, size), background: TINT[nm][1] }} onClick={() => setAccent(nm)} />
      ))}
    </>
  );
}

function P7({ set, setSet }) {
  const rows = [['autoHide', 'Auto-hide bar'], ['startCollapsed', 'Start tucked in'], ['toasts', 'Toast messages'], ['antiAfk', 'Anti-AFK on start']];
  const gw = (W - 96 - 10) / 2;
  return (
    <>
      <h2 className="in-t left" style={at(48, 16, W - 96, 30)}>Set it up</h2>
      <p className="in-b left" style={at(48, 52, W - 96, 40)}>Choose what shows up. You can change all of this later in Settings.</p>
      {rows.map(([k, t], i) => (
        <button key={k} type="button" className="in-glass in-row" style={at(48 + (i % 2) * (gw + 10), 98 + Math.floor(i / 2) * 54, gw, 44)}
          onClick={() => setSet({ ...set, [k]: !set[k] })}><span>{t}</span><Tg on={set[k]} /></button>
      ))}
    </>
  );
}

function P8() {
  return (
    <>
      <div className="in-done" style={{ left: W / 2 - 44, top: 20 }}><span>✓</span></div>
      <Head t="You're all set" b={`Press ${CFG.keyName} whenever you need ${CFG.name}. Have fun out there.`} />
    </>
  );
}

export default function Intro() {
  const router = useRouter();
  const [page, setPage] = useState(1), [dir, setDir] = useState(1), [closing, setClosing] = useState(false);
  const [accent, setAccent] = useState('white');
  const [set, setSet] = useState({ autoHide: false, startCollapsed: false, toasts: true, antiAfk: false });
  const [s, setS] = useState(1);
  const N = 6;

  useEffect(() => {
    const fit = () => setS(Math.min(1, Math.max(0.55, Math.min((innerWidth - 32) / W, (innerHeight - 40) / HMAX))));
    fit(); addEventListener('resize', fit); return () => removeEventListener('resize', fit);
  }, []);
  useEffect(() => { try { const a = localStorage.getItem('hubx-accent-v2'); if (TINT[a]) setAccent(a); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem('hubx-accent-v2', accent); } catch {} }, [accent]);

  const finish = () => { if (closing) return; setClosing(true); setTimeout(() => { window.location.assign('/home'); }, 450); };
  const go = (n) => { if (closing || n < 1 || n > N || n === page) return; setDir(n > page ? 1 : -1); setPage(n); };
  const next = () => (page >= N ? finish() : go(page + 1));
  const back = () => go(page - 1);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Enter' || e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
      else if (e.key === 'Escape') finish();
    };
    addEventListener('keydown', h); return () => removeEventListener('keydown', h);
  });

  const [a1, a2] = TINT[accent];
  const Hp = hFor(page), by = Hp - 70, first = page === 1, last = page === N, nx = first ? 24 : 156;
  const body = [P1, P2, P5][page - 1];
  const View = body ? body : null;

  return (
    <div className={'in-root' + (closing ? ' out' : '')} role="dialog" aria-label="เริ่มต้นใช้งาน">
      <div className="in-fit" style={{ width: W * s, height: HMAX * s }}>
        <div className="in-card" style={{ width: W, height: Hp, top: ((HMAX - Hp) / 2) * s, transform: `scale(${s})`, '--a1': a1, '--a2': a2 }}>
          <div className="in-glow" />
          <div className="in-stage" key={page} style={{ height: Hp - 148 }}>
            <div className={'in-page ' + (dir > 0 ? 'fw' : 'bw')}>
              {View && <View />}
              {page === 4 && <P6 accent={accent} setAccent={setAccent} />}
              {page === 5 && <P7 set={set} setSet={setSet} />}
              {page === 6 && <P8 />}
            </div>
          </div>
          {!last && <button type="button" className="in-skip" onClick={finish}>Skip</button>}
          <div className="in-dots" style={{ top: by - 26 }}>{Array.from({ length: N }, (_, i) => <i key={i} className={i + 1 === page ? 'on' : ''} />)}</div>
          <button type="button" className={'in-back' + (first ? ' off' : '')} tabIndex={first ? -1 : 0} style={{ top: by }} onClick={back}>Back</button>
          {last
            ? <a className="in-next" href="/home" style={{ top: by, left: nx, width: W - nx - 24 }}>Get started</a>
            : <button type="button" className="in-next" style={{ top: by, left: nx, width: W - nx - 24 }} onClick={next}>{first ? 'เริ่มต้นใช้งาน' : 'Continue'}</button>}
        </div>
      </div>
    </div>
  );
}
