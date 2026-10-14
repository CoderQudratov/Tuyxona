"use client";

import React, { useState, useEffect } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { GuestStepper } from "@/components/user/GuestStepper";
import { ServiceCard } from "@/components/user/ServiceCard";
import { StickySummary } from "@/components/user/StickySummary";
import { OrderReview } from "@/components/user/OrderReview";
import { CardPaymentView } from "@/components/user/CardPaymentView";
import { CashPaymentView } from "@/components/user/CashPaymentView";
import { BookingTrackerView } from "@/components/user/BookingTrackerView";
import { ServiceRecord, BookingRecord, PaymentMethod } from "@/lib/types";
import { calculateBookingPrice } from "@/lib/booking/pricing";
import { formatCurrency, formatDateUz } from "@/lib/utils";
import {
  Sparkles,
  Calendar as CalendarIcon,
  Search,
  Shield,
  Phone,
  MapPin,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { initTelegramWebApp, fetchWithTgAuth } from "@/lib/telegram/webapp";

type FlowStep = "HOME" | "CALENDAR" | "SERVICES" | "REVIEW" | "PAYMENT" | "TRACKER";

export default function UserMiniApp() {
  const [step, setStep] = useState<FlowStep>("HOME");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState<number>(150);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD_DEPOSIT");

  // User profile & bookings state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<BookingRecord[]>([]);

  // Created booking state
  const [currentBooking, setCurrentBooking] = useState<BookingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search booking by code input
  const [searchCode, setSearchCode] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Venue config
  const venue = {
    name: "Doston To'yxonasi",
    mainHallPrice: 12000000,
    depositPercent: 10,
    capacity: 500,
    phone: "+998 90 123 45 67",
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor ko'chasi 42-uy",
    cardNumber: "8600 5500 1234 5678",
    cardHolder: "Doston To'yxonasi",
    botUsername: "doston_tuyxona_bot",
  };

  // Telegram WebApp initialization and profile loading
  useEffect(() => {
    initTelegramWebApp();

    // Load authenticated user profile
    fetchWithTgAuth("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.warn("Profil yuklanmadi:", err));

    // Fetch user bookings
    fetchWithTgAuth("/api/bookings")
      .then((res) => res.json())
      .then((data) => {
        if (data.bookings) {
          setMyBookings(data.bookings);
        }
      })
      .catch((err) => console.warn("Bronlar yuklanmadi:", err));
  }, []);

  // Fetch active services
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          setServices(data.services.filter((s: ServiceRecord) => s.isActive));
        }
      })
      .catch((err) => console.error("Xizmatlar yuklanmadi:", err));
  }, []);

  // Calculate pricing breakdown
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const pricing = calculateBookingPrice(
    venue.mainHallPrice,
    selectedServices.map((s) => s.price),
    venue.depositPercent
  );

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle booking creation
  const handleCreateBooking = async () => {
    if (!selectedDate) {
      setError("Iltimos, avval to‘y sanasini tanlang.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchWithTgAuth("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hallDate: selectedDate,
          guestCount,
          serviceIds: selectedServiceIds,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Bron yaratishda xatolik yuz berdi");
      }

      setCurrentBooking(data.booking);
      setMyBookings((prev) => [data.booking, ...prev.filter((b) => b.id !== data.booking.id)]);
      setStep("PAYMENT");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Search existing booking
  const handleSearchBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearchLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${searchCode.trim().toUpperCase()}`);
      if (!res.ok) throw new Error("Ushbu kodli bron topilmadi");
      const data = await res.json();
      setCurrentBooking(data.booking);
      setStep("TRACKER");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bron topilmadi");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div
            onClick={() => setStep("HOME")}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-none">
                {venue.name}
              </h1>
              <span className="text-[10px] text-emerald-200">Onlayn Bron Tizimi</span>
            </div>
          </div>

          {step !== "HOME" && (
            <button
              type="button"
              onClick={() => setStep("HOME")}
              className="px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold transition"
            >
              Bosh sahifa
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Error notification banner */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span className="flex-1 font-medium">{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= STEP 0: HOME / SHOWCASE ================= */}
        {step === "HOME" && (
          <div className="space-y-4">
            {/* Authenticated user badge if available */}
            {currentUser && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-2 text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    {currentUser.firstName?.[0] || "U"}
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block leading-tight">
                      {currentUser.firstName} {currentUser.lastName || ""}
                    </span>
                    {currentUser.phone && (
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {currentUser.phone}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Mijoz profili
                </span>
              </div>
            )}

            {/* Hero Card */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-800 to-slate-900 text-white p-6 shadow-md">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-200 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Premium To‘yxona</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight mb-2">
                Doston To‘yxonasi
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed mb-4">
                500 nafargacha mehmonlar uchun muhtasham zal, professional bezaklar va yuqori darajadagi xizmat.
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-emerald-300 block text-[10px]">Asosiy zal narxi:</span>
                  <span className="font-extrabold text-base text-white">
                    {formatCurrency(venue.mainHallPrice)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-300 block text-[10px]">Zakalat:</span>
                  <span className="font-bold text-emerald-300">10% oldindan</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep("CALENDAR")}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 text-left transition group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Bron qilish</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Sana tanlash va hisoblash</p>
              </button>

              <button
                type="button"
                onClick={() => setStep("CALENDAR")}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-500 text-left transition group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Bo‘sh sanalar</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Kalendarni ko‘rish</p>
              </button>
            </div>

            {/* My Bookings Section (if user has any) */}
            {myBookings.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Mening bronlarim ({myBookings.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">Holatni ko‘rish uchun bosing</span>
                </div>
                <div className="space-y-2">
                  {myBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setCurrentBooking(b);
                        setStep("TRACKER");
                      }}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/70 hover:border-emerald-200 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-950">
                            {b.code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "AWAITING_ADMIN_APPROVAL"
                                ? "bg-blue-100 text-blue-800"
                                : b.status === "HOLD_AWAITING_RECEIPT" || b.status === "PENDING_CASH_CONFIRMATION"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {b.status === "CONFIRMED"
                              ? "Tasdiqlangan"
                              : b.status === "AWAITING_ADMIN_APPROVAL"
                              ? "Admin tekshiruvida"
                              : b.status === "HOLD_AWAITING_RECEIPT"
                              ? "Chek kutilmoqda"
                              : b.status === "PENDING_CASH_CONFIRMATION"
                              ? "Naqd to‘lov"
                              : b.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Sana: <strong className="text-slate-700">{formatDateUz(b.hallDate)}</strong> • {b.guestCount} mehmon
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Booking By Code */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                Mavjud bron holatini tekshirish
              </h4>
              <form onSubmit={handleSearchBooking} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masalan: DST-2026-0001"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tekshirish"}
                </button>
              </form>
            </div>

            {/* Venue Details */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{venue.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{venue.phone}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: CALENDAR ================= */}
        {step === "CALENDAR" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">To‘y sanasini tanlang</h2>
                <p className="text-xs text-slate-500">Bo‘sh sanalardan birini bosing</p>
              </div>
              {selectedDate && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                  {formatDateUz(selectedDate)}
                </span>
              )}
            </div>

            <MonthCalendar
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />

            {selectedDate && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    Tanlangan sana:
                  </span>
                  <span className="font-extrabold text-sm text-emerald-950">
                    {formatDateUz(selectedDate, { withWeekday: true })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("SERVICES")}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition"
                >
                  <span>Davom etish</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: SERVICES & GUESTS ================= */}
        {step === "SERVICES" && (
          <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Mehmonlar va xizmatlar</h2>
                <p className="text-xs text-slate-500">Sana: {selectedDate ? formatDateUz(selectedDate) : ""}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("CALENDAR")}
                className="text-xs text-emerald-700 underline font-semibold"
              >
                Sanani o‘zgartirish
              </button>
            </div>

            {/* Guest count stepper */}
            <GuestStepper
              value={guestCount}
              onChange={(val) => setGuestCount(val)}
              min={50}
              max={venue.capacity}
              step={10}
            />

            {/* Extra services list */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Qo‘shimcha xizmatlar</h3>
              <div className="space-y-2.5">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedServiceIds.includes(service.id)}
                    onToggle={() => toggleService(service.id)}
                  />
                ))}
              </div>
            </div>

            {/* Sticky summary bar */}
            <StickySummary
              totalPrice={pricing.totalPrice}
              depositAmount={pricing.depositAmount}
              depositPercent={venue.depositPercent}
              onContinue={() => setStep("REVIEW")}
              continueText="Buyurtmani tekshirish"
            />
          </div>
        )}

        {/* ================= STEP 3: ORDER REVIEW ================= */}
        {step === "REVIEW" && (
          <OrderReview
            date={selectedDate!}
            guestCount={guestCount}
            hallPrice={venue.mainHallPrice}
            selectedServices={selectedServices}
            totalPrice={pricing.totalPrice}
            depositAmount={pricing.depositAmount}
            remainingAmount={pricing.remainingAmount}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(m) => setPaymentMethod(m)}
            onConfirm={handleCreateBooking}
            onBack={() => setStep("SERVICES")}
            loading={loading}
          />
        )}

        {/* ================= STEP 4: PAYMENT SCREEN ================= */}
        {step === "PAYMENT" && currentBooking && (
          <>
            {currentBooking.paymentMethod === "CARD_DEPOSIT" ? (
              <CardPaymentView
                booking={currentBooking}
                cardNumber={venue.cardNumber}
                cardHolder={venue.cardHolder}
                botUsername={venue.botUsername}
                onViewStatus={() => setStep("TRACKER")}
              />
            ) : (
              <CashPaymentView
                booking={currentBooking}
                venueName={venue.name}
                venueAddress={venue.address}
                venuePhone={venue.phone}
                onViewStatus={() => setStep("TRACKER")}
              />
            )}
          </>
        )}

        {/* ================= STEP 5: BOOKING TRACKER ================= */}
        {step === "TRACKER" && currentBooking && (
          <BookingTrackerView
            initialBookingCode={currentBooking.code}
            botUsername={venue.botUsername}
            onBackToHome={() => setStep("HOME")}
          />
        )}
      </main>
    </div>
  );
}
