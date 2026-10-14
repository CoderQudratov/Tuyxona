/**
 * Telegram WebApp SDK yordamchi funksiyalari
 */

export function getTelegramWebApp(): any {
  if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
}

export function initTelegramWebApp(): void {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
    } catch (e) {
      console.warn("Telegram WebApp ready() chaqirishda ogohlantirish:", e);
    }
  }
}

export function getTelegramInitData(): string {
  const tg = getTelegramWebApp();
  return tg?.initData || "";
}

export async function fetchWithTgAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const initData = getTelegramInitData();
  const headers = new Headers(options.headers || {});

  if (initData) {
    headers.set("x-telegram-init-data", initData);
    headers.set("Authorization", `tma ${initData}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
