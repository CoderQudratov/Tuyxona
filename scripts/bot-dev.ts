import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import fs from "fs";
import path from "path";

// Load .env manually if not already in process.env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

import { bot } from "../lib/telegram/bot";

async function run() {
  console.log("🤖 Doston To'yxonasi Telegram Boti (Long Polling rejimida) ishga tushirilmoqda...");
  
  // Set bot commands
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Botni ishga tushirish va ro'yxatdan o'tish" },
      { command: "user", description: "To'yxona Mini App'ini ochish" },
      { command: "admin", description: "Administrator panelini ochish" },
      { command: "boss", description: "Boss Dashboard'ini ochish" },
    ]);
    console.log("✅ Bot buyruqlari muvaffaqiyatli o'rnatildi (/start, /user, /admin, /boss)");
  } catch (err) {
    console.warn("⚠️ Buyruqlarni o'rnatishda ogohlantirish:", err);
  }

  // Delete any existing webhook before long polling
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: false });
    console.log("✅ Webhook tozalandi, long polling boshlanmoqda...");
  } catch (err) {
    console.warn("⚠️ Webhook tozalashda ogohlantirish:", err);
  }

  bot.start({
    onStart: (botInfo) => {
      console.log(`🚀 Bot faol! @${botInfo.username} (${botInfo.first_name}) xabarlarni qabul qilmoqda...`);
    },
  });
}

run().catch((err) => {
  console.error("Botni ishga tushirishda xatolik:", err);
  process.exit(1);
});
