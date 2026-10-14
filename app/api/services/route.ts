import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/store/demo-store";
import { z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth/telegram";

export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Xizmat nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: z.string().optional().default(""),
  price: z.number().int().nonnegative("Narx musbat son bo'lishi kerak"),
  icon: z.string().optional().default("Star"),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const services = demoStore.getServices();
    return NextResponse.json({ services });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Xizmatlarni olishda xatolik";
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
    const parsed = serviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri ma'lumotlar", details: parsed.error.format() }, { status: 400 });
    }

    if (parsed.data.id) {
      const updated = demoStore.updateService(parsed.data.id, parsed.data);
      if (!updated) {
        return NextResponse.json({ error: "Xizmat topilmadi" }, { status: 404 });
      }
      return NextResponse.json({ success: true, service: updated });
    } else {
      const created = demoStore.createService({
        name: parsed.data.name,
        description: parsed.data.description || "",
        price: parsed.data.price,
        icon: parsed.data.icon || "Star",
        isActive: parsed.data.isActive,
      });
      return NextResponse.json({ success: true, service: created }, { status: 201 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Xizmatni saqlashda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

