import { NextRequest, NextResponse } from "next/server";
import { bot } from "@/lib/telegram/bot";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    if (config.telegram.webhookSecret && secretHeader && secretHeader !== config.telegram.webhookSecret) {
      return NextResponse.json({ error: "Noto'g'ri webhook siri" }, { status: 403 });
    }

    const body = await req.json();
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Telegram webhook xatoligi:", err);
    return NextResponse.json({ ok: false, error: "Xatolik" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    botUsername: config.telegram.botUsername,
    message: "Doston To'yxonasi Telegram Bot Webhook faol.",
  });
}

