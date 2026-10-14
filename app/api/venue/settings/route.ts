import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store/demo-store";
import { getAuthenticatedSession } from "@/lib/auth/telegram";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(7),
  mainHallPrice: z.number().int().positive(),
  capacity: z.number().int().positive(),
  depositPercent: z.number().int().min(1).max(100),
  cardNumber: z.string().min(10),
  cardHolder: z.string().min(3),
  holdDurationMinutes: z.number().int().min(10).max(1440),
});

export async function GET() {
  try {
    const venue = demoStore.getVenue();
    return NextResponse.json({ venue });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sozlamalarni olishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);

    if (!session.isValid) {
      return NextResponse.json({ error: session.error || "Ruxsatsiz so'rov" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "BOSS") {
      return NextResponse.json({ error: "Faqat administrator o'zgartirishi mumkin" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri sozlamalar formati", details: parsed.error.format() }, { status: 400 });
    }

    const updated = demoStore.updateVenue(parsed.data);
    return NextResponse.json({ success: true, venue: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sozlamalarni saqlashda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

