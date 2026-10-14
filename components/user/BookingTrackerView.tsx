"use client";

import React, { useState, useEffect } from "react";
import { BookingRecord, BookingStatus } from "@/lib/types";
import { formatCurrency, formatDateUz } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  Building,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface BookingTrackerViewProps {
  initialBookingCode: string;
  botUsername: string;
  onBackToHome: () => void;
}

export function BookingTrackerView({
  initialBookingCode,
  botUsername,
  onBackToHome,
}: BookingTrackerViewProps) {
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${code}`);
      if (!res.ok) throw new Error("Bron ma'lumotlari topilmadi");
      const data = await res.json();
      setBooking(data.booking);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialBookingCode) {
      fetchBooking(initialBookingCode);
    }
  }, [initialBookingCode]);

  // Status badge helper
  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Rasman tasdiqlangan</span>
          </div>
        );
      case "AWAITING_ADMIN_APPROVAL":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
            <Clock className="w-4 h-4 text-blue-600 animate-spin" />
            <span>Administrator tekshirmoqda</span>
          </div>
        );
      case "HOLD_AWAITING_RECEIPT":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Chek kutilmoqda (1 soatlik hold)</span>
          </div>
        );
      case "PENDING_CASH_CONFIRMATION":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Naqd to‘lov kelishilmoqda</span>
          </div>
        );
      case "REJECTED":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-xs">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Rad etildi</span>
          </div>
        );
      case "CANCELLED":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
            <XCircle className="w-4 h-4 text-slate-600" />
            <span>Bekor qilingan</span>
          </div>
        );
      case "EXPIRED":
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span>Muddati tugagan</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-700 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Bron ma'lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h4 className="font-bold text-slate-900">Xatolik</h4>
        <p className="text-xs text-slate-500">{error || "Bron topilmadi"}</p>
        <button
          type="button"
          onClick={onBackToHome}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
        >
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const telegramDeepLink = `https://t.me/${botUsername}?start=receipt_${booking.code}`;

  return (
    <div className="space-y-4 pb-20">
      {/* Top back button */}
      <button
        type="button"
        onClick={onBackToHome}
        className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Bosh sahifaga qaytish</span>
      </button>

      {/* Main status card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-center">
        <span className="text-[11px] text-slate-400 block font-mono uppercase tracking-wider">
          Bron raqami
        </span>
        <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight mt-0.5 mb-3">
          {booking.code}
        </h3>

        <div className="mb-4">{renderStatusBadge(booking.status)}</div>

        {/* Explain status */}
        {booking.status === "CONFIRMED" && (
          <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl leading-relaxed">
            Tabriklaymiz! Zakalat qabul qilindi va to‘y sanangiz rasman band qilindi.
          </p>
        )}
        {booking.status === "AWAITING_ADMIN_APPROVAL" && (
          <p className="text-xs text-blue-700 bg-blue-50 p-3 rounded-xl leading-relaxed">
            Chekingiz qabul qilindi. Administratorimiz bank hisobini tekshirib, tasdiqlashi bilan sizga bildirishnoma yuboriladi.
          </p>
        )}
        {booking.status === "HOLD_AWAITING_RECEIPT" && (
          <div className="space-y-2">
            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl leading-relaxed">
              Sanangiz 1 soatga ushlab turilibdi. Iltimos, Telegram chatga to‘lov chekini yuboring.
            </p>
            <a
              href={telegramDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 underline"
            >
              <span>Chek yuborish uchun botni ochish</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {booking.status === "EXPIRED" && (
          <p className="text-xs text-orange-800 bg-orange-50 p-3 rounded-xl leading-relaxed">
            1 soat ichida chek kelib tushmagani sababli bron muddati tugadi va sana yana bo‘shatildi.
          </p>
        )}
      </div>

      {/* Order details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">Bron tafsilotlari</h4>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-500 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>To‘y sanasi:</span>
            </span>
            <span className="font-bold text-slate-800">{formatDateUz(booking.hallDate)}</span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-500 flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Mehmonlar soni:</span>
            </span>
            <span className="font-bold text-slate-800">{booking.guestCount} nafar</span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-500 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Asosiy zal narxi:</span>
            </span>
            <span className="font-semibold text-slate-800">{formatCurrency(booking.hallPriceSnapshot)}</span>
          </div>

          {booking.services.map((bs) => (
            <div key={bs.id} className="py-2 flex items-center justify-between">
              <span className="text-slate-500 pl-5">• {bs.serviceNameSnapshot}</span>
              <span className="font-medium text-slate-800">{formatCurrency(bs.servicePriceSnapshot)}</span>
            </div>
          ))}

          <div className="pt-3 pb-1 flex items-center justify-between font-bold text-sm text-slate-900">
            <span>Umumiy narx:</span>
            <span>{formatCurrency(booking.totalPrice)}</span>
          </div>

          <div className="py-2 flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 px-2 rounded-lg">
            <span>To‘langan / kelishilgan zakalat:</span>
            <span>{formatCurrency(booking.depositAmount)}</span>
          </div>

          <div className="py-2 flex items-center justify-between text-slate-600 font-semibold">
            <span>Qolgan to‘lov:</span>
            <span>{formatCurrency(booking.remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <button
        type="button"
        onClick={() => fetchBooking(booking.code)}
        className="w-full py-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 hover:bg-slate-50 transition"
      >
        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
        <span>Holatni yangilash</span>
      </button>
    </div>
  );
}
