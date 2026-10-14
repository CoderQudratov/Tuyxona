import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

// MUHIM: Ushbu endpoint hech qanday DB / Prisma ulanishini ochmaydi va Neon bazasiga yozmaydi!

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-keep-alive-secret");

  // Agar secret konfiguratsiya qilingan bo'lsa, uni tekshirish
  if (config.keepAlive.secret && secretHeader !== config.keepAlive.secret) {
    return NextResponse.json({ error: "Ruxsat berilmagan (Invalid secret)" }, { status: 401 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    // bo'sh body
  }

  return NextResponse.json({
    status: "ok",
    service: "doston-tuyxonasi-server",
    source: (body as any).source || "keep-alive",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    databaseAccess: "none",
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "doston-tuyxonasi-server",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    databaseAccess: "none",
  });
}

