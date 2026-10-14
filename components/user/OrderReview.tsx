"use client";

import React from "react";
import { ServiceRecord, PaymentMethod } from "@/lib/types";
import { formatCurrency, formatDateUz } from "@/lib/utils";
import { CreditCard, Banknote, Calendar, Users, Building, ShieldCheck } from "lucide-react";

interface OrderReviewProps {
  date: string;
  guestCount: number;
  hallPrice: number;
  selectedServices: ServiceRecord[];
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading?: boolean;
}

export function OrderReview({
  date,
  guestCount,
  hallPrice,
  selectedServices,
  totalPrice,
  depositAmount,
  remainingAmount,
  paymentMethod,
  onPaymentMethodChange,
  onConfirm,
  onBack,
  loading = false,
}: OrderReviewProps) {
  return (
    <div className="space-y-4 pb-24">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-lg mb-1">Buyurtmani ko‘rib chiqish</h3>
        <p className="text-xs text-slate-500">
          Iltimos, tanlangan ma'lumotlarni tekshiring va qulay to‘lov usulini tanlang.
        </p>

        {/* Selected date & guests badge */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">To‘y sanasi</span>
              <span className="text-xs font-bold text-slate-800">{formatDateUz(date)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Mehmonlar</span>
              <span className="text-xs font-bold text-slate-800">{guestCount} nafar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">Xizmatlar va narxlar</h4>

        <div className="divide-y divide-slate-100 text-sm">
          {/* Main hall */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-700">Asosiy zal ijarasi</span>
            </div>
            <span className="font-semibold text-slate-900">{formatCurrency(hallPrice)}</span>
          </div>

          {/* Selected services */}
          {selectedServices.map((srv) => (
            <div key={srv.id} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 pl-6">• {srv.name}</span>
              <span className="font-medium text-slate-800">{formatCurrency(srv.price)}</span>
            </div>
          ))}

          {selectedServices.length === 0 && (
            <div className="py-2 text-xs text-slate-400 italic pl-6">
              Qo‘shimcha xizmatlar tanlanmagan
            </div>
          )}

          {/* Subtotals */}
          <div className="pt-3 pb-1 flex items-center justify-between font-bold text-base text-slate-900">
            <span>Jami summa:</span>
            <span>{formatCurrency(totalPrice)}</span>
          </div>

          <div className="py-2 flex items-center justify-between text-xs text-emerald-700 font-bold bg-emerald-50/60 px-3 rounded-lg -mx-1">
            <span>Minimal zakalat (10%):</span>
            <span className="text-sm">{formatCurrency(depositAmount)}</span>
          </div>

          <div className="py-2 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>To‘y kuni to‘lanadigan qoldiq:</span>
            <span className="font-semibold text-slate-700">{formatCurrency(remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment method selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">To‘lov usulini tanlang</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card option */}
          <div
            onClick={() => onPaymentMethodChange("CARD_DEPOSIT")}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
              paymentMethod === "CARD_DEPOSIT"
                ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                paymentMethod === "CARD_DEPOSIT"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">Karta orqali zakalat</span>
              <span className="text-xs text-slate-500 block mt-0.5 leading-relaxed">
                10% zakalat ({formatCurrency(depositAmount)}) to‘lab, sanani 1 soatga darhol ushlab turish.
              </span>
            </div>
          </div>

          {/* Cash option */}
          <div
            onClick={() => onPaymentMethodChange("CASH")}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
              paymentMethod === "CASH"
                ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div
              className={`p-2 rounded-lg ${
                paymentMethod === "CASH"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">Naqd to‘lov</span>
              <span className="text-xs text-slate-500 block mt-0.5 leading-relaxed">
                Ofisga kelib yoki administrator bilan uchrashib naqd to‘lash so‘rovi.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Barcha to‘lovlar va bronlar server tranzaksiyalari orqali qat'iy himoyalanadi.</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
        >
          ← Ortga
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-[2] py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>{paymentMethod === "CARD_DEPOSIT" ? "To‘lovga o‘tish" : "Bron so‘rovini yuborish"}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
