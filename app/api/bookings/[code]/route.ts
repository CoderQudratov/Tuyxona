import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";
import { validateTelegramInitData } from "@/lib/auth/telegram";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code;
    const booking = await bookingService.getBookingByCode(code);

    if (!booking) {
      return NextResponse.json({ error: "Bron topilmadi" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bronni olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const session = validateTelegramInitData(initData);

    if (!session.isValid || (session.role !== "ADMIN" && session.role !== "BOSS")) {
      return NextResponse.json({ error: "Faqat administrator bekor qilishi mumkin" }, { status: 403 });
    }

    const booking = await bookingService.getBookingByCode(params.code);
    if (!booking) {
      return NextResponse.json({ error: "Bron topilmadi" }, { status: 404 });
    }

    let reason = "Admin tomonidan bekor qilindi";
    try {
      const body = await req.json();
      if (body.reason) reason = body.reason;
    } catch {
      // no body
    }

    const result = await bookingService.cancelBooking({
      bookingId: booking.id,
      actorTelegramId: session.user ? String(session.user.id) : "admin",
      reason,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bronni bekor qilishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

