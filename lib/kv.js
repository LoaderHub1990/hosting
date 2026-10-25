// ไคลเอนต์ Upstash Redis (REST) — ไม่ต้องติดตั้งแพ็กเกจเพิ่ม ใช้ได้ทั้ง Node และ Edge
// ตั้งค่าผ่าน Vercel Marketplace → Upstash Redis จะได้ env KV_REST_API_URL / KV_REST_API_TOKEN (หรือ UPSTASH_REDIS_REST_*) ให้เอง
const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const tok = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
export const kvOn = () => !!(url() && tok());

async function call(path, body) {
  const r = await fetch(url().replace(/\/+$/, '') + path, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('kv_http_' + r.status);
  return d;
}
/** kv('GET', key) → ผลลัพธ์ของคำสั่งเดียว */
export async function kv(...args) {
  const d = await call('/', args.map(String));
  if (d.error) throw new Error('kv: ' + d.error);
  return d.result;
}
/** kvPipe([['INCR','a'],['GET','b']]) → [ผลลัพธ์, ...] (ส่งครั้งเดียว) */
export async function kvPipe(cmds) {
  const d = await call('/pipeline', cmds.map((c) => c.map(String)));
  return d.map((x) => { if (x.error) throw new Error('kv: ' + x.error); return x.result; });
}
export const pairs = (flat) => { const o = {}; for (let i = 0; i < (flat || []).length; i += 2) o[flat[i]] = flat[i + 1]; return o; };
