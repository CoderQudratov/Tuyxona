import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";
import { getAuthenticatedSession } from "@/lib/auth/telegram";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  paymentId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);

    if (!session.isValid) {
      return NextResponse.json({ error: session.error || "Ruxsatsiz so'rov" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "BOSS") {
      return NextResponse.json({ error: "Faqat administrator to'lovni tasdiqlashi yoki rad etishi mumkin" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri parametrlar", details: parsed.error.format() }, { status: 400 });
    }

    const actorTelegramId = session.user ? String(session.user.id) : "admin";

    if (parsed.data.action === "APPROVE") {
      const result = await bookingService.verifyPayment({
        paymentId: parsed.data.paymentId,
        actorTelegramId,
        note: parsed.data.note,
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    } else {
      const result = await bookingService.rejectPayment({
        paymentId: parsed.data.paymentId,
        actorTelegramId,
        note: parsed.data.note,
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "To'lovni ko'rib chiqishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

