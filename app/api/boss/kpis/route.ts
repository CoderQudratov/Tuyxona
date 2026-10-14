import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";
import { demoStore } from "@/lib/store/demo-store";
import { getAuthenticatedSession } from "@/lib/auth/telegram";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);

    if (!session.isValid) {
      return NextResponse.json({ error: session.error || "Ruxsatsiz so'rov" }, { status: 401 });
    }

    if (session.role !== "BOSS") {
      return NextResponse.json({ error: "Faqat to'yxona egasi (Boss) uchun ruxsat berilgan" }, { status: 403 });
    }

    const kpis = await bookingService.getBossKpis();
    const auditLogs = demoStore.getAuditLogs().slice(0, 20);

    return NextResponse.json({ kpis, auditLogs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "KPI ma'lumotlarini olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

