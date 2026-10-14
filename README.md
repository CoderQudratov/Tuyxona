# 🏰 Doston To‘yxonasi — Onlayn Bron va Boshqaruv Tizimi

Doston To‘yxonasi uchun ishlab chiqilgan, o‘zbek tilidagi to‘liq ishlaydigan **Telegram Bot + Telegram Mini App (`/user`) + Admin Panel (`/admin`) + Boss Dashboard (`/boss`)** tizimi.

---

## 📌 Asosiy Imkoniyatlar

1. **Telegram Bot (`grammY`)**:
   - `/start` orqali xush kelibsiz xabari va bosqichma-bosqich ro‘yxatdan o‘tish (Ism -> Familiya -> `request_contact` orqali haqiqiy telefon raqamini tasdiqlash).
   - `/user`, `/admin`, `/boss` buyruqlari orqali xavfsiz Web App tugmalari.
   - Deep link orqali chek qabul qilish (`/start receipt_DST-2026-XXXX`).
   - Chek yuborilganda administratorlarga inline tugmalar (`[✅ Tasdiqlash]`, `[❌ Rad etish]`) bilan yuborish va mijozga darhol natijani xabar qilish.

2. **Mijoz Telegram Mini App (`/user`)**:
   - Zamonaviy zumrad-yashil to‘yxona estetikasi.
   - Oylik kalendar: o‘tgan sanalar nofaol, band kunlar qizil, 1 soatlik hold sanalar sariq, bo‘sh kunlar yashil.
   - Mehmonlar stepperi: ±10 ta qadam, minimal 50, maksimal 500.
   - Qo‘shimcha xizmatlar: Zal bezaklari (1 000 000 so‘m), Musiqa (700 000 so‘m), Foto va video (1 200 000 so‘m).
   - Aniq hisob-kitob: 10% minimal zakalat, qolgan to‘lov.
   - Karta orqali zakalat to‘lovi: karta raqamidan nusxa olish, 1 soatlik taymer, bot chatiga chek yuborish tugmasi.
   - Naqd to‘lov so‘rovi: manzil, telefon va ofis ish vaqti.
   - Unikal bron kodi (`DST-2026-XXXX`) va holatni kuzatish (Tracker).

3. **Administrator Paneli (`/admin`)**:
   - Real statistikalar (bugungi bronlar, oylik bandlik, olingan zakalat, qarzdorliklar).
   - Barcha bronlar ro‘yxati (qidiruv, status bo‘yicha filter, bekor qilish).
   - Cheklar va to‘lovlarni tekshirish (rasm ko‘rish, izoh yozish, bir marta tasdiqlash/rad etish, audit log).
   - Qo‘shimcha xizmatlar yaratish va narxlarini boshqarish.
   - To‘yxona parametrlari (karta raqami, zal narxi, sig‘im, zakalat foizi) sozlamalari.

4. **Boss Dashboard (`/boss`)**:
   - To‘yxona egasi uchun moliyaviy KPI lar (kassaga tushgan haqiqiy pul vs kelishilgan umumiy daromad).
   - Kutilayotgan qarzdorlik va bekor qilingan bronlar tahlili.
   - Eng ko‘p buyurtma qilingan xizmatlar reytingi.
   - Boshqaruv va to‘lovlar Audit tarixi.

5. **Keep-Alive Cron Jarayoni**:
   - `node-cron` orqali har 10 daqiqada (`*/10 * * * *`) serverning `/api/health-ping` endpointiga so‘rov yuboradi.
   - **Neon bazasiga mutlaqo kirmaydi, hech qanday Prisma ulanishini ochmaydi va DB ga hech narsa yozmaydi!**

---

## 🛠 Texnologiyalar

- **Frontend & Backend**: Next.js 14 (App Router), React 18, TypeScript (Strict mode)
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: Neon PostgreSQL + Prisma ORM
- **Telegram Bot**: grammY
- **Cron**: node-cron
- **Validatsiya**: Zod
- **Testlash**: Vitest

---

## 🚀 O‘rnatish va Ishga Tushirish

### 1. Talablar
- Node.js `v20.x` yoki undan yuqori
- npm `v10.x` yoki undan yuqori

### 2. Dependency'larni o‘rnatish
```bash
npm install
```

### 3. `.env` faylini sozlash
`.env.example` dan nusxa olib `.env` yarating:
```bash
cp .env.example .env
```

`.env` faylidagi qiymatlar:
```env
# Neon PostgreSQL ulanishi
DATABASE_URL="postgresql://user:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@ep-sample.region.neon.tech/neondb?sslmode=require"

# Telegram Bot (BotFather orqali olingan token)
TELEGRAM_BOT_TOKEN="8735400638:AAHCTlIPzQS6iHQ7KX8HaJgis-WUa9cbGSg"
TELEGRAM_BOT_USERNAME="doston_tuyxona_bot"
TELEGRAM_WEBHOOK_SECRET="maxfiy-webhook-token"

# Web App manzili
APP_BASE_URL="http://localhost:3000"

# Ruxsat berilgan Telegram ID lari (vergul bilan ajratilgan)
ADMIN_TELEGRAM_IDS="123456789"
BOSS_TELEGRAM_IDS="123456789"

# Demo rejim (Neon ulanishi kiritilmagan bo'lsa true holatda xotiradagi In-Memory DB ishlatiladi)
DEMO_MODE="true"

# Keep-alive cron
ENABLE_KEEP_ALIVE="false"
KEEP_ALIVE_SECRET="keep-alive-secret-token"
KEEP_ALIVE_INTERVAL_MINUTES="10"
```

### 4. Ma'lumotlar bazasini tayyorlash (Neon PostgreSQL)
Agar Neon bazangiz bo'lsa:
```bash
npm run db:push
npm run db:seed
```
Agar Neon ulanishi hali bo'lmasa, `DEMO_MODE="true"` o'rnatilgan bo'lib, loyiha to'liq In-Memory demo store bilan ishlaydi.

### 5. Bot va Web Serverni lokal ishga tushirish

1-terminalda (Telegram bot long polling):
```bash
npm run bot:dev
```

2-terminalda (Next.js web ilovasi):
```bash
npm run dev
```

Endi brauzerda:
- Bosh sahifa: [http://localhost:3000](http://localhost:3000)
- Mijoz Mini App: [http://localhost:3000/user](http://localhost:3000/user)
- Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin)
- Boss Dashboard: [http://localhost:3000/boss](http://localhost:3000/boss)

---

## 🤖 Telegram Bot va Mini App'ni ulash tartibi

1. Telegramda `@BotFather` ga kiring.
2. `/newbot` orqali bot yarating yoki mavjud bot tokenini oling.
3. Tokenni `.env` faylidagi `TELEGRAM_BOT_TOKEN` ga yozing.
4. Bot menyusiga Mini App tugmasini qo‘shish:
   - `@BotFather` ga `/mybots` yuboring -> botingizni tanlang.
   - `Bot Settings` -> `Menu Button` -> `Configure menu button`.
   - URL ga `https://YOUR_DOMAIN/user` manzilini yozing.
   - Tugma matniga `To'yxona` deb kiriting.
5. Production'da Webhook o‘rnatish:
   ```bash
   curl -F "url=https://YOUR_DOMAIN/api/telegram/webhook" \
        -F "secret_token=YOUR_WEBHOOK_SECRET" \
        https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
   ```

---

## 🧪 Testlarni ishga tushirish

Barcha 15 ta biznes qoidalari (narx hisoblash, 10% zakalat, double booking himoyasi, 1 soatlik hold expiry, admin tasdiqlash idempotentligi, audit log, ruxsatlar) Vitest bilan sinovdan o'tgan:

```bash
npm run test
```

TypeScript va Lint tekshiruvi:
```bash
npm run typecheck
npm run lint
```

Production build:
```bash
npm run build
```

---

## ⏰ Keep-Alive Cron haqida muhim ma'lumot

- Ushbu jarayon har 10 daqiqada `APP_BASE_URL/api/health-ping` manziliga xavfsiz HTTP POST so‘rov yuboradi.
- **Neon / PostgreSQL ga umuman ulanmaydi** va DB kvotasini sarflamaydi.
- Serverless muhitlar (masalan Vercel) so‘rovlar bo‘lmaganda to‘xtatiladi. Shuning uchun cron mustaqil ishlashi uchun doimiy ishlovchi Node.js server (Render Web Service / VPS) yoki tashqi Cron (masalan Cron-Job.org / UptimeRobot) orqali `https://YOUR_DOMAIN/api/health-ping` ga so‘rov yuborish tavsiya etiladi.
- Alohida jarayon sifatida ishlatish:
  ```bash
  npm run keepalive
  ```
# Tuyxona
