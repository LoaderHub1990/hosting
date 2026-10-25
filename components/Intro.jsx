'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mark } from './Logo';

// ทำซ้ำอินโทรของสคริปต์ Lua (Flexozy X) ให้เหมือนเป๊ะ: การ์ดกว้าง 560×400, 7 หน้า, เคอร์เซอร์จำลอง
const CFG = { name: '128B!t Hub X', keyName: 'K', prefix: ';' };
const TINT = {
  blue: ['#0d2833', '#40baff'], purple: ['#261c3e', '#a878ff'],
  teal: ['#0e2e28', '#38e0ba'], orange: ['#3e2410', '#ff9632'],
};
const W = 560, H = 400, BY = H - 24 - 46;
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
      <b className={'in-cur' + (c.press ? ' press' : '')} style={{ left: c.x, top: c.y }}>▲</b>
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

function P3() {
  const bw = 380, bh = 52, bx = (W - bw) / 2, runX = bx + bw - 8 - 32, runY = 26 + bh / 2;
  const [typed, setTyped] = useState(''), [typing, setTyping] = useState(false), [res, setRes] = useState(''), [pr, setPr] = useState(false);
  const cur = useCursor(runX + 90, runY + 70);
  useAnim(async ({ sleep, ok }) => {
    const steps = [['fly', 'Fly is on'], ['speed 50', 'Walk speed set to 50']];
    while (ok()) {
      for (const [cmd, out] of steps) {
        if (!ok()) return;
        setTyped(''); setRes(''); await sleep(600); setTyping(true);
        for (let n = 1; n <= cmd.length; n++) { if (!ok()) return; setTyped(cmd.slice(0, n)); await sleep(110); }
        setTyping(false); await sleep(250); if (!ok()) return;
        cur.go(runX, runY); await sleep(550); if (!ok()) return;
        await cur.click(runX, runY, sleep); setPr(true); cur.go(runX + 70, runY + 60);
        setRes(out); await sleep(120); setPr(false); await sleep(1600); setRes(''); await sleep(500);
      }
    }
  });
  return (
    <>
      <div className="in-tile in-bar" style={at(bx, 26, bw, bh)}>
        {typed
          ? <><span className="in-typed">{typed}</span><i className={'in-caret' + (typing ? ' solid' : '')} /></>
          : <><i className={'in-caret' + (typing ? ' solid' : '')} /><span className="in-ph">Run a command</span></>}
        <span className={'in-run' + (pr ? ' press' : '')}>Run</span>
      </div>
      <p className={'in-res' + (res ? ' on' : '')} style={at(0, 92, W, 20)}>{res}</p>
      {cur.node}
      <Head t="Commands" b={`In chat, put ${CFG.prefix} in front of a command, like ${CFG.prefix}fly or ${CFG.prefix}speed 50. Everything is also one tap away in the bar.`} />
    </>
  );
}

// เมนูจริงของสคริปต์ (แท็บ → กลุ่ม → ปุ่มควบคุม)  t=สวิตช์ s=สไลเดอร์ d=ดรอปดาวน์ b=ปุ่ม k=คีย์
const MENU = [
  ['General', '⌂', [
    [['Info', [['b', 'Copy Discord']]], ['Automatic', [['t', 'AutoFarm Coin'], ['s', 'Farm Speed', 10, 30], ['t', 'Anti Fling'], ['b', 'Unlock Camera Zoom'], ['b', 'Unlock All Emotes']]]],
    [['Fling', [['s', 'Fling Timeout', 1, 10], ['d', 'Select Player', ['Player1', 'Player2', 'Player3']], ['b', 'Fling Selected'], ['b', 'Fling All Players'], ['b', 'Fling Murderer'], ['b', 'Fling Sheriff/Hero']]]],
  ]],
  ['Combat', '✦', [
    [['Murder Operations', [['t', 'Kill All'], ['b', 'Kill Sheriff/Hero'], ['t', 'Show Kill All Button'], ['t', 'Show Throw Button']]], ['Keybinds', [['k', 'Shoot Murderer', 'E'], ['k', 'Kill All', 'Q'], ['k', 'Throw Knife', 'F']]]],
    [['Sheriff Operations', [['d', 'Aimlock Target Part', ['HumanoidRootPart', 'Head', 'UpperTorso']], ['t', 'Aimlock Murder'], ['b', 'Grab Gun'], ['t', 'Auto Grab Gun']]], ['Shoot', [['t', 'Show Shoot Button'], ['d', 'Shoot Mode', ['Wallbang', 'Silent Aim']]]]],
  ]],
  ['ESP', '◉', [
    [['ESP', [['t', 'ESP Player'], ['t', 'ESP Murderer'], ['t', 'ESP Sheriff/Hero'], ['t', 'ESP Gun Drop'], ['t', 'ESP Tagname']]]],
    [],
  ]],
  ['Music/Audio', '♪', [
    [['BoomBox / FE Radio', [['d', 'Radio Mode', ['FE Radio', 'Local']], ['s', 'Local Volume', 0, 100], ['t', 'Loop Local Radio'], ['b', 'Play Radio'], ['b', 'Stop Radio']]]],
    [],
  ]],
  ['Local Player', '☺', [
    [['Movement', [['t', 'Speed Boost'], ['s', 'Speed Value', 16, 1000], ['s', 'JumpPower', 50, 500], ['t', 'Infinite Jump'], ['t', 'Noclip']]]],
    [],
  ]],
  ['Teleport', '➤', [
    [['Teleport', [['d', 'Select Player', ['Player1', 'Player2', 'Player3']], ['b', 'TP To Player'], ['b', 'TP To Murderer'], ['b', 'TP To Sheriff/Hero']]]],
    [['Map Teleports', [['b', 'TP To Map'], ['b', 'TP To Lobby']]]],
  ]],
  ['Settings', '⚙', [
    [['Menu', [['k', 'Toggle UI', 'RightControl'], ['d', 'Toggle Button', ['Mobile only', 'Mobile & PC']], ['t', 'Silence Notifications'], ['b', 'Unload UI']]]],
    [['Themes', [['d', 'Theme', ['Mono', 'Midnight', 'Rose']]]]],
  ]],
];
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
      const x = p.l + p.w / 2, y = p.b - 4 + 6 + idx * 22 + 11;
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
      setScroll(58); await sleep(1000); if (!ok()) return; setScroll(0); await sleep(800); if (!ok()) return;
      await pick('General:Select Player', 1, ['Player1', 'Player2', 'Player3']); if (!ok()) return;
      // Combat
      if (!(await goTab(1))) return;
      if (!(await hit('[data-ctl="Combat:Kill All"]', 0.88, 0.5))) return; flip('Combat:Kill All'); await sleep(500); if (!ok()) return;
      await pick('Combat:Shoot Mode', 1, ['Wallbang', 'Silent Aim']); if (!ok()) return;
      // ESP
      if (!(await goTab(2))) return;
      if (!(await hit('[data-ctl="ESP:ESP Player"]', 0.88, 0.5))) return; flip('ESP:ESP Player'); await sleep(450); if (!ok()) return;
      if (!(await hit('[data-ctl="ESP:ESP Murderer"]', 0.88, 0.5))) return; flip('ESP:ESP Murderer'); await sleep(1100); if (!ok()) return;
      // ปิด/เปิดเมนู
      cur.go(520, 215); setHide(true); await sleep(1500); if (!ok()) return; setHide(false); await sleep(1800);
    }
  });

  return (
    <div ref={wrap} className="in-wrap" style={at(0, 0, W, 252)}>
      <div ref={win} className={'in-win' + (hide ? ' hide' : '')}>
        <div className="in-wside">
          <div className="in-wbrand"><b>Realize</b><em>v.4.0.0</em></div>
          {MENU.map(([n, ic], i) => <div key={n} data-tab={i} className={'in-wtb' + (i === tab ? ' on' : '')}><b>{ic}</b>{n}</div>)}
        </div>
        <div className="in-wc">
          <div className="in-wci" key={tab} style={{ transform: `translateY(${-scroll}px)` }}>
            {MENU[tab][2].map((col, ci) => (
              <div className="in-wcol" key={ci}>
                {col.map(([title, ctls]) => (
                  <div className="in-wg" key={title}>
                    <h4>{title}</h4>
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
      <h2 className="in-t sm" style={at(40, 194, W - 80, 22)}>Open and close</h2>
      <p className="in-b sm" style={at(60, 218, W - 120, 34)}>{`Press ${CFG.keyName}, or click the little arrow, to slide the menu into the edge. Press ${CFG.keyName} again or click the tab to bring it back.`}</p>
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
  const [accent, setAccent] = useState('teal');
  const [set, setSet] = useState({ autoHide: false, startCollapsed: false, toasts: true, antiAfk: false });
  const [s, setS] = useState(1);
  const N = 7;

  useEffect(() => {
    const fit = () => setS(Math.min(1, Math.max(0.55, Math.min((innerWidth - 32) / W, (innerHeight - 40) / H))));
    fit(); addEventListener('resize', fit); return () => removeEventListener('resize', fit);
  }, []);
  useEffect(() => { try { const a = localStorage.getItem('hubx-accent'); if (TINT[a]) setAccent(a); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem('hubx-accent', accent); } catch {} }, [accent]);

  const finish = () => { if (closing) return; setClosing(true); setTimeout(() => router.push('/home'), 480); };
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
  const first = page === 1, last = page === N, nx = first ? 24 : 156;
  const body = [P1, P2, P3, P5][page - 1];
  const View = body ? body : null;

  return (
    <div className={'in-root' + (closing ? ' out' : '')} role="dialog" aria-label="เริ่มต้นใช้งาน">
      <div className="in-fit" style={{ width: W * s, height: H * s }}>
        <div className="in-card" style={{ width: W, height: H, transform: `scale(${s})`, '--a1': a1, '--a2': a2 }}>
          <div className="in-glow" />
          <div className="in-stage" key={page}>
            <div className={'in-page ' + (dir > 0 ? 'fw' : 'bw')}>
              {View && <View />}
              {page === 5 && <P6 accent={accent} setAccent={setAccent} />}
              {page === 6 && <P7 set={set} setSet={setSet} />}
              {page === 7 && <P8 />}
            </div>
          </div>
          {!last && <button type="button" className="in-skip" onClick={finish}>Skip</button>}
          <div className="in-dots">{Array.from({ length: N }, (_, i) => <i key={i} className={i + 1 === page ? 'on' : ''} />)}</div>
          <button type="button" className={'in-back' + (first ? ' off' : '')} tabIndex={first ? -1 : 0} onClick={back}>Back</button>
          <button type="button" className="in-next" style={{ left: nx, width: W - nx - 24 }} onClick={next}>{last ? 'Get started' : first ? 'เริ่มต้นใช้งาน' : 'Continue'}</button>
        </div>
      </div>
    </div>
  );
}
