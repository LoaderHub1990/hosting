import fs from 'node:fs';
import path from 'node:path';
import { kv, kvOn } from './kv.js';

// ฐานข้อมูลแบบไฟล์ JSON ที่ "ปลอดภัยต่อการเขียนพร้อมกัน":
//  • คิวเขียนทีละงาน (กัน race เช่น 2 คนผูก HWID พร้อมกัน)
//  • เขียนแบบ atomic (tmp → rename) สิทธิ์ 0600
//  • เช็ก mtime ทุกครั้ง → ถ้าบอท/โปรเซสอื่นแก้ไฟล์เอง ก็อ่านค่าใหม่ให้
export const dataDir = () => path.resolve(process.env.DATA_DIR || './data');

function resolveFile(name) {
  const primary = path.join(dataDir(), name);
  if (!fs.existsSync(primary)) {
    const legacy = path.resolve(name); // ไฟล์จากเว็บเก่าที่รากโปรเจกต์ → ใช้ต่อได้เลย
    if (fs.existsSync(legacy)) return legacy;
  }
  return primary;
}

class Store {
  constructor(name, fallback) {
    this.name = name; this.fallback = fallback;
    this.file = null; this.data = null; this.mtime = 0; this.q = Promise.resolve();
  }
  _load() {
    if (!this.file) { this.file = resolveFile(this.name); fs.mkdirSync(path.dirname(this.file), { recursive: true }); }
    let m = 0;
    try { m = fs.statSync(this.file).mtimeMs; } catch {}
    if (this.data && m === this.mtime) return;
    try { this.data = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { this.data = this.fallback(); }
    this.mtime = m;
  }
  /** อ่านอย่างเดียว (ห้ามแก้ object ที่ได้) */
  read() { this._load(); return this.data; }
  /** แก้ไขแบบเข้าคิว — fn(data, dirty): เรียก dirty() เมื่อมีการแก้จริงจึงจะเขียนไฟล์ */
  update(fn) {
    if (kvOn()) return this._updateKv(fn);
    const run = async () => {
      this._load();
      const snap = structuredClone(this.data);
      let changed = false;
      try {
        const out = await fn(this.data, () => { changed = true; });
        if (changed) {
          const tmp = `${this.file}.${process.pid}.tmp`;
          fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 });
          fs.renameSync(tmp, this.file);
          try { this.mtime = fs.statSync(this.file).mtimeMs; } catch {}
        }
        return out;
      } catch (e) { this.data = snap; throw e; }
    };
    const p = this.q.then(run, run);
    this.q = p.catch(() => {});
    return p;
  }
}

// Redis: อ่าน → แก้ → เขียนกลับด้วย compare-and-set (ถ้ามีคนแก้ระหว่างนั้นจะลองใหม่) — ปลอดภัยเมื่อรันหลายอินสแตนซ์
const CAS = "local c=redis.call('GET',KEYS[1]); if (c==false and ARGV[1]=='') or c==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]); return 1 end; return 0";
Store.prototype._updateKv = async function (fn) {
  const key = 'hub:db:' + this.name;
  for (let i = 0; i < 8; i++) {
    const raw = await kv('GET', key);
    let data; try { data = raw ? JSON.parse(raw) : this.fallback(); } catch { data = this.fallback(); }
    let changed = false;
    const out = await fn(data, () => { changed = true; });
    if (!changed) return out;
    if ((await kv('EVAL', CAS, 1, key, raw ?? '', JSON.stringify(data))) === 1) return out;
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 40));
  }
  throw Object.assign(new Error('db_busy'), { status: 503, code: 'busy' });
};

const stores = (globalThis.__hubStores ||= new Map());
export function store(name, fallback) {
  if (!stores.has(name)) stores.set(name, new Store(name, fallback));
  return stores.get(name);
}
