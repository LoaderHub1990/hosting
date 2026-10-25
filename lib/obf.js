import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import { num } from './env.js';

export const VALID_PRESETS = ['Minify', 'Weak', 'Medium', 'Strong', 'Vmify', 'LuauLight', 'LuauMedium', 'LuauStrong'];
const PROM_DIR = path.resolve('.prometheus');

const has = (bin) => { try { return cp.spawnSync('which', [bin], { stdio: 'ignore' }).status === 0; } catch { return false; } };
const firstExisting = (list) => list.find((p) => p && fs.existsSync(p));

function findLua() {
  for (const b of ['luajit', 'lua5.1', 'lua5.4', 'lua']) if (has(b)) return b;
  const local = firstExisting([path.join(PROM_DIR, 'LuaJIT-2.1', 'src', 'luajit'), path.join(PROM_DIR, 'luajit'), path.resolve('.luajit', 'bin', 'luajit'), path.resolve('.luajit', 'luajit')]);
  if (local) { try { fs.chmodSync(local, 0o755); } catch {} return local; }
  return null;
}
export function findCli() {
  return firstExisting([process.env.PROMETHEUS_PATH, path.join(PROM_DIR, 'cli.lua'), path.join(PROM_DIR, 'Prometheus-master', 'cli.lua'), path.join(PROM_DIR, 'Prometheus', 'cli.lua')]);
}
/** คืน { bin, prefix } หรือ null ถ้ายังไม่พร้อม */
export function findPrometheus() {
  if (has('prometheus-lua')) return { bin: 'prometheus-lua', prefix: [] };
  const cli = findCli(), lua = findLua();
  return cli && lua ? { bin: lua, prefix: [cli] } : null;
}
export const remoteOn = () => !!process.env.OBF_REMOTE_URL;
export const diagnose = () => ({ cli: findCli() || null, lua: findLua() || null, binary: has('prometheus-lua') });

// จำกัดงานพร้อมกัน (ตัวทำ obfuscate กิน CPU) — เกินแล้วบอกให้ลองใหม่ แทนที่จะปล่อยให้เครื่องล่ม
let running = 0;
async function remote(source, preset, luaTarget) {
  let r;
  try {
    r = await fetch(process.env.OBF_REMOTE_URL, {
      method: 'POST', signal: AbortSignal.timeout(55_000), cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OBF_REMOTE_TOKEN || ''}` },
      body: JSON.stringify({ source, preset, luaTarget }),
    });
  } catch { throw Object.assign(new Error('obfuscator_not_available'), { status: 503 }); }
  const d = await r.json().catch(() => ({}));
  if (r.status === 429) throw Object.assign(new Error('busy'), { status: 429 });
  if (!r.ok || !d.ok || typeof d.result !== 'string') throw Object.assign(new Error(r.status >= 500 ? 'obfuscator_not_available' : 'obfuscate_failed'), { status: r.status >= 500 ? 503 : 400 });
  return d.result;
}

export async function obfuscate(source, preset, luaTarget) {
  if (remoteOn()) return remote(source, preset, luaTarget);
  const tool = findPrometheus();
  if (!tool) throw Object.assign(new Error('obfuscator_not_available'), { status: 503 });
  if (running >= num('OBF_MAX_CONCURRENT', 2)) throw Object.assign(new Error('busy'), { status: 429 });
  running++;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prom_'), { mode: 0o700 });
  const inFile = path.join(dir, 'in.lua'), outFile = path.join(dir, 'out.lua');
  try {
    fs.writeFileSync(inFile, source, { encoding: 'utf8', mode: 0o600 });
    const target = /^lua51$/i.test(luaTarget || '') ? '--Lua51' : '--LuaU';
    const args = [...tool.prefix, '--preset', preset, '--out', outFile, target, '--nocolors', inFile];
    await new Promise((resolve, reject) => {
      // args เป็น array (ไม่ผ่าน shell) → ฉีดคำสั่งไม่ได้ และมี timeout + จำกัด memory ของ output
      const proc = cp.spawn(tool.bin, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: 60_000, killSignal: 'SIGKILL', cwd: dir });
      let err = '';
      proc.stderr.on('data', (d) => { if (err.length < 4000) err += d; });
      proc.on('error', () => reject(Object.assign(new Error('obfuscate_failed'), { status: 500 })));
      proc.on('close', (code) => (code === 0 ? resolve() : reject(Object.assign(new Error('obfuscate_failed'), { status: 400, detail: err.slice(0, 500) }))));
    });
    if (!fs.existsSync(outFile)) throw Object.assign(new Error('obfuscate_failed'), { status: 500 });
    const result = fs.readFileSync(outFile, 'utf8');
    return `--[[ v.1.0 https://128bit.online/obfuscate ]]\n${result}`;
  } finally {
    running--;
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}
export const _id = () => crypto.randomBytes(4).toString('hex');
