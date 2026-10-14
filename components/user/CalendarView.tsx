"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { DayAvailability } from "@/lib/types";

interface CalendarViewProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const MONTH_NAMES_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

const WEEKDAYS_UZ = ["Dush", "Sesh", "Chor", "Pay", "Juma", "Shan", "Yak"];

export function CalendarView({ selectedDate, onSelectDate }: CalendarViewProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("Serverdan bandlik ma'lumotlarini olib bo'lmadi");
      const data = await res.json();
      setDays(data.days || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    // Joriy oydan oldinga o'tib ketmaslik
    const today = new Date();
    if (currentYear === today.getFullYear() && currentMonth <= today.getMonth() + 1) {
      return;
    }
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Oyning 1-kuni haftaning qaysi kuniga to'g'ri kelishi (Dushanba = 0 ... Yakshanba = 6)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // JS getDay(): Yakshanba = 0, Dushanba = 1 ... Shanba = 6
  // Bizda Dushanba boshlanadi: 0 -> 6, 1 -> 0, 2 -> 1, ..., 6 -> 5
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isPrevDisabled =
    currentYear === now.getFullYear() && currentMonth <= now.getMonth() + 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 md:p-6">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-900">
            {MONTH_NAMES_UZ[currentMonth - 1]} {currentYear}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className={`p-2 rounded-lg border transition ${
              isPrevDisabled
                ? "border-slate-100 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title="Oldingi oy"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            title="Keyingi oy"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Bo‘sh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-600">Band</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-600">Vaqtincha ushlangan</span>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAYS_UZ.map((dayName, idx) => (
          <div
            key={dayName}
            className={`text-xs font-semibold py-1 ${
              idx >= 5 ? "text-amber-700" : "text-slate-500"
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-800" />
          <span className="text-xs">Sanalar yuklanmoqda...</span>
        </div>
      ) : error ? (
        <div className="h-60 flex flex-col items-center justify-center gap-2 text-center p-4">
          <p className="text-xs text-rose-600">{error}</p>
          <button
            onClick={() => fetchAvailability(currentYear, currentMonth)}
            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
          >
            Qayta urinish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Empty offset days */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="h-10 md:h-12" />
          ))}

          {/* Actual days */}
          {days.map((item) => {
            const isSelected = selectedDate === item.date;
            const isAvailable = item.status === "AVAILABLE";
            const isBooked = item.status === "BOOKED";
            const isHold = item.status === "HOLD";
            const isPast = item.status === "PAST";

            let cellClass = "border text-slate-700 bg-white hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer";

            if (isSelected) {
              cellClass = "bg-emerald-800 text-white font-bold border-emerald-800 shadow-md scale-105 z-10";
            } else if (isPast) {
              cellClass = "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed";
            } else if (isBooked) {
              cellClass = "bg-rose-50 text-rose-400 border-rose-100 cursor-not-allowed";
            } else if (isHold) {
              cellClass = "bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed";
            }

            return (
              <button
                key={item.date}
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectDate(item.date)}
                className={`h-10 md:h-12 rounded-xl flex flex-col items-center justify-center transition-all relative text-xs md:text-sm font-medium ${cellClass}`}
              >
                <span>{item.dayOfMonth}</span>

                {isBooked && (
                  <span className="w-1 h-1 rounded-full bg-rose-500 absolute bottom-1" />
                )}
                {isHold && (
                  <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1" />
                )}
                {isAvailable && !isSelected && (
                  <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1 opacity-40" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

