import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth/telegram";
import { demoStore } from "@/lib/store/demo-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);

    if (!session.isValid || !session.user) {
      return NextResponse.json(
        { authenticated: false, error: session.error || "Ruxsatsiz so'rov" },
        { status: 401 }
      );
    }

    // Bazadagi foydalanuvchini olish yoki yangilash
    let dbUser = session.dbUser;
    if (!dbUser) {
      dbUser = demoStore.getUserByTelegramId(String(session.user.id)) || null;
    }

    return NextResponse.json({
      authenticated: true,
      user: dbUser || {
        id: `usr-${session.user.id}`,
        telegramId: String(session.user.id),
        firstName: session.user.first_name,
        lastName: session.user.last_name || null,
        phone: null,
        role: session.role,
      },
      tgUser: session.user,
      role: session.role,
      isDemo: Boolean(session.isDemoFallback),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Autentifikatsiya xatoligi";
    return NextResponse.json({ authenticated: false, error: msg }, { status: 500 });
  }
}
