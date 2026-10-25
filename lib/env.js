// อ่านค่า env แบบ lazy (ตอน build ยังไม่มี .env จึงต้องไม่ throw ตอน import)
export const isProd = process.env.NODE_ENV === 'production';

export function secret() {
  const s = process.env.TOKEN_SECRET || '';
  if (s.length >= 32) return s;
  if (isProd) throw new Error('TOKEN_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร (ดู .env.example)');
  return s || 'dev-only-insecure-secret-do-not-use-in-production-0123456789';
}
export function adminSecret() {
  const s = process.env.ADMIN_SECRET || '';
  if (s) return s;
  return secret();
}
export const baseUrl = () => (process.env.BASE_URL || 'https://128bit.online').replace(/\/+$/, '');
// cookie แบบ Secure (+ prefix __Host-) ใช้ได้เฉพาะ HTTPS — ตั้ง COOKIE_SECURE=0 ถ้ารันผ่าน http จริงๆ
export const secureCookies = () => (process.env.COOKIE_SECURE != null ? process.env.COOKIE_SECURE === '1' : isProd);
export const num = (name, d) => { const v = Number(process.env[name]); return Number.isFinite(v) && v > 0 ? v : d; };
