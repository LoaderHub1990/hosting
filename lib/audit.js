import fs from 'node:fs';
import path from 'node:path';
import { dataDir } from './db.js';
import { kv, kvOn } from './kv.js';

// บันทึกเหตุการณ์ความปลอดภัย (ไม่เก็บรหัส/คีย์เต็ม)
//  • มี Redis → เก็บใน list `hub:audit` (500 รายการล่าสุด)  • ไม่มี → ไฟล์ JSON ต่อบรรทัด หมุนไฟล์เมื่อเกิน 1MB
const MAX = 1024 * 1024;
const clean = (v) => (typeof v === 'string' ? v.replace(/[\r\n\t]/g, ' ').slice(0, 200) : v);

export function audit(event, data = {}) {
  const rec = { t: new Date().toISOString(), e: event };
  for (const [k, v] of Object.entries(data)) rec[k] = clean(v);
  if (kvOn()) { // ไม่รอผล (fire-and-forget) แต่กัน error หลุด
    kv('LPUSH', 'hub:audit', JSON.stringify(rec)).then(() => kv('LTRIM', 'hub:audit', 0, 499)).catch(() => {});
    return;
  }
  try {
    const dir = dataDir();
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'audit.log');
    try { if (fs.statSync(file).size > MAX) fs.renameSync(file, file + '.1'); } catch {}
    fs.appendFile(file, JSON.stringify(rec) + '\n', { mode: 0o600 }, () => {});
  } catch {}
}

export async function readAudit(limit = 100) {
  const parse = (l) => { try { return JSON.parse(l); } catch { return null; } };
  if (kvOn()) {
    try { return ((await kv('LRANGE', 'hub:audit', 0, limit - 1)) || []).map(parse).filter(Boolean); } catch { return []; }
  }
  try {
    const lines = fs.readFileSync(path.join(dataDir(), 'audit.log'), 'utf8').trim().split('\n').slice(-limit);
    return lines.map(parse).filter(Boolean).reverse();
  } catch { return []; }
}
