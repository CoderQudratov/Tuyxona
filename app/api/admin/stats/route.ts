import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";
import { getAuthenticatedSession } from "@/lib/auth/telegram";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);

    if (!session.isValid) {
      return NextResponse.json({ error: session.error || "Ruxsatsiz so'rov" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "BOSS") {
      return NextResponse.json({ error: "Faqat administrator uchun ruxsat berilgan" }, { status: 403 });
    }

    const stats = await bookingService.getAdminDashboardStats();
    return NextResponse.json({ stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Statistikani olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

