"use client";

import { useEffect, useState } from "react";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [initData, setInitData] = useState("");
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor?.("#14532d"); // Dark green header
      } catch {
        // ignore
      }
      setInitData(tg.initData);
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      setIsInsideTelegram(true);
      setIsReady(true);
    } else {
      // Brauzer tashqarisida ochilganda demo session
      setIsInsideTelegram(false);
      setUser({
        id: 123456789,
        first_name: "Doston",
        last_name: "Qodirov",
        username: "doston_demo",
      });
      setIsReady(true);
    }
  }, []);

  return {
    isReady,
    initData,
    user,
    isInsideTelegram,
    tg: typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null,
  };
}

