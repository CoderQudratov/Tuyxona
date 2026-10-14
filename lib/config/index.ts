export const config = {
  database: {
    url: process.env.DATABASE_URL || "",
    directUrl: process.env.DIRECT_URL || "",
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "doston_tuyxona_bot",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "default_webhook_secret",
  },
  app: {
    baseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
    isDemoMode: process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost"),
  },
  roles: {
    adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS || "123456789")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    bossTelegramIds: (process.env.BOSS_TELEGRAM_IDS || "123456789")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  },
  keepAlive: {
    enabled: process.env.ENABLE_KEEP_ALIVE === "true",
    secret: process.env.KEEP_ALIVE_SECRET || "keep-alive-secret-token",
    intervalMinutes: parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES || "10", 10),
  },
  venue: {
    name: process.env.VENUE_NAME || "Doston To'yxonasi",
    address: process.env.VENUE_ADDRESS || "Toshkent shahri, Chilonzor tumani, Bunyodkor ko'chasi 42-uy",
    phone: process.env.VENUE_PHONE || "+998 90 123 45 67",
    cardNumber: process.env.VENUE_CARD_NUMBER || "8600 5500 1234 5678",
    cardHolder: process.env.VENUE_CARD_HOLDER || "Doston To'yxonasi MCHJ",
    depositPercent: parseInt(process.env.VENUE_DEPOSIT_PERCENT || "10", 10),
    mainHallPrice: parseInt(process.env.VENUE_MAIN_HALL_PRICE || "12000000", 10),
    capacity: parseInt(process.env.VENUE_CAPACITY || "500", 10),
    holdDurationMinutes: 60,
  },
};

export function getAdminTelegramIds(): string[] {
  const raw = process.env.ADMIN_TELEGRAM_IDS || "8501558045,123456789";
  return raw
    .split(",")
    .map((id) => id.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function getBossTelegramIds(): string[] {
  const raw = process.env.BOSS_TELEGRAM_IDS || "8501558045,123456789";
  return raw
    .split(",")
    .map((id) => id.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function isAdminUser(telegramId: string | number): boolean {
  const idStr = String(telegramId).trim();
  return getAdminTelegramIds().includes(idStr) || getBossTelegramIds().includes(idStr);
}

export function isBossUser(telegramId: string | number): boolean {
  const idStr = String(telegramId).trim();
  return getBossTelegramIds().includes(idStr);
}

