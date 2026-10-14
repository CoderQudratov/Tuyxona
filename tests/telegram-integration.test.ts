import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import crypto from "node:crypto";
import { bot } from "@/lib/telegram/bot";
import { demoStore } from "@/lib/store/demo-store";
import {
  isAdminUser,
  isBossUser,
  getAdminTelegramIds,
  getBossTelegramIds,
  config,
} from "@/lib/config";
import {
  validateTelegramInitData,
  getAuthenticatedSession,
} from "@/lib/auth/telegram";
import { GET as getAdminStats } from "@/app/api/admin/stats/route";
import { GET as getBossKpis } from "@/app/api/boss/kpis/route";
import { NextRequest } from "next/server";

// Helper to generate a valid Telegram Web App initData string for testing
function generateValidInitData(
  user: { id: number; first_name: string; last_name?: string; username?: string },
  botToken: string,
  authDate: number = Math.floor(Date.now() / 1000)
): string {
  const params: Record<string, string> = {
    auth_date: String(authDate),
    query_id: "AAHdF6IQAAAAAN0XohDhrPwt",
    user: JSON.stringify(user),
  };

  const dataCheckString = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const searchParams = new URLSearchParams(params);
  searchParams.set("hash", hash);
  return searchParams.toString();
}

describe("Telegram Bot & Mini App Integration Tests", () => {
  const TEST_BOT_TOKEN = "123456789:ABCDefghIJKlmnoPQRstuVWXyz";
  let capturedMessages: any[] = [];

  beforeAll(() => {
    bot.botInfo = {
      id: 8735400638,
      is_bot: true,
      first_name: "Doston Tuyxona Bot",
      username: "doston_tuyxona_bot",
      can_join_groups: false,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: true,
    } as any;

    // Use grammY transformer to intercept all outgoing API requests in-memory
    bot.api.config.use(async (prev, method, payload) => {
      const p = (payload || {}) as any;
      const msg = {
        message_id: capturedMessages.length + 1,
        chat: { id: p.chat_id, type: "private" },
        text: p.text,
        reply_markup: p.reply_markup,
        caption: p.caption,
        method,
        ...p,
      };
      capturedMessages.push(msg);
      return {
        ok: true,
        result: msg,
      } as any;
    });
  });

  beforeEach(() => {
    demoStore.resetDemoData();
    capturedMessages = [];
  });

  // -------------------------------------------------------------
  // 1. Role & Environment Configuration Tests
  // -------------------------------------------------------------
  describe("1. Role & Environment Parsing", () => {
    it("parses comma-separated IDs and trims whitespace accurately", () => {
      const prevAdmin = process.env.ADMIN_TELEGRAM_IDS;
      const prevBoss = process.env.BOSS_TELEGRAM_IDS;

      process.env.ADMIN_TELEGRAM_IDS = " 8501558045 ,  99887766 , 112233  ";
      process.env.BOSS_TELEGRAM_IDS = " 8501558045, 55443322 ";

      const adminIds = getAdminTelegramIds();
      expect(adminIds).toContain("8501558045");
      expect(adminIds).toContain("99887766");
      expect(adminIds).toContain("112233");
      expect(adminIds.length).toBe(3);

      const bossIds = getBossTelegramIds();
      expect(bossIds).toContain("8501558045");
      expect(bossIds).toContain("55443322");

      expect(isAdminUser(8501558045)).toBe(true);
      expect(isAdminUser("99887766")).toBe(true);
      expect(isAdminUser("999999999")).toBe(false);

      expect(isBossUser(8501558045)).toBe(true);
      expect(isBossUser("55443322")).toBe(true);
      expect(isBossUser("999999999")).toBe(false);

      if (prevAdmin !== undefined) {
        process.env.ADMIN_TELEGRAM_IDS = prevAdmin;
      } else {
        delete process.env.ADMIN_TELEGRAM_IDS;
      }
      if (prevBoss !== undefined) {
        process.env.BOSS_TELEGRAM_IDS = prevBoss;
      } else {
        delete process.env.BOSS_TELEGRAM_IDS;
      }
    });
  });

  // -------------------------------------------------------------
  // 2. Cryptographic Telegram initData Validation Tests
  // -------------------------------------------------------------
  describe("2. Server-side Telegram initData Cryptographic Verification", () => {
    it("validates an authentic HMAC-SHA256 initData successfully", () => {
      const now = Math.floor(Date.now() / 1000);
      const validInitData = generateValidInitData(
        { id: 1234567, first_name: "Rustam", last_name: "Aliyev", username: "rustam" },
        TEST_BOT_TOKEN,
        now
      );

      const result = validateTelegramInitData(validInitData, TEST_BOT_TOKEN);
      expect(result.isValid).toBe(true);
      expect(result.user?.id).toBe(1234567);
      expect(result.user?.first_name).toBe("Rustam");
      expect(result.role).toBe("USER");
    });

    it("identifies ADMIN role if the validated Telegram ID matches admin list", () => {
      const validInitData = generateValidInitData(
        { id: 8501558045, first_name: "Doston", last_name: "Qodirov" },
        TEST_BOT_TOKEN
      );

      const result = validateTelegramInitData(validInitData, TEST_BOT_TOKEN);
      expect(result.isValid).toBe(true);
      expect(result.user?.id).toBe(8501558045);
      expect(result.role).toBe("BOSS"); // 8501558045 is configured as boss (and admin)
    });

    it("rejects tampered or forged initData", () => {
      const validInitData = generateValidInitData(
        { id: 1234567, first_name: "Rustam" },
        TEST_BOT_TOKEN
      );

      // Tamper user ID in the query string
      const tampered = validInitData.replace("1234567", "9999999");
      const result = validateTelegramInitData(tampered, TEST_BOT_TOKEN);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Soxta yoki noto'g'ri Telegram imzosi");
    });

    it("rejects initData signed with a different bot token", () => {
      const validInitData = generateValidInitData(
        { id: 1234567, first_name: "Rustam" },
        "wrong_bot_token"
      );

      const result = validateTelegramInitData(validInitData, TEST_BOT_TOKEN);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Soxta yoki noto'g'ri Telegram imzosi");
    });

    it("rejects expired auth_date (older than 48 hours)", () => {
      const threeDaysAgo = Math.floor(Date.now() / 1000) - 3 * 86400;
      const expiredInitData = generateValidInitData(
        { id: 1234567, first_name: "Rustam" },
        TEST_BOT_TOKEN,
        threeDaysAgo
      );

      const result = validateTelegramInitData(expiredInitData, TEST_BOT_TOKEN);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("initData muddati o'tgan");
    });
  });

  // -------------------------------------------------------------
  // 3. API Role Escalation Prevention Tests
  // -------------------------------------------------------------
  describe("3. API Role Escalation Protection", () => {
    it("rejects normal customer calling /api/admin/stats with 403 Forbidden", async () => {
      const userInitData = generateValidInitData(
        { id: 987654321, first_name: "Oddiy", last_name: "Mijoz" },
        process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken
      );

      const req = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${userInitData}`,
        },
      });

      const res = await getAdminStats(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("administrator uchun ruxsat berilgan");
    });

    it("rejects normal customer calling /api/boss/kpis with 403 Forbidden", async () => {
      const userInitData = generateValidInitData(
        { id: 987654321, first_name: "Oddiy", last_name: "Mijoz" },
        process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken
      );

      const req = new NextRequest("http://localhost:3000/api/boss/kpis", {
        headers: {
          Authorization: `Bearer ${userInitData}`,
        },
      });

      const res = await getBossKpis(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Boss) uchun ruxsat berilgan");
    });

    it("allows authorized admin calling /api/admin/stats with 200 OK", async () => {
      const adminInitData = generateValidInitData(
        { id: 8501558045, first_name: "Doston", last_name: "Qodirov" },
        process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken
      );

      const req = new NextRequest("http://localhost:3000/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${adminInitData}`,
        },
      });

      const res = await getAdminStats(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.stats).toBeDefined();
    });
  });

  // -------------------------------------------------------------
  // 4. Telegram Bot Registration & Command Flow Tests
  // -------------------------------------------------------------
  describe("4. Telegram Bot Registration & Journey Flow", () => {
    function makeCommandUpdate(userId: number, command: string, firstName = "TestUser") {
      const cmdWord = command.split(" ")[0];
      return {
        update_id: Math.floor(Math.random() * 100000) + 1,
        message: {
          message_id: Math.floor(Math.random() * 100000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: userId, type: "private" },
          from: { id: userId, is_bot: false, first_name: firstName },
          text: command,
          entities: [
            {
              type: "bot_command",
              offset: 0,
              length: cmdWord.length,
            },
          ],
        },
      } as any;
    }

    function makeTextUpdate(userId: number, text: string, firstName = "TestUser") {
      return {
        update_id: Math.floor(Math.random() * 100000) + 1,
        message: {
          message_id: Math.floor(Math.random() * 100000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: userId, type: "private" },
          from: { id: userId, is_bot: false, first_name: firstName },
          text,
        },
      } as any;
    }

    function makeContactUpdate(userId: number, contact: { phone_number: string; first_name: string; user_id: number }) {
      return {
        update_id: Math.floor(Math.random() * 100000) + 1,
        message: {
          message_id: Math.floor(Math.random() * 100000) + 1,
          date: Math.floor(Date.now() / 1000),
          chat: { id: userId, type: "private" },
          from: { id: userId, is_bot: false, first_name: contact.first_name },
          contact,
        },
      } as any;
    }

    it("completes full registration flow via text and contact sharing", async () => {
      const testTgId = 55512345;

      // Step 1: User sends /start
      await bot.handleUpdate(makeCommandUpdate(testTgId, "/start", "Olim"));

      expect(capturedMessages.length).toBe(1);
      expect(capturedMessages[0].text).toContain("ismingizni kiriting");

      // Step 2: User sends first name "Olim"
      await bot.handleUpdate(makeTextUpdate(testTgId, "Olim", "Olim"));

      expect(capturedMessages.length).toBe(2);
      expect(capturedMessages[1].text).toContain("familiyangizni kiriting");

      // Step 3: User sends last name "Nazarov"
      await bot.handleUpdate(makeTextUpdate(testTgId, "Nazarov", "Olim"));

      expect(capturedMessages.length).toBe(3);
      expect(capturedMessages[2].text).toContain("telefon raqamingizni yuboring");
      expect(capturedMessages[2].reply_markup).toBeDefined();

      // Step 4a: Security check - User tries to send someone else's contact
      await bot.handleUpdate(
        makeContactUpdate(testTgId, {
          phone_number: "+998909998877",
          first_name: "Boshqa",
          user_id: 99999999, // Mismatched user_id!
        })
      );

      expect(capturedMessages.length).toBe(4);
      expect(capturedMessages[3].text).toContain("faqat o‘zingizning telefon raqamingizni");

      // Step 4b: User sends their own genuine contact
      await bot.handleUpdate(
        makeContactUpdate(testTgId, {
          phone_number: "+998901234567",
          first_name: "Olim",
          user_id: testTgId, // Matched user_id
        })
      );

      // Verification: User profile saved in store
      const savedUser = demoStore.getUserByTelegramId(String(testTgId));
      expect(savedUser).toBeDefined();
      expect(savedUser?.firstName).toBe("Olim");
      expect(savedUser?.lastName).toBe("Nazarov");
      expect(savedUser?.phone).toBe("+998901234567");

      // Check final message has the real Web App button pointing to /user
      const lastMsg = capturedMessages[capturedMessages.length - 1];
      expect(lastMsg.text).toContain("Mini App'ga kiring");
      const webAppBtn = lastMsg.reply_markup?.inline_keyboard?.[0]?.[0];
      expect(webAppBtn).toBeDefined();
      expect(webAppBtn.text).toBe("To‘yxonani ko‘rish va bron qilish");
      expect(webAppBtn.web_app?.url).toBe(`${config.app.baseUrl}/user`);
    });

    it("/start is idempotent: does not restart registration for already registered user", async () => {
      // Seed registered user
      demoStore.upsertUser({
        telegramId: "111222333",
        firstName: "Anvar",
        lastName: "Saidov",
        phone: "+998931112233",
      });

      await bot.handleUpdate(makeCommandUpdate(111222333, "/start", "Anvar"));

      // Should immediately welcome user and send Web App button, NOT ask for name
      expect(capturedMessages.length).toBe(1);
      expect(capturedMessages[0].text).toContain("Assalomu alaykum, Anvar!");
      expect(capturedMessages[0].text).not.toContain("ismingizni kiriting");
      const btn = capturedMessages[0].reply_markup?.inline_keyboard?.[0]?.[0];
      expect(btn?.web_app?.url).toBe(`${config.app.baseUrl}/user`);
    });

    it("/user command: registered user receives Web App button; unregistered prompted to register", async () => {
      const regId = 777111;
      const unregId = 777222;

      demoStore.upsertUser({
        telegramId: String(regId),
        firstName: "Shahlo",
        phone: "+998901112233",
      });

      // 1. Unregistered user sends /user
      await bot.handleUpdate(makeCommandUpdate(unregId, "/user", "Mehmon"));

      expect(capturedMessages[0].text).toContain("avval ro‘yxatdan o‘ting");

      // 2. Registered user sends /user
      await bot.handleUpdate(makeCommandUpdate(regId, "/user", "Shahlo"));

      const lastMsg = capturedMessages[1];
      const btn = lastMsg.reply_markup?.inline_keyboard?.[0]?.[0];
      expect(btn?.web_app?.url).toBe(`${config.app.baseUrl}/user`);
    });

    it("/admin command: allows authorized admin with Web App button, denies unauthorized user", async () => {
      const adminId = 8501558045; // Real authorized admin
      const strangerId = 999999999; // Unauthorized

      // Unauthorized user
      await bot.handleUpdate(makeCommandUpdate(strangerId, "/admin", "Begona"));

      expect(capturedMessages[0].text).toContain("administrator huquqi mavjud emas");
      expect(capturedMessages[0].reply_markup).toBeUndefined();

      // Authorized admin
      await bot.handleUpdate(makeCommandUpdate(adminId, "/admin", "Doston"));

      const adminMsg = capturedMessages[1];
      expect(adminMsg.text).toContain("Administrator panelini ochish");
      const btn = adminMsg.reply_markup?.inline_keyboard?.[0]?.[0];
      expect(btn?.text).toBe("⚙️ Admin panelni ochish");
      expect(btn?.web_app?.url).toBe(`${config.app.baseUrl}/admin`);
    });

    it("/boss command: allows authorized boss with Web App button, denies unauthorized user", async () => {
      const bossId = 8501558045; // Real authorized boss
      const strangerId = 999999999; // Unauthorized

      // Unauthorized user
      await bot.handleUpdate(makeCommandUpdate(strangerId, "/boss", "Begona"));

      expect(capturedMessages[0].text).toContain("faqat to‘yxona egasi (Boss) uchun");
      expect(capturedMessages[0].reply_markup).toBeUndefined();

      // Authorized boss
      await bot.handleUpdate(makeCommandUpdate(bossId, "/boss", "Doston"));

      const bossMsg = capturedMessages[1];
      expect(bossMsg.text).toContain("Boss Dashboard'ini ochish");
      const btn = bossMsg.reply_markup?.inline_keyboard?.[0]?.[0];
      expect(btn?.text).toBe("👑 Boss Dashboard'ni ochish");
      expect(btn?.web_app?.url).toBe(`${config.app.baseUrl}/boss`);
    });
  });
});
