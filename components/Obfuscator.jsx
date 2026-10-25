'use client';
import { useRef, useState } from 'react';
import { Icon, CopyBtn, useToast } from './Fx';

const PRESETS = [
  ['Minify', 'ย่อโค้ดอย่างเดียว'], ['Weak', 'ซ่อนเบา ๆ'], ['Medium', 'สมดุล (แนะนำ)'], ['Strong', 'เข้มสุดแบบ Lua'],
  ['Vmify', 'แปลงเป็น VM'], ['LuauLight', 'Luau · เบา'], ['LuauMedium', 'Luau · กลาง'], ['LuauStrong', 'Luau · แรง'],
];
const ERR = {
  rate_limited: 'ลองถี่เกินไป รอสักครู่แล้วลองใหม่', too_large: 'ไฟล์ใหญ่เกิน 500KB', 'missing source': 'กรุณาวางโค้ดก่อน',
  obfuscator_not_available: 'ระบบ obfuscator ปิดปรับปรุงชั่วคราว', busy: 'ตอนนี้คิวเต็ม ลองใหม่ในอีกสักครู่', obfuscate_failed: 'โค้ดมีข้อผิดพลาด หรือ obfuscate ไม่สำเร็จ',
};

export default function Obfuscator() {
  const toast = useToast();
  const [src, setSrc] = useState('');
  const [out, setOut] = useState('');
  const [preset, setPreset] = useState('Medium');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ t: '', k: '' });
  const file = useRef(null);

  const run = async () => {
    if (!src.trim()) { setStatus({ t: 'กรุณาวางโค้ดก่อน', k: 'bad' }); return; }
    setBusy(true); setStatus({ t: 'กำลังประมวลผล...', k: '' });
    try {
      const r = await fetch('/api/obfuscate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: src, preset }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setStatus({ t: ERR[d.error] || `ผิดพลาด (${d.error || r.status})`, k: 'bad' }); }
      else { setOut(d.result); setStatus({ t: 'เสร็จแล้ว — คัดลอกหรือดาวน์โหลดไฟล์ได้เลย', k: 'ok' }); toast.ok('Obfuscate สำเร็จ', `×${(d.size / src.length).toFixed(2)}`); }
    } catch { setStatus({ t: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง', k: 'bad' }); }
    setBusy(false);
  };
  const onFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 512_000) { setStatus({ t: ERR.too_large, k: 'bad' }); return; }
    const r = new FileReader(); r.onload = () => setSrc(String(r.result || '')); r.readAsText(f); e.target.value = '';
  };
  const download = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
    a.download = 'obfuscated.lua'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <>
      <div className="pagehead"><div><span className="badge">Prometheus</span><h1>Lua Obfuscator</h1><p>ป้องกันโค้ด Lua / Luau ของคุณก่อนเผยแพร่ — ประมวลผลบนเซิร์ฟเวอร์ ไม่เก็บโค้ดของคุณ</p></div></div>

      <section className="pn rim">
        <div className="pn-h"><h3><Icon n="shield" s={18} />เลือกระดับการป้องกัน</h3></div>
        <div className="presets" role="radiogroup">
          {PRESETS.map(([k, d]) => (
            <button key={k} role="radio" aria-checked={preset === k} className={'preset rp glow' + (preset === k ? ' on' : '')} onClick={() => setPreset(k)}><b>{k}</b><em>{d}</em></button>
          ))}
        </div>
      </section>

      <div className="obf-grid" style={{ marginTop: 16 }}>
        <section className="pn rim">
          <div className="pn-h"><h3><Icon n="code" s={18} />โค้ดต้นฉบับ</h3>
            <div className="h-row"><button className="h-btn ghost sm rp" onClick={() => file.current?.click()}><Icon n="upload" s={14} />เลือกไฟล์</button><button className="h-btn ghost sm rp" onClick={() => setSrc('')}><Icon n="trash" s={14} />ล้าง</button></div>
            <input ref={file} type="file" accept=".lua,.txt,text/plain" hidden onChange={onFile} />
          </div>
          <textarea value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} placeholder="-- วางโค้ด Lua ที่นี่" aria-label="โค้ดต้นฉบับ" maxLength={600000} />
          <div className="meter" style={{ marginTop: 10 }}>{src.length.toLocaleString()} chars</div>
        </section>
        <section className="pn rim">
          <div className="pn-h"><h3><Icon n="lock" s={18} />ผลลัพธ์</h3>
            <div className="h-row">{out ? <><CopyBtn text={out} label="คัดลอก" /><button className="h-btn ghost sm rp" onClick={download}><Icon n="download" s={14} />ดาวน์โหลด</button></> : null}</div>
          </div>
          {out ? <pre className="out" tabIndex={0}>{out}</pre> : <div className="h-empty" style={{ minHeight: 360, justifyContent: 'center' }}><Icon n="lock" s={30} /><b>ยังไม่มีผลลัพธ์</b><span>วางโค้ดแล้วกด Obfuscate</span></div>}
          {out ? <div className="meter" style={{ marginTop: 10 }}>{out.length.toLocaleString()} chars · ×{(out.length / Math.max(src.length, 1)).toFixed(2)}</div> : null}
        </section>
      </div>

      <div className="h-row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
        <span className={'msg' + (status.k === 'ok' ? ' ok' : '')} style={{ margin: 0, color: status.k === 'bad' ? 'var(--bad)' : undefined }} role="status">{status.t}</span>
        <button className="h-btn primary rp" onClick={run} disabled={busy}><Icon n={busy ? 'refresh' : 'shield'} s={16} />{busy ? 'Obfuscating...' : 'Obfuscate'}</button>
      </div>
    </>
  );
}
