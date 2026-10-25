// ติดตั้ง Prometheus (Lua obfuscator) แบบไม่ต้อง root:  npm run setup:obfuscator
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';

const ROOT = process.cwd();
const PROM = path.join(ROOT, '.prometheus');
const run = (cmd, args, opts = {}) => cp.spawnSync(cmd, args, { stdio: 'inherit', timeout: 300_000, ...opts });
const has = (b) => cp.spawnSync('which', [b], { stdio: 'ignore' }).status === 0;
const log = (...a) => console.log('[prometheus]', ...a);

if (!fs.existsSync(path.join(PROM, 'cli.lua'))) {
  log('cloning repo…');
  fs.mkdirSync(PROM, { recursive: true });
  const r = run('git', ['clone', '--depth', '1', 'https://github.com/prometheus-lua/Prometheus.git', PROM]);
  if (r.status !== 0) { console.error('[prometheus] git clone ไม่สำเร็จ (ต้องมี git และเข้าถึง github.com ได้)'); process.exit(1); }
} else log('cli.lua found');

if (!['luajit', 'lua5.1', 'lua5.4', 'lua'].some(has) && !fs.existsSync(path.join(ROOT, '.luajit', 'bin', 'luajit'))) {
  log('lua runtime not found — building LuaJIT (no-root)…');
  const src = path.join(ROOT, '.luajit-src'), out = path.join(ROOT, '.luajit');
  fs.mkdirSync(src, { recursive: true }); fs.mkdirSync(out, { recursive: true });
  const tgz = path.join(src, 'luajit.tgz');
  let ok = run('curl', ['-fsSL', '-o', tgz, 'https://luajit.org/download/LuaJIT-2.1.0-beta3.tar.gz']).status === 0
    && run('tar', ['-xzf', tgz, '-C', src, '--strip-components=1']).status === 0
    && run('make', ['-C', src, '-j2', `PREFIX=${out}`]).status === 0
    && run('make', ['-C', src, 'install', `PREFIX=${out}`]).status === 0;
  if (!ok) { console.error('[prometheus] build LuaJIT ไม่สำเร็จ — ติดตั้ง luajit เองแล้วรันใหม่'); process.exit(1); }
}
log('ready ✔');
