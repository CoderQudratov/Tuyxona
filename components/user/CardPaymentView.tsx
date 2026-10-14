"use client";

import React, { useState, useEffect } from "react";
import { BookingRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Copy, Check, Clock, AlertTriangle, ExternalLink } from "lucide-react";

interface CardPaymentViewProps {
  booking: BookingRecord;
  cardNumber: string;
  cardHolder: string;
  botUsername: string;
  onViewStatus: () => void;
}

export function CardPaymentView({
  booking,
  cardNumber,
  cardHolder,
  botUsername,
  onViewStatus,
}: CardPaymentViewProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("60:00");

  const handleCopy = () => {
    navigator.clipboard.writeText(cardNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-hour expiration countdown
  useEffect(() => {
    if (!booking.expiresAt) return;
    const target = new Date(booking.expiresAt).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking.expiresAt]);

  const telegramDeepLink = `https://t.me/${botUsername}?start=receipt_${booking.code}`;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-center">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-2">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Vaqtincha ushlab turilgan: {timeLeft}</span>
        </div>

        <h3 className="font-extrabold text-slate-900 text-xl">Zakalatni to‘lash</h3>
        <p className="text-xs text-slate-500 mt-1">Bron kodi: <strong className="text-slate-800">{booking.code}</strong></p>

        {/* Deposit amount badge */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-tr from-emerald-800 to-emerald-700 text-white shadow-md">
          <span className="text-xs text-emerald-200 block uppercase tracking-wider font-medium">To‘lanishi kerak bo‘lgan summa</span>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 block">
            {formatCurrency(booking.depositAmount)}
          </span>
          <span className="text-[11px] text-emerald-200 mt-1 block">
            (Jami {formatCurrency(booking.totalPrice)} ning 10% zakalati)
          </span>
        </div>
      </div>

      {/* Card Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">To‘yxona karta rekvizitlari</h4>

        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>UZCARD / HUMO</span>
            <span className="text-[10px] text-emerald-400 font-mono">DEMO REKVIZIT</span>
          </div>

          <div className="font-mono text-xl sm:text-2xl tracking-widest text-emerald-300 font-bold">
            {cardNumber}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
            <span className="text-slate-300 font-medium">{cardHolder}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Nusxa olindi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Nusxalash</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning text */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start space-x-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Muhim:</strong> Sanangiz 1 soatga vaqtincha ushlab turiladi. Shu vaqt ichida to‘lov chekini Telegram chatiga yuboring. Chek kelib tushmasa, bron muddati tugaydi va sana qayta bo‘shatiladi.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">To‘lov yo‘riqnomasi:</h4>

        <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
          <li>Istalgan bank ilovasi (Click, Payme, Uzum va h.k.) orqali yuqoridagi kartaga <strong>{formatCurrency(booking.depositAmount)}</strong> o‘tkazing.</li>
          <li>To‘lov amalga oshirilgan chekni (skrinshot yoki PDF) saqlab oling.</li>
          <li>Pastdagi <strong>“Telegram chatga chek yuborish”</strong> tugmasini bosing.</li>
          <li>Telegram botimizga chek rasmini yuboring. Administrator tekshirib darhol tasdiqlaydi.</li>
        </ol>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-2">
        <a
          href={telegramDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2 transition active:scale-95 text-center"
        >
          <span>Telegram chatga chek yuborish</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={onViewStatus}
          className="w-full py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
        >
          Bron holatini kuzatish
        </button>
      </div>
    </div>
  );
}
