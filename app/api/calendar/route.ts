import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Noto'g'ri yil yoki oy" }, { status: 400 });
    }

    const days = await bookingService.getMonthlyCalendar(year, month);
    return NextResponse.json({ year, month, days });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kalendar ma'lumotlarini olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

