"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";

interface StickySummaryProps {
  totalPrice: number;
  depositAmount: number;
  depositPercent?: number;
  onContinue: () => void;
  continueText?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function StickySummary({
  totalPrice,
  depositAmount,
  depositPercent = 10,
  onContinue,
  continueText = "Davom etish",
  disabled = false,
  loading = false,
}: StickySummaryProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-[11px] text-slate-500 font-medium">Jami:</span>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg">
              {formatCurrency(totalPrice)}
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {depositPercent}% zakalat: {formatCurrency(depositAmount)}
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={disabled || loading}
          className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-md active:scale-95 ${
            disabled
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Yuklanmoqda...</span>
            </>
          ) : (
            <>
              <span>{continueText}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
