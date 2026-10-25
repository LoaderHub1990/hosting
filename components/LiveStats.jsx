'use client';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Fx';
import CountUp from './CountUp';

const dkey = (off, today) => { const d = new Date(today + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - off); return d.toISOString().slice(0, 10); };

export default function LiveStats({ initial }) {
  const [s, setS] = useState(initial);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try { const r = await fetch('/api/pub/stats', { cache: 'no-store' }); if (!r.ok) throw 0; const d = await r.json(); if (alive) { setS(d); setErr(false); } }
      catch { if (alive) setErr(true); }
    };
    const t = setInterval(load, 30_000); return () => { alive = false; clearInterval(t); };
  }, []);

  const { series, avg, max } = useMemo(() => {
    const arr = Array.from({ length: 30 }, (_, i) => { const k = dkey(29 - i, s.today); return { k, v: s.days?.[k] || 0 }; });
    return { series: arr, avg: Math.round(arr.reduce((a, b) => a + b.v, 0) / 30), max: Math.max(1, ...arr.map((x) => x.v)) };
  }, [s]);
  const today = s.days?.[s.today] || 0, yest = s.days?.[dkey(1, s.today)] || 0;

  return (
    <>
      <div className="h-stats">
        {[['play', 'รันทั้งหมด', s.total], ['zap', 'วันนี้', today], ['clock', 'เมื่อวาน', yest], ['activity', 'เฉลี่ยต่อวัน', avg]].map(([ic, l, v]) => (
          <div key={l} className="h-stat glow rim"><span className="si"><Icon n={ic} s={17} /></span><b><CountUp to={v} /></b><em>{l}</em></div>
        ))}
      </div>
      <section className="pn rim" style={{ marginTop: 16 }}>
        <div className="pn-h"><h3><Icon n="chart" s={18} />30 วันล่าสุด</h3><span className="h-sub">{err ? 'รีเฟรชไม่สำเร็จ' : 'รีเฟรชอัตโนมัติทุก 30 วินาที'}</span></div>
        <div className="bars" role="img" aria-label="กราฟจำนวนการรันสคริปต์ 30 วันล่าสุด">
          {series.map((d) => <div key={d.k} className={'b' + (d.k === s.today ? ' today' : '')}><span>{d.k.slice(5)} · {d.v.toLocaleString()}</span><i style={{ height: `${Math.max(2, (d.v / max) * 100)}%` }} /></div>)}
        </div>
        <div className="axis"><span>{series[0].k.slice(5)}</span><span>{series[29].k.slice(5)}</span></div>
      </section>
    </>
  );
}
