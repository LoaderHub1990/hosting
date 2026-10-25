'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mark } from './Logo';

// ทำซ้ำอินโทรของสคริปต์ Lua (Flexozy X) ให้เหมือนเป๊ะ: การ์ดกว้าง 560×400, 8 หน้า, เคอร์เซอร์จำลอง
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

function P4() {
  const [on, setOn] = useState(false), [mode, setMode] = useState('Normal'), [key, setKey] = useState('E'), [flash, setFlash] = useState(false);
  const cur = useCursor(510, 138);
  useAnim(async ({ sleep, ok }) => {
    const step = async (x, y) => { cur.go(x, y); await sleep(600); if (!ok()) return false; await cur.click(x, y, sleep); return true; };
    while (ok()) {
      setOn(false); setMode('Normal'); setKey('E'); cur.go(510, 138); await sleep(500); if (!ok()) return;
      if (!(await step(243, 42))) return; setOn(true); await sleep(700); if (!ok()) return;
      if (!(await step(183, 94))) return; setMode('Wallbang'); await sleep(700); if (!ok()) return;
      if (!(await step(438, 42))) return; setKey('...'); await sleep(600); if (!ok()) return; setKey('Q'); await sleep(500); if (!ok()) return;
      if (!(await step(376, 94))) return; setFlash(true); await sleep(160); setFlash(false); await sleep(1000); if (!ok()) return;
      cur.go(510, 138); await sleep(1000);
    }
  });
  return (
    <>
      <div className="in-glass in-panel" style={at(80, 8, 400, 120)}>
        <div className="in-tile" style={at(14, 14, 179, 40)}><span>Enable</span><Tg on={on} /></div>
        <div className="in-tile" style={at(14, 66, 179, 40)}><span>Mode: {mode}</span><em>▾</em></div>
        <div className="in-tile" style={at(207, 14, 179, 40)}><span>Keybind</span><kbd>{key}</kbd></div>
        <div className={'in-tile in-act' + (flash ? ' flash' : '')} style={at(207, 66, 179, 40)}>Action</div>
      </div>
      {cur.node}
      <Head t="Click and tap" b="Switches, dropdowns and key boxes work the way you expect. Click a switch to turn it on, or click a key box and press a new key." />
    </>
  );
}

function P5() {
  const [hide, setHide] = useState(false), [tab, setTab] = useState(false);
  const cur = useCursor(200, 100);
  useAnim(async ({ sleep, ok }) => {
    while (ok()) {
      setHide(false); setTab(false); cur.go(200, 100); await sleep(600); if (!ok()) return;
      cur.go(297, 61); await sleep(650); if (!ok()) return;
      await cur.click(297, 61, sleep); setHide(true); setTab(true); await sleep(500); if (!ok()) return;
      cur.go(317, 61); await sleep(650); if (!ok()) return;
      await cur.click(317, 61, sleep); setTab(false); setHide(false); await sleep(800);
    }
  });
  return (
    <>
      <div className="in-screen" style={at(120, 6, 320, 122)}>
        <div className={'in-sbar' + (hide ? ' hide' : '')}><u /><u /><u /></div>
        <i className={'in-stab' + (tab ? ' on' : '')} />
        {cur.node}
      </div>
      <Head t="Open and close" b={`Press ${CFG.keyName}, or click the little arrow at the bottom of the bar, and it slides into the edge, leaving only a tiny tab. Press ${CFG.keyName} again or click the tab to bring it back.`} />
    </>
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
  const N = 8;

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
  const body = [P1, P2, P3, P4, P5][page - 1];
  const View = body ? body : null;

  return (
    <div className={'in-root' + (closing ? ' out' : '')} role="dialog" aria-label="เริ่มต้นใช้งาน">
      <div className="in-fit" style={{ width: W * s, height: H * s }}>
        <div className="in-card" style={{ width: W, height: H, transform: `scale(${s})`, '--a1': a1, '--a2': a2 }}>
          <div className="in-glow" />
          <div className="in-stage" key={page}>
            <div className={'in-page ' + (dir > 0 ? 'fw' : 'bw')}>
              {View && <View />}
              {page === 6 && <P6 accent={accent} setAccent={setAccent} />}
              {page === 7 && <P7 set={set} setSet={setSet} />}
              {page === 8 && <P8 />}
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
