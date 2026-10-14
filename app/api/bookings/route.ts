import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";
import { getAuthenticatedSession } from "@/lib/auth/telegram";
import { demoStore } from "@/lib/store/demo-store";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBookingSchema = z.object({
  hallDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  guestCount: z.number().int().min(50).max(600),
  serviceIds: z.array(z.string()).default([]),
  paymentMethod: z.enum(["CARD_DEPOSIT", "CASH"]).default("CARD_DEPOSIT"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const bookings = await bookingService.listBookings({
      search,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({ bookings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bronlarni olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);

    if (!session.isValid || !session.user) {
      return NextResponse.json(
        { error: session.error || "Ruxsatsiz so'rov: Telegram initData tasdiqlanmadi" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri so'rov parametrlari", details: parsed.error.format() }, { status: 400 });
    }

    // Foydalanuvchini aniqlash yoki yaratish (mavjud telefon raqamini saqlagan holda)
    const existing = demoStore.getUserByTelegramId(String(session.user.id));
    const user = demoStore.upsertUser({
      telegramId: String(session.user.id),
      firstName: session.user.first_name,
      lastName: session.user.last_name || null,
      phone: existing?.phone || null,
    });
    const userId = user.id;

    const result = await bookingService.createBooking({
      userId,
      hallDate: parsed.data.hallDate,
      guestCount: parsed.data.guestCount,
      serviceIds: parsed.data.serviceIds,
      paymentMethod: parsed.data.paymentMethod,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 409 });
    }

    return NextResponse.json({ success: true, booking: result.booking }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bron yaratishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

