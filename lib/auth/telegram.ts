import crypto from "crypto";
import { config, isAdminUser, isBossUser } from "@/lib/config";
import { demoStore } from "@/lib/store/demo-store";
import { UserRecord, UserRole } from "@/lib/types";

export interface TelegramAuthUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedSession {
  isValid: boolean;
  user: TelegramAuthUser | null;
  dbUser?: UserRecord | null;
  role: UserRole;
  error?: string;
  isDemoFallback?: boolean;
}

/**
 * Telegram WebApp initData ni rasmiy Telegram HMAC-SHA256 algoritmi orqali serverda tekshirish
 */
export function validateTelegramInitData(
  initData: string,
  botToken?: string
): ValidatedSession {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken;

  if (!initData || initData.trim() === "") {
    // Brauzer orqali ochilganda va FAQAT DEMO_MODE bo'lsa xavfsiz demo foydalanuvchi taqdim etiladi
    if (config.app.isDemoMode) {
      const demoDbUser = demoStore.getUserByTelegramId("8501558045") || demoStore.getUsers()[0];
      return {
        isValid: true,
        user: {
          id: 8501558045,
          first_name: demoDbUser?.firstName || "Doston",
          last_name: demoDbUser?.lastName || "Qodirov",
          username: "doston",
        },
        dbUser: demoDbUser,
        role: "ADMIN",
        isDemoFallback: true,
      };
    }
    return { isValid: false, user: null, role: "USER", error: "Telegram initData mavjud emas" };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");

    if (!hash) {
      return { isValid: false, user: null, role: "USER", error: "Imzo (hash) topilmadi" };
    }

    urlParams.delete("hash");

    // 1. Ma'lumotlarni alifbo tartibida saralash
    const dataCheckArr: string[] = [];
    Array.from(urlParams.keys())
      .sort()
      .forEach((key) => {
        dataCheckArr.push(`${key}=${urlParams.get(key)}`);
      });

    const dataCheckString = dataCheckArr.join("\n");

    // 2. Telegram rasmiy algoritmi bo'yicha imzo tekshiruvi:
    // secret_key = HMAC_SHA256("WebAppData", botToken)
    // calculated_hash = HMAC_SHA256(secret_key, dataCheckString).hex()
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(token).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    // Timing safe taqqoslash
    const hashBuf = Buffer.from(hash, "hex");
    const calcBuf = Buffer.from(calculatedHash, "hex");

    if (hashBuf.length !== calcBuf.length || !crypto.timingSafeEqual(hashBuf, calcBuf)) {
      return { isValid: false, user: null, role: "USER", error: "Soxta yoki noto'g'ri Telegram imzosi" };
    }

    // 3. auth_date tekshiruvi (faqat haqiqiy imzo tekshirilgandan so'ng, replay attack oldini olish uchun)
    const authDateStr = urlParams.get("auth_date");
    if (authDateStr) {
      const authDate = parseInt(authDateStr, 10);
      const now = Math.floor(Date.now() / 1000);
      const maxAgeSeconds = 86400 * 2; // 48 soat ruxsat berilgan oraliq
      if (now - authDate > maxAgeSeconds) {
        return { isValid: false, user: null, role: "USER", error: "initData muddati o'tgan (auth_date expired)" };
      }
    }

    // 5. Foydalanuvchi ma'lumotlarini o'qish
    const userStr = urlParams.get("user");
    if (!userStr) {
      return { isValid: false, user: null, role: "USER", error: "Foydalanuvchi ma'lumoti topilmadi" };
    }

    const tgUser: TelegramAuthUser = JSON.parse(userStr);

    // 6. Rolni aniqlash
    let role: UserRole = "USER";
    if (isBossUser(tgUser.id)) {
      role = "BOSS";
    } else if (isAdminUser(tgUser.id)) {
      role = "ADMIN";
    }

    // 7. Bazadagi mavjud profilni bog'lash
    const dbUser = demoStore.getUserByTelegramId(String(tgUser.id)) || null;

    return {
      isValid: true,
      user: tgUser,
      dbUser,
      role,
      isDemoFallback: false,
    };
  } catch (err: unknown) {
    return {
      isValid: false,
      user: null,
      role: "USER",
      error: err instanceof Error ? err.message : "Autentifikatsiya xatoligi",
    };
  }
}

/**
 * Next.js Request dan initData ni olib sessiyani qaytaruvchi server yordamchisi
 */
export function getAuthenticatedSession(req: Request): ValidatedSession {
  let initData = req.headers.get("x-telegram-init-data") || "";

  if (!initData) {
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      initData = authHeader.substring(7).trim();
    } else if (authHeader.startsWith("tma ")) {
      initData = authHeader.substring(4).trim();
    }
  }

  return validateTelegramInitData(initData);
}
