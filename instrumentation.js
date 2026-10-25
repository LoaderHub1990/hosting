// รันครั้งเดียวตอนเซิร์ฟเวอร์เริ่ม (Node เท่านั้น)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { bootChecks } = await import('./lib/boot.js');
    bootChecks();
  }
}
