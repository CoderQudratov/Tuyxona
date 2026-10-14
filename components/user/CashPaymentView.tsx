"use client";

import React from "react";
import { BookingRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Phone, Clock, AlertCircle, PhoneCall } from "lucide-react";

interface CashPaymentViewProps {
  booking: BookingRecord;
  venueName: string;
  venueAddress: string;
  venuePhone: string;
  onViewStatus: () => void;
}

export function CashPaymentView({
  booking,
  venueName,
  venueAddress,
  venuePhone,
  onViewStatus,
}: CashPaymentViewProps) {
  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-xl">Naqd to‘lov so‘rovi qabul qilindi</h3>
        <p className="text-xs text-slate-500 mt-1">Bron kodi: <strong className="text-slate-800">{booking.code}</strong></p>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Kelishilgan zakalat:</span>
            <span className="font-bold text-slate-900">{formatCurrency(booking.depositAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Holat:</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[11px]">
              Naqd to‘lov kelishilmoqda
            </span>
          </div>
        </div>
      </div>

      {/* Venue address & contact */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <h4 className="font-bold text-slate-800 text-sm">To‘yxona ofisi ma'lumotlari</h4>

        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block">Manzil:</span>
              <span className="font-semibold text-slate-800">{venueAddress}</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Phone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block">Aloqa telefoni:</span>
              <span className="font-semibold text-slate-800">{venuePhone}</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block">Ish vaqti:</span>
              <span className="font-semibold text-slate-800">Har kuni 09:00 dan 20:00 gacha</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start space-x-2.5">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            Naqd to‘lov so‘rovi yuborildi. Administrator siz bilan bog‘lanib sanani va uchrashuv vaqtini aniqlashtiradi. To‘lov ofisda qabul qilingach, bron to‘liq tasdiqlanadi.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <a
          href={`tel:${venuePhone.replace(/[\s-]/g, "")}`}
          className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 transition"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Administrator bilan bog‘lanish</span>
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
