// โลโก้แบบ inline SVG (ไม่พึ่งรูปจากเว็บภายนอก) + ไอคอน Discord
export function Mark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className="mark">
      <defs>
        <linearGradient id="mk-g" x1="0" y1="0" x2="0" y2="48"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#b9b9c1" /></linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="15" fill="#17171a" stroke="url(#mk-g)" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="M24 9.5l11 4.2v8.1c0 7.2-4.6 12.3-11 15.2-6.4-2.9-11-8-11-15.2v-8.1z" fill="url(#mk-g)" />
      <text x="24" y="27.4" textAnchor="middle" fontFamily="Inter,system-ui,sans-serif" fontWeight="800" fontSize="11.5" fill="#0b0b0d" letterSpacing="-.4">128</text>
    </svg>
  );
}
export function DiscordIcon({ s = 18 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true" className="ic">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.63 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" />
    </svg>
  );
}
