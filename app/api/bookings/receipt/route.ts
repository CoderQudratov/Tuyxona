import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/booking/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const receiptSchema = z.object({
  bookingCode: z.string().min(3),
  telegramFileId: z.string().optional(),
  fileUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = receiptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri so'rov parametrlari" }, { status: 400 });
    }

    const result = await bookingService.submitReceipt({
      bookingCode: parsed.data.bookingCode,
      telegramFileId: parsed.data.telegramFileId,
      fileUrl: parsed.data.fileUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Chekni topshirishda xatolik";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

