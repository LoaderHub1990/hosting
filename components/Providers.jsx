'use client';
import { Backdrop, Cursor, ToastProvider } from './Fx';

// พื้นหลัง + เมาส์แบบกำหนดเอง + Toast ครอบทุกหน้า (สไตล์เดียวกับแดชบอร์ด Flexozy)
export default function Providers({ children }) {
  return (
    <ToastProvider>
      <div className="hb">
        <Backdrop />
        <Cursor />
        {children}
      </div>
    </ToastProvider>
  );
}
