'use client';
import { useEffect, useRef, useState } from 'react';

// ตัวเลขวิ่งขึ้นแบบนุ่ม ๆ (เคารพ prefers-reduced-motion)
export default function CountUp({ to = 0, ms = 900 }) {
  const [v, setV] = useState(to);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    const a = from.current, t0 = performance.now();
    let raf;
    const f = (t) => {
      const k = Math.min((t - t0) / ms, 1), e = 1 - Math.pow(1 - k, 4);
      setV(Math.round(a + (to - a) * e));
      if (k < 1) raf = requestAnimationFrame(f); else from.current = to;
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{v.toLocaleString('th-TH')}</>;
}
