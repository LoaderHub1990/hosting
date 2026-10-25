/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // บน Vercel ไฟล์ Lua ใน private/ ต้องถูกแพ็กไปกับ function ด้วย (ไม่งั้น readFileSync หาไม่เจอ)
  outputFileTracingIncludes: {
    '/128bit-hub-x/[...path]': ['./private/hub/**/*'],
    '/main/[name]/[file]': ['./private/scripts/**/*'],
    '/getkey/api/premium': ['./private/premium/**/*'],
  },
  // ลิงก์เก่าจากเว็บ HTML เดิม → หน้าใหม่ (ไม่ทำให้ลิงก์ที่แชร์ไว้พัง)
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/home/script', destination: '/#script', permanent: true },
      { source: '/home/script/getkey', destination: '/getkey', permanent: true },
      { source: '/analytics', destination: '/admin#analytics', permanent: true },
      { source: '/admin/admin.html', destination: '/admin', permanent: true },
    ];
  },
  // header ที่เหมือนกันทุกหน้า (CSP แบบ nonce อยู่ใน middleware.js เพราะต้องสุ่มใหม่ทุก request)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },
    ];
  },
};
export default nextConfig;
