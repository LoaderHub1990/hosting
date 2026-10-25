# 128B!t Hub X — Next.js

เว็บเดิม (Express + HTML) ย้ายมาเป็น **Next.js 15 (App Router)** พร้อม UI สไตล์เดียวกับแดชบอร์ด Flexozy Shop และระบบป้องกันชุดใหม่

## เริ่มใช้งาน
```bash
cp .env.example .env      # กรอกอย่างน้อย TOKEN_SECRET, ADMIN_SECRET, LV_LINK_1..5, BASE_URL
npm install
npm run build
npm start                 # ใช้ PORT จาก env (ค่าเริ่มต้น 3000)
```
- ย้ายข้อมูลเดิม: วาง `keys.db.json` และ `analytics.db.json` ไว้ที่รากโปรเจกต์หรือใน `data/` (อ่านต่อให้อัตโนมัติ)
- ไฟล์ premium จริง: วางที่ `private/premium/main.lua` (หรือกำหนด `PREMIUM_FILE`)
- สคริปต์ `/main/:name/:file` วางใน `private/scripts/<name>/<file>.lua`
- Obfuscator: `npm run setup:obfuscator` (หรือให้ติดตั้งเองตอนเริ่มเซิร์ฟเวอร์; ปิดด้วย `OBF_AUTO_INSTALL=0`)

## URL ที่ยังใช้ได้เหมือนเดิม (สคริปต์ Lua / บอทไม่ต้องแก้)
`/api/run` · `/api/pub/stats` · `/api/stats` · `/api/obfuscate` · `/getkey/api/{session,cp/go,cp/done,claim,validate,premium}` · `/getkey/admin/{create,keys,key/:key,key/:key/reset-hwid}` (header `x-admin-token`) · `/128bit-hub-x/**.lua` · `/main/:name/:file`

หน้าเก่า `/home`, `/home/script`, `/analytics` redirect ไปหน้าใหม่ให้

## หน้าเว็บ
`/` หน้าแรก+Get Script · `/getkey` · `/docs` · `/obfuscate` · `/dashboard` · `/invite` · `/admin` (คีย์ / สถิติ / ความปลอดภัย)

## ระบบป้องกัน
- CSP แบบ nonce + strict-dynamic, HSTS, X-Frame-Options DENY, nosniff, COOP/CORP, Permissions-Policy
- แอดมิน: รหัส และ/หรือ Discord OAuth (จำกัด ID), cookie HttpOnly + SameSite=Strict + `__Host-` + ผูก User-Agent, CSRF token, ล็อก IP เดารหัสผิด 5 ครั้ง/15 นาที
- API: rate limit, จำกัดขนาด body, ตรวจ Origin, error ไม่เปิดเผยรายละเอียดภายใน
- คีย์: ตรวจรูปแบบ (กัน `__proto__`), เขียนไฟล์แบบคิว+atomic (กัน race ผูก HWID), จำกัดคีย์ฟรีต่อ IP ต่อวัน, constant-time compare
- Get Key: nonce ต่อด่าน, เวลาขั้นต่ำ, Linkvertise anti-bypass, 1 เซสชัน = 1 คีย์
- ไฟล์ Lua อยู่นอก `public/`, เบราว์เซอร์ได้ 404 ปลอม, กัน path traversal
- Obfuscator: spawn แบบ args array, timeout, จำกัดงานพร้อมกัน/ขนาด
- Audit log ที่ `data/audit.log` ดูได้ที่ `/admin#security`

## Deploy บน Vercel
ระบบมี 2 โหมด เลือกอัตโนมัติ: **ไม่มี Redis** = เก็บเป็นไฟล์ (VPS/Pterodactyl) · **มี Redis** = เก็บใน Upstash Redis (Vercel / หลายอินสแตนซ์)

1. Push โปรเจกต์ขึ้น GitHub แบบ **Private** (ต้อง commit `private/premium/main.lua` ไปด้วย เพราะ Vercel อ่านไฟล์จาก repo — ห้ามใช้ repo สาธารณะ)
2. Vercel → Add New → Project → เลือก repo (Framework: Next.js ตรวจเจอเอง)
3. Storage → Marketplace → **Upstash Redis** → Connect to project (จะได้ `KV_REST_API_URL` / `KV_REST_API_TOKEN` ให้เอง)
4. Settings → Environment Variables: `TOKEN_SECRET`, `ADMIN_SECRET`, `BASE_URL=https://โดเมนคุณ`, `LV_LINK_1..5`, `LV_ANTIBYPASS_TOKEN` (+ Discord login ถ้าใช้) ดูครบใน `.env.example`
5. ใส่โดเมน 128bit.online ที่ Settings → Domains แล้ว Redeploy
6. ย้ายคีย์เดิม: ใน `/admin` สร้างใหม่ หรือแจ้งให้เขียนสคริปต์นำเข้า `keys.db.json` → Redis

บน Vercel จะเก็บใน Redis: คีย์/HWID, สถิติ, เซสชัน Get Key, rate limit, ล็อกเอาต์ และ audit log · IP ผู้ใช้อ่านจาก `x-vercel-forwarded-for`

**Obfuscator** รันบน Vercel ไม่ได้ (ต้องใช้ LuaJIT) → รัน `OBF_REMOTE_TOKEN=... npm run obf-service` บน VPS (หลัง HTTPS) แล้วตั้ง `OBF_REMOTE_URL` + `OBF_REMOTE_TOKEN` ฝั่ง Vercel; ถ้าไม่ตั้ง หน้า `/obfuscate` จะแจ้งว่าปิดปรับปรุง

ข้อจำกัด Vercel: function ฟรี (Hobby) timeout 10 วินาที, โปรเจกต์เชิงพาณิชย์ต้องใช้แพลน Pro ตามเงื่อนไขของ Vercel

## ข้อควรรู้
- `TRUST_PROXY=1` เมื่ออยู่หลัง Cloudflare/Proxy; เปิดตรงๆ ให้ตั้ง `0`
- โหมดไฟล์: rate limit/ล็อกเอาต์/เซสชันอยู่ในหน่วยความจำโปรเซสเดียว — ถ้ารันหลายอินสแตนซ์ให้ตั้ง Redis
- Discord OAuth: Redirect URI คือ `{BASE_URL}/admin/auth/callback`
