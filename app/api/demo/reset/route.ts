import { NextResponse } from "next/server";
import { demoStore } from "@/lib/store/demo-store";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST() {
  // Faqat DEMO rejimida ishlash
  if (!config.app.isDemoMode) {
    return NextResponse.json({ error: "Reset endpointi faqat demo rejimida ishlaydi" }, { status: 403 });
  }

  demoStore.resetDemoData();
  return NextResponse.json({ success: true, message: "Demo ma'lumotlar boshlang'ich holatga qaytarildi" });
}

