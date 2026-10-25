import { store } from './db.js';
import { kv, kvPipe, kvOn, pairs } from './kv.js';

const db = () => store('analytics.db.json', () => ({ runs: {}, days: {}, total: 0 }));
// วันตามเวลาไทย (UTC+7)
export const dayKey = (off = 0) => new Date(Date.now() + 7 * 3600_000 - off * 86400_000).toISOString().slice(0, 10);
const runCount = (r) => (typeof r === 'number' ? r : (r.free || 0) + (r.premium || 0));

function norm(d) {
  d.runs = d.runs || {}; d.days = d.days || {};
  d.total = d.total ?? Object.values(d.runs).reduce((a, r) => a + runCount(r), 0);
  return d;
}

// Redis: ใช้ตัวนับแบบ atomic (HINCRBY/INCR) ไม่ต้องล็อกทั้งเอกสาร — /api/run ถูกยิงถี่ จึงไม่ใช้ compare-and-set
async function kvLoad() {
  const [r, d, t] = await kvPipe([['HGETALL', 'hub:an:runs'], ['HGETALL', 'hub:an:days'], ['GET', 'hub:an:total']]);
  const runs = {};
  for (const [f, v] of Object.entries(pairs(r))) { const [id, tier] = f.split(':'); (runs[id] ||= { free: 0, premium: 0 })[tier === 'premium' ? 'premium' : 'free'] = Number(v); }
  const days = Object.fromEntries(Object.entries(pairs(d)).map(([k, v]) => [k, Number(v)]));
  return { runs, days, total: Number(t || 0) };
}

export async function getStats() {
  const d = kvOn() ? await kvLoad() : norm(db().read());
  return { ...d, today: dayKey() };
}
export async function getPublicStats() {
  const { total, days, today } = await getStats();
  return { total, today, days };
}

export async function recordRun(placeId, tier) {
  const t = tier === 'premium' ? 'premium' : 'free';
  const day = dayKey();
  if (kvOn()) {
    await kvPipe([['HINCRBY', 'hub:an:runs', `${placeId}:${t}`, 1], ['HINCRBY', 'hub:an:days', day, 1], ['INCR', 'hub:an:total']]);
    return;
  }
  return db().update((d, dirty) => {
    norm(d);
    if (typeof d.runs[placeId] === 'number') d.runs[placeId] = { free: d.runs[placeId], premium: 0 };
    if (!d.runs[placeId]) d.runs[placeId] = { free: 0, premium: 0 };
    d.runs[placeId][t]++;
    d.days[day] = (d.days[day] || 0) + 1;
    d.total += 1;
    const keep = Object.keys(d.days).sort().slice(-90);
    d.days = Object.fromEntries(keep.map((k) => [k, d.days[k]]));
    dirty();
  });
}
export async function resetStats() {
  if (kvOn()) { await kv('DEL', 'hub:an:runs', 'hub:an:days', 'hub:an:total'); return; }
  return db().update((d, dirty) => { d.runs = {}; d.days = {}; d.total = 0; dirty(); });
}
