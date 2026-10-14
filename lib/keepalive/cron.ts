import cron from "node-cron";
import { config } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __keepAliveCronInitialized: boolean | undefined;
}

/**
 * Server keep-alive health ping funksiyasi
 * Diqqat: Bu funksiya va u chaqiradigan endpoint ma'lumotlar bazasiga (Neon / Prisma)
 * umuman bog'lanmaydi va hech qanday DB yozuvlarini bajarmaydi.
 */
export async function sendKeepAlivePing(): Promise<{ success: boolean; status?: number; error?: string }> {
  const targetUrl = `${config.app.baseUrl}/api/health-ping`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 soniya timeout

  try {
    const payload = {
      source: "keep-alive",
      sentAt: new Date().toISOString(),
    };

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-keep-alive-secret": config.keepAlive.secret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Keep-Alive] Ping muvaffaqiyatsiz bo'ldi. Status: ${res.status}`);
      return { success: false, status: res.status };
    }

    return { success: true, status: res.status };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik";
    console.error(`[Keep-Alive] Ping xatosi:`, msg);
    return { success: false, error: msg };
  }
}

/**
 * Idempotent Keep-Alive cron job initsializatsiyasi
 * cron: har 10 daqiqada (* /10 * * * *)
 */
export function initKeepAliveCron(): void {
  if (globalThis.__keepAliveCronInitialized) {
    return;
  }

  if (!config.keepAlive.enabled) {
    return;
  }

  const intervalMinutes = config.keepAlive.intervalMinutes || 10;
  const cronExpression = `*/${intervalMinutes} * * * *`;

  cron.schedule(cronExpression, async () => {
    console.log(`[Keep-Alive Cron] ${new Date().toISOString()} da ping yuborilmoqda...`);
    await sendKeepAlivePing();
  });

  globalThis.__keepAliveCronInitialized = true;
  console.log(`[Keep-Alive Cron] Jadval ishga tushirildi: ${cronExpression}`);
}

