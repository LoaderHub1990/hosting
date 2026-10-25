// บริการ obfuscate เดี่ยว ๆ สำหรับรันบน VPS (Vercel รัน Prometheus/LuaJIT ไม่ได้)
//   OBF_REMOTE_TOKEN=รหัสยาวๆ OBF_SERVICE_PORT=8787 npm run obf-service
// แล้วตั้งฝั่ง Vercel:  OBF_REMOTE_URL=https://obf.โดเมนคุณ/obfuscate  OBF_REMOTE_TOKEN=รหัสเดียวกัน   (ควรวางหลัง HTTPS reverse proxy)
import http from 'node:http';
import crypto from 'node:crypto';
import { obfuscate, VALID_PRESETS, findPrometheus } from '../lib/obf.js';

const TOKEN = process.env.OBF_REMOTE_TOKEN || '';
const MAX = Number(process.env.OBF_MAX_BYTES || 512_000);
if (TOKEN.length < 24) { console.error('ตั้ง OBF_REMOTE_TOKEN ให้ยาวอย่างน้อย 24 ตัวอักษร'); process.exit(1); }
const eq = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/obfuscate') return send(res, 404, { ok: false });
  if (!eq((req.headers.authorization || '').replace(/^Bearer /, ''), TOKEN)) return send(res, 401, { ok: false });
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > MAX + 4096) return send(res, 413, { ok: false, error: 'too_large' }); chunks.push(c); }
  let b; try { b = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res, 400, { ok: false }); }
  if (typeof b.source !== 'string' || !VALID_PRESETS.includes(b.preset)) return send(res, 400, { ok: false, error: 'bad_request' });
  if (!findPrometheus()) return send(res, 503, { ok: false });
  try { send(res, 200, { ok: true, result: await obfuscate(b.source, b.preset, b.luaTarget) }); }
  catch (e) { send(res, e.status || 500, { ok: false, error: e.message }); }
}).listen(Number(process.env.OBF_SERVICE_PORT || 8787), () => console.log('obf-service พร้อมที่พอร์ต', process.env.OBF_SERVICE_PORT || 8787));
