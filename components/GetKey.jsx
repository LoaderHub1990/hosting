'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, CopyBtn, useToast } from './Fx';

const TOTAL = 5;
const LS = 'getkey_sid';
const ERR = {
  too_fast: 'เร็วเกินไป — ต้องทำ Checkpoint ให้เสร็จจริงก่อน',
  invalid_checkpoint: 'ลิงก์ไม่ถูกต้อง กรุณากดปุ่ม Checkpoint ใหม่',
  expired: 'หมดเวลา กรุณากดใหม่',
  bypass_detected: 'ตรวจพบการข้ามขั้นตอน กรุณาทำใหม่',
  verify_failed: 'ตรวจสอบไม่สำเร็จ ลองใหม่อีกครั้ง',
  rate_limited: 'ลองถี่เกินไป รอสักครู่',
  link_not_set: 'ระบบยังไม่ได้ตั้งลิงก์ ติดต่อแอดมิน',
  invalid_session: 'เซสชันหมดอายุ กรุณารีเฟรช',
  not_finished: 'ยังทำไม่ครบทุก Checkpoint',
  daily_limit: 'วันนี้รับคีย์ครบโควตาแล้ว ลองใหม่พรุ่งนี้',
};
const store = {
  get: () => { try { return localStorage.getItem(LS); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(LS, v); } catch {} },
  del: () => { try { localStorage.removeItem(LS); } catch {} },
};

async function post(path, body) {
  const r = await fetch('/getkey/api/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || String(r.status));
  return d;
}

export default function GetKey() {
  const toast = useToast();
  const [sid, setSid] = useState(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState({ t: '', ok: false });
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const [key, setKey] = useState(null);
  const started = useRef(false);

  const fail = useCallback((e, fallback) => setMsg({ t: ERR[e?.message] || `${fallback} (${e?.message || '?'})`, ok: false }), []);

  useEffect(() => {
    if (started.current) return; started.current = true; // กัน Strict Mode เรียกซ้ำ
    (async () => {
      try {
        const d = await post('session', { sid: store.get() });
        setSid(d.sid); setProgress(d.progress); store.set(d.sid);
        const q = new URLSearchParams(location.search), nonce = q.get('cp');
        if (nonce) {
          history.replaceState(null, '', location.pathname);
          setMsg({ t: 'กำลังตรวจสอบ Checkpoint...', ok: true });
          try { const r = await post('cp/done', { sid: d.sid, nonce, hash: q.get('hash') || '' }); setProgress(r.progress); setMsg({ t: '', ok: false }); toast.ok('Checkpoint สำเร็จ', `${r.progress} / ${TOTAL}`); }
          catch (e) { fail(e, 'ยืนยันไม่สำเร็จ'); }
        }
      } catch { setMsg({ t: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองรีเฟรช', ok: false }); }
      setBooting(false);
    })();
  }, [fail, toast]);

  const go = async () => {
    if (busy) return; setBusy(true); setMsg({ t: '', ok: false });
    try { const d = await post('cp/go', { sid }); location.href = d.url; }
    catch (e) { fail(e, 'เกิดข้อผิดพลาด'); setBusy(false); }
  };
  const claim = async () => {
    if (busy) return; setBusy(true); setMsg({ t: '', ok: false });
    try { const d = await post('claim', { sid }); store.del(); setKey(d); toast.ok('รับคีย์สำเร็จ', 'ใช้ได้ 24 ชั่วโมง'); }
    catch (e) { fail(e, 'รับ Key ไม่สำเร็จ'); }
    setBusy(false);
  };

  const phase = key ? 3 : progress >= TOTAL ? 2 : 1;
  return (
    <div className="gk">
      <div className="pagehead">
        <div><span className="badge">ฟรี · 24 ชั่วโมง</span><h1>Get Key</h1><p>ทำ Checkpoint ให้ครบ {TOTAL} ด่าน เพื่อปลดล็อกและรับ Key</p></div>
      </div>
      <div className="stepper" aria-hidden="true">
        {[['Checkpoint', 1], ['Claim', 2], ['Key', 3]].map(([t, n]) => (
          <span key={n} className={phase === n ? 'on' : phase > n ? 'done' : ''}>{phase > n ? <Icon n="check" s={14} sw={2.4} /> : n}. {t}</span>
        ))}
      </div>

      <section className="pn rim glow">
        {key ? (
          <div className="keybox view">
            <span className="big-ic"><Icon n="key" s={28} /></span>
            <h2>Key ของคุณ</h2>
            <div className="key" data-testid="key">{key.key}</div>
            <p className="h-sub"><Icon n="clock" s={13} /> หมดอายุ: {new Date(key.expires).toLocaleString('th-TH', { hour12: false, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <CopyBtn text={key.key} label="คัดลอก Key" className="h-btn primary" />
          </div>
        ) : (
          <>
            <div className="h-row between"><b>ความคืบหน้า</b><span className="badge plain">{progress} / {TOTAL}</span></div>
            <div className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={progress}><i className={progress >= TOTAL ? 'full' : ''} style={{ width: `${(progress / TOTAL) * 100}%` }} /></div>
            <div className="steps">
              {Array.from({ length: TOTAL }, (_, i) => {
                const n = i + 1, st = n <= progress ? 'done' : n === progress + 1 ? 'now' : 'lock';
                return (
                  <div key={n} className={`step rim ${st}`}>
                    <span className="n">{st === 'done' ? <Icon n="check" s={16} sw={2.6} /> : st === 'lock' ? <Icon n="lock" s={14} /> : n}</span>
                    <span className="tx"><b>Checkpoint {n}</b><em>{st === 'done' ? 'สำเร็จ' : st === 'now' ? 'กดปุ่มเพื่อทำต่อ' : 'ล็อกอยู่'}</em></span>
                    {st === 'now' && progress < TOTAL ? (
                      <button className="h-btn primary sm rp go-btn" onClick={go} disabled={busy || booting}>{progress === TOTAL - 1 ? 'Final' : 'Start'}<Icon n="arrow" s={14} /></button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {progress >= TOTAL && (
              <button className="h-btn good wide rp" style={{ marginTop: 16 }} onClick={claim} disabled={busy}><Icon n="key" s={16} />Claim Key</button>
            )}
            <p className={'msg' + (msg.ok ? ' ok' : '')} role="status">{msg.t}</p>
          </>
        )}
      </section>
      <p className="h-sub" style={{ textAlign: 'center', marginTop: 16 }}>1 เซสชัน = 1 คีย์ · คีย์ใช้ได้ 24 ชั่วโมง นับจากเวลาที่รับ</p>
    </div>
  );
}
