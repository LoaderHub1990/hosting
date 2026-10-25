import { NextResponse } from 'next/server';

/**
 * ด่านหน้าของทุก request
 *  1) ตัดเส้นทางที่บอทสแกนช่องโหว่ชอบยิง (.env, .git, wp-admin, *.php …) ตั้งแต่ต้น
 *  2) กัน CSRF แบบข้ามเว็บ: คำสั่งที่เปลี่ยนข้อมูลที่มี Origin ต้องตรงกับโดเมนเรา
 *  3) CSP แบบ nonce สุ่มใหม่ทุกหน้า (script ที่ไม่มี nonce รันไม่ได้ → XSS แทบไร้ผล)
 */
const SCANNER = /(^|\/)\.(env|git|svn|hg|htaccess|htpasswd|ds_store|aws|ssh)(\/|$)|\/(wp-admin|wp-login|wp-content|wp-includes|xmlrpc|phpmyadmin|pma|cgi-bin|vendor\/phpunit|actuator|\.well-known\/security)\b|\.(php\d?|asp|aspx|jsp|cgi|bak|old|sql|swp|ini|log)$/i;
const API_PREFIX = /^\/(api|getkey\/api|getkey\/admin|admin\/auth|admin\/api|main|128bit-hub-x)(\/|$)/;

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (SCANNER.test(pathname)) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const origin = req.headers.get('origin');
    if (origin) {
      const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase();
      let ok = false;
      try {
        const o = new URL(origin).host.toLowerCase();
        let base = ''; try { base = new URL(process.env.BASE_URL || '').host.toLowerCase(); } catch {}
        ok = o === host || (!!base && o === base);
      } catch {}
      if (!ok) return NextResponse.json({ error: 'bad_origin' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  if (API_PREFIX.test(pathname)) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== 'production';
  const https = (process.env.BASE_URL || '').startsWith('https://');
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.discordapp.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(!dev && https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  const headers = new Headers(req.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'] };
