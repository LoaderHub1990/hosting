import path from 'node:path';
import cp from 'node:child_process';
import { findPrometheus } from './obf.js';

export function bootChecks() {
  const prod = process.env.NODE_ENV === 'production';
  const warn = (m) => console.warn('⚠️  [security] ' + m);
  if ((process.env.TOKEN_SECRET || '').length < 32) {
    (prod ? console.error : warn)('❌ [security] TOKEN_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร — ระบบล็อกอิน/คีย์จะใช้งานไม่ได้จนกว่าจะตั้งค่า');
  }
  if (prod && !process.env.ADMIN_SECRET) warn('ยังไม่ได้ตั้ง ADMIN_SECRET แยกจาก TOKEN_SECRET (แนะนำให้ตั้ง)');
  if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length < 16) warn('ADMIN_SECRET สั้นเกินไป (ควร ≥ 16 ตัวอักษร)');
  if (process.env.VERCEL && !(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) console.error('❌ [vercel] ยังไม่ได้เชื่อม Upstash Redis — ข้อมูลคีย์/เซสชัน/rate limit จะไม่คงอยู่บน Vercel (ดู README หัวข้อ Vercel)');
  if (prod && !(process.env.BASE_URL || '').startsWith('https://')) warn('BASE_URL ไม่ใช่ https:// — cookie แอดมิน/CSP upgrade-insecure-requests จะไม่เข้มงวดเต็มที่');
  if (prod && !process.env.LV_ANTIBYPASS_TOKEN) warn('ยังไม่ได้ตั้ง LV_ANTIBYPASS_TOKEN — Get Key อาจถูก bypass ได้ง่ายขึ้น');

  // ติดตั้ง Prometheus เบื้องหลังถ้ายังไม่มี (ไม่บล็อกการเริ่มเซิร์ฟเวอร์) — ปิดด้วย OBF_AUTO_INSTALL=0
  if (!process.env.VERCEL && process.env.OBF_AUTO_INSTALL !== '0' && !process.env.OBF_REMOTE_URL && !findPrometheus()) {
    try {
      const p = cp.spawn(process.execPath, [path.resolve('scripts/install-prometheus.mjs')], { stdio: 'inherit', detached: true });
      p.on('error', () => {}); p.unref();
    } catch {}
  }
}
