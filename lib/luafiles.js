import fs from 'node:fs';
import path from 'node:path';
import { isBrowser, fakeLua, textRes } from './security.js';

const SAFE = /^[A-Za-z0-9._-]+$/;
/** เสิร์ฟ .lua จาก baseDir เท่านั้น — ตรวจ segment, นามสกุล, realpath (กัน ../ และ symlink) */
export function serveLua(req, baseDir, segments) {
  const nf = () => textRes('-- not found', 404);
  if (!segments.length || segments.length > 4) return nf();
  if (!segments.every((s) => SAFE.test(s) && !s.startsWith('.'))) return nf();
  if (!segments[segments.length - 1].endsWith('.lua')) return nf();
  if (isBrowser(req)) return fakeLua();
  const base = path.resolve(baseDir);
  const full = path.resolve(base, ...segments);
  try {
    const real = fs.realpathSync(full);
    if (!real.startsWith(fs.realpathSync(base) + path.sep)) return nf();
    return textRes(fs.readFileSync(real));
  } catch { return nf(); }
}
