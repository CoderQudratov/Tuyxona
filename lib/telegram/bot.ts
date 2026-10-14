import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { Bot, InlineKeyboard, Keyboard } from "grammy";
import { config, isAdminUser, isBossUser } from "@/lib/config";
import { demoStore } from "@/lib/store/demo-store";
import { bookingService } from "@/lib/booking/service";
import { formatCurrency, formatDateUz } from "@/lib/utils";

// Chat conversation states for registration & receipt handling
interface ChatSession {
  step?: "WAITING_FIRST_NAME" | "WAITING_LAST_NAME" | "WAITING_PHONE";
  tempFirstName?: string;
  tempLastName?: string;
  activeBookingCodeForReceipt?: string;
}

const chatSessions = new Map<number, ChatSession>();

// Initialize grammY bot
const botToken = process.env.TELEGRAM_BOT_TOKEN || config.telegram.botToken || "123456:dummy_token";
export const bot = new Bot(botToken);

// Error handler
bot.catch((err) => {
  console.error("Telegram bot xatoligi:", err);
});

// Helper: Send Mini App Web App button after successful registration or returning user
async function sendMainMenu(ctx: any, firstName: string) {
  const userUrl = `${config.app.baseUrl}/user`;
  
  // Real Telegram Web App tugmasi
  const keyboard = new InlineKeyboard().webApp(
    "To‘yxonani ko‘rish va bron qilish",
    userUrl
  );

  await ctx.reply(
    `Assalomu alaykum, ${firstName}!\n\n` +
      `Doston To‘yxonasi onlayn bron tizimiga xush kelibsiz.\n` +
      `To‘yingiz uchun qulay sanani tanlang va bronni onlayn rasmiylashtiring.\n\n` +
      `Quyidagi tugmani bosing va Mini App'ga kiring:`,
    {
      reply_markup: keyboard,
    }
  );
}

// /start command
bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const payload = ctx.match; // deep link payload (masalan, receipt_DST-2026-0001)
  if (payload && payload.startsWith("receipt_")) {
    const bookingCode = payload.replace("receipt_", "").trim();
    chatSessions.set(userId, { activeBookingCodeForReceipt: bookingCode });
    await ctx.reply(
      `🧾 *${bookingCode}* bron kodi tanlandi.\n\n` +
        `Iltimos, to‘lov chekini rasm (foto) yoki hujjat sifatida shu yerga yuboring.\n` +
        `Chek kelgach, administratorga ko‘rib chiqish uchun yuboriladi.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // 1. Agar foydalanuvchi allaqachon ro'yxatdan o'tgan bo'lsa, qayta so'ramaydi
  const existingUser = demoStore.getUserByTelegramId(String(userId));
  if (existingUser && existingUser.phone) {
    await sendMainMenu(ctx, existingUser.firstName);
    return;
  }

  // 2. Yangi yoki chala qolgan ro'yxatdan o'tishni boshlash
  chatSessions.set(userId, { step: "WAITING_FIRST_NAME" });
  await ctx.reply(
    `Assalomu alaykum, Doston To‘yxonasiga xush kelibsiz!\n\n` +
      `To‘yingiz uchun qulay sanani tanlang va bronni onlayn rasmiylashtiring.\n\n` +
      `Ro‘yxatdan o‘tish uchun, iltimos, ismingizni kiriting:`
  );
});

// /user command
bot.command("user", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const existingUser = demoStore.getUserByTelegramId(String(userId));
  if (!existingUser || !existingUser.phone) {
    chatSessions.set(userId, { step: "WAITING_FIRST_NAME" });
    await ctx.reply(
      `⚠️ Mini App'dan foydalanish uchun, iltimos, avval ro‘yxatdan o‘ting.\n\n` +
        `Ismingizni kiriting:`
    );
    return;
  }

  const userUrl = `${config.app.baseUrl}/user`;
  const keyboard = new InlineKeyboard().webApp(
    "To‘yxonani ko‘rish va bron qilish",
    userUrl
  );

  await ctx.reply("Doston To‘yxonasi mijoz Mini App'ini ochish:", {
    reply_markup: keyboard,
  });
});

// /admin command
bot.command("admin", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdminUser(userId)) {
    await ctx.reply("⚠️ Kechirasiz, sizda administrator huquqi mavjud emas.");
    return;
  }

  const adminUrl = `${config.app.baseUrl}/admin`;
  const keyboard = new InlineKeyboard().webApp("⚙️ Admin panelni ochish", adminUrl);
  await ctx.reply("Doston To‘yxonasi Administrator panelini ochish:", {
    reply_markup: keyboard,
  });
});

// /boss command
bot.command("boss", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isBossUser(userId)) {
    await ctx.reply("⚠️ Kechirasiz, ushbu bo‘lim faqat to‘yxona egasi (Boss) uchun.");
    return;
  }

  const bossUrl = `${config.app.baseUrl}/boss`;
  const keyboard = new InlineKeyboard().webApp("👑 Boss Dashboard'ni ochish", bossUrl);
  await ctx.reply("Doston To‘yxonasi Boss Dashboard'ini ochish:", {
    reply_markup: keyboard,
  });
});

// Contact message handler
bot.on(":contact", async (ctx) => {
  const userId = ctx.from?.id;
  const contact = ctx.message?.contact;
  if (!userId || !contact) return;

  // Qat'iy tekshiruv: telefon kontakti aynan shu telegram foydalanuvchisiga tegishli ekanligi
  if (contact.user_id !== userId) {
    await ctx.reply(
      "❌ Iltimos, faqat o‘zingizning telefon raqamingizni pastdagi 'Telefon raqamni yuborish' tugmasi orqali yuboring!"
    );
    return;
  }

  const session = chatSessions.get(userId) || {};
  let phone = contact.phone_number;
  if (!phone.startsWith("+")) phone = "+" + phone;

  const firstName = session.tempFirstName || ctx.from?.first_name || "Mijoz";
  const lastName = session.tempLastName || ctx.from?.last_name || "";

  demoStore.upsertUser({
    telegramId: String(userId),
    firstName,
    lastName,
    phone,
  });

  chatSessions.delete(userId);

  // Send main menu with regular keyboard removed
  await ctx.reply("✅ Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi!", {
    reply_markup: { remove_keyboard: true },
  });

  await sendMainMenu(ctx, firstName);
});

// Photo or Document (Receipt) handler
async function handleIncomingReceipt(ctx: any, fileId: string) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = chatSessions.get(userId) || {};
  let targetBookingCode = session.activeBookingCodeForReceipt;

  // Agar sessiyada kod bo'lmasa, userning oxirgi HOLD yoki AWAITING bronini qidirish
  if (!targetBookingCode) {
    const userBookings = demoStore
      .getAllBookings()
      .filter(
        (b) =>
          b.user?.telegramId === String(userId) &&
          (b.status === "HOLD_AWAITING_RECEIPT" || b.status === "AWAITING_ADMIN_APPROVAL")
      );
    if (userBookings.length > 0) {
      targetBookingCode = userBookings[0].code;
    }
  }

  if (!targetBookingCode) {
    await ctx.reply(
      "⚠️ Sizda to‘lov kutilayotgan faol bron topilmadi.\n" +
        "Iltimos, avval Mini App orqali sana tanlab, bron qiling."
    );
    return;
  }

  const result = await bookingService.submitReceipt({
    bookingCode: targetBookingCode,
    telegramFileId: fileId,
    fileUrl: `https://api.telegram.org/file/bot${config.telegram.botToken}/${fileId}`,
  });

  if (!result.success) {
    await ctx.reply(`❌ Xatolik: ${result.error}`);
    return;
  }

  const booking = result.booking;
  await ctx.reply(
    `✅ To‘lov chekingiz qabul qilindi!\n\n` +
      `📌 *Bron kodi*: \`${booking.code}\`\n` +
      `📅 *Sana*: ${formatDateUz(booking.hallDate)}\n` +
      `💰 *Zakalat summasi*: ${formatCurrency(booking.depositAmount)}\n\n` +
      `⏳ *Holati*: Administrator tekshirmoqda.\n` +
      `To‘lov tasdiqlangach sizga darhol tasdiq xabari yuboriladi.`,
    { parse_mode: "Markdown" }
  );

  // Adminlarga inline tugmalar bilan bildirishnoma yuborish
  const payment = booking.payments[0];
  if (payment) {
    const adminKeyboard = new InlineKeyboard()
      .text("✅ Tasdiqlash", `approve_rcpt_${payment.id}`)
      .text("❌ Rad etish", `reject_rcpt_${payment.id}`);

    const adminNotice =
      `🧾 *Yangi to‘lov cheki kelib tushdi!*\n\n` +
      `📌 Bron: \`${booking.code}\`\n` +
      `👤 Mijoz: ${booking.user?.firstName || ""} ${booking.user?.lastName || ""} (${booking.user?.phone || ""})\n` +
      `📅 Sana: ${formatDateUz(booking.hallDate)}\n` +
      `👥 Mehmonlar: ${booking.guestCount} nafar\n` +
      `💰 Zakalat: ${formatCurrency(booking.depositAmount)}\n` +
      `💵 Jami: ${formatCurrency(booking.totalPrice)}`;

    for (const adminId of config.roles.adminTelegramIds) {
      try {
        await ctx.api.sendPhoto(adminId, fileId, {
          caption: adminNotice,
          parse_mode: "Markdown",
          reply_markup: adminKeyboard,
        });
      } catch {
        try {
          await ctx.api.sendMessage(adminId, adminNotice, {
            parse_mode: "Markdown",
            reply_markup: adminKeyboard,
          });
        } catch {
          // ignore notification error in development
        }
      }
    }
  }

  if (session.activeBookingCodeForReceipt) {
    delete session.activeBookingCodeForReceipt;
  }
}

bot.on(":photo", async (ctx) => {
  const photos = ctx.message?.photo;
  if (!photos || photos.length === 0) return;
  const bestPhoto = photos[photos.length - 1];
  await handleIncomingReceipt(ctx, bestPhoto.file_id);
});

bot.on(":document", async (ctx) => {
  const doc = ctx.message?.document;
  if (!doc) return;
  await handleIncomingReceipt(ctx, doc.file_id);
});

// Admin callback query handler
bot.callbackQuery(/^approve_rcpt_(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdminUser(userId)) {
    await ctx.answerCallbackQuery({ text: "Sizda admin huquqi yo'q!", show_alert: true });
    return;
  }

  const paymentId = ctx.match[1];
  const result = await bookingService.verifyPayment({
    paymentId,
    actorTelegramId: String(userId),
    note: "Telegram bot orqali tasdiqlandi",
  });

  if (!result.success || !result.booking) {
    await ctx.answerCallbackQuery({ text: result.error || "Xatolik yuz berdi", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: "To'lov tasdiqlandi!" });
  try {
    await ctx.editMessageCaption({
      caption: (ctx.msg?.caption || "") + `\n\n✅ *TASDIQLANDI* (Admin: ${ctx.from.first_name})`,
      parse_mode: "Markdown",
    });
  } catch {
    // Caption edit fallback
  }

  if (result.booking.user?.telegramId) {
    try {
      await ctx.api.sendMessage(
        result.booking.user.telegramId,
        `🎉 *Tabriklaymiz!*\n\n` +
          `Sizning *${result.booking.code}* raqamli broningiz uchun to‘lov tasdiqlandi!\n` +
          `📅 Sana: ${formatDateUz(result.booking.hallDate)}\n` +
          `💰 To‘langan zakalat: ${formatCurrency(result.booking.depositAmount)}\n` +
          `Sanangiz rasman band qilindi. Doston To‘yxonasi sizni kutadi!`,
        { parse_mode: "Markdown" }
      );
    } catch {
      // client notification failure ignored
    }
  }
});

bot.callbackQuery(/^reject_rcpt_(.+)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdminUser(userId)) {
    await ctx.answerCallbackQuery({ text: "Sizda admin huquqi yo'q!", show_alert: true });
    return;
  }

  const paymentId = ctx.match[1];
  const result = await bookingService.rejectPayment({
    paymentId,
    actorTelegramId: String(userId),
    note: "Telegram bot orqali rad etildi",
  });

  if (!result.success || !result.booking) {
    await ctx.answerCallbackQuery({ text: result.error || "Xatolik", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: "To'lov rad etildi!" });
  try {
    await ctx.editMessageCaption({
      caption: (ctx.msg?.caption || "") + `\n\n❌ *RAD ETILDI* (Admin: ${ctx.from.first_name})`,
      parse_mode: "Markdown",
    });
  } catch {
    // ignore
  }

  if (result.booking.user?.telegramId) {
    try {
      await ctx.api.sendMessage(
        result.booking.user.telegramId,
        `⚠️ *Diqqat!*\n\n` +
          `Sizning *${result.booking.code}* raqamli broningiz uchun yuborilgan to‘lov cheki administrator tomonidan rad etildi.\n` +
          `Iltimos, qayta to‘g‘ri chek yuboring yoki administrator bilan bog‘laning: ${config.venue.phone}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      // ignore
    }
  }
});

// Text message handler (conversation steps)
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const text = ctx.message.text.trim();
  const session = chatSessions.get(userId);

  if (!session || !session.step) {
    // If phone number is sent as text
    const phoneRegex = /^\+?998[0-9]{9}$/;
    if (phoneRegex.test(text.replace(/[\s-]/g, ""))) {
      const cleanPhone = text.startsWith("+") ? text : `+${text}`;
      demoStore.upsertUser({
        telegramId: String(userId),
        firstName: ctx.from.first_name || "Mijoz",
        lastName: ctx.from.last_name || "",
        phone: cleanPhone,
      });
      await ctx.reply("✅ Telefon raqamingiz qabul qilindi!");
      await sendMainMenu(ctx, ctx.from.first_name || "Mijoz");
      return;
    }
    return;
  }

  if (session.step === "WAITING_FIRST_NAME") {
    session.tempFirstName = text;
    session.step = "WAITING_LAST_NAME";
    await ctx.reply(`Rahmat, ${text}!\nEndi familiyangizni kiriting:`);
    return;
  }

  if (session.step === "WAITING_LAST_NAME") {
    session.tempLastName = text;
    session.step = "WAITING_PHONE";

    const phoneKeyboard = new Keyboard()
      .requestContact("📱 Telefon raqamni yuborish")
      .resized()
      .oneTime();

    await ctx.reply(
      `Rahmat! Endi pastdagi tugmani bosib, telefon raqamingizni yuboring\n(yoki +998901234567 shaklida yozing):`,
      { reply_markup: phoneKeyboard }
    );
    return;
  }

  if (session.step === "WAITING_PHONE") {
    const cleanPhone = text.replace(/[\s-]/g, "");
    if (/^\+?998[0-9]{9}$/.test(cleanPhone)) {
      const formatted = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
      demoStore.upsertUser({
        telegramId: String(userId),
        firstName: session.tempFirstName || ctx.from.first_name || "Mijoz",
        lastName: session.tempLastName || ctx.from.last_name || "",
        phone: formatted,
      });
      chatSessions.delete(userId);
      await ctx.reply("✅ Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi!", {
        reply_markup: { remove_keyboard: true },
      });
      await sendMainMenu(ctx, session.tempFirstName || "Mijoz");
    } else {
      await ctx.reply(
        "❌ Noto‘g‘ri telefon raqami formati. Iltimos, pastdagi 'Telefon raqamni yuborish' tugmasidan foydalaning yoki +998901234567 formatida kiriting:"
      );
    }
  }
});
