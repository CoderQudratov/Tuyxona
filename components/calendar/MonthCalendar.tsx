"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { DayAvailability } from "@/lib/types";

interface MonthCalendarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  className?: string;
}

const MONTH_NAMES_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

const WEEKDAYS_UZ = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  className = "",
}: MonthCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/calendar?year=${currentYear}&month=${currentMonth}`)
      .then((res) => {
        if (!res.ok) throw new Error("Kalendar ma'lumotlarini yuklab bo'lmadi");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setDays(data.days || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
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

  // Birinchi kun haftaning qaysi kunidan boshlanishi (1 = Dushanba, ..., 7 = Yakshanba)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Yakshanba 0 bo'lsa, 7 deb olamiz
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // O'tgan oyga o'tishni cheklash (agar joriy oydan oldin bo'lsa)
  const isPastMonth =
    currentYear < today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth <= today.getMonth() + 1);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 ${className}`}>
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-base sm:text-lg">
            {MONTH_NAMES_UZ[currentMonth - 1]} {currentYear}
          </h3>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPastMonth}
            className={`p-2 rounded-lg border transition ${
              isPastMonth
                ? "border-slate-100 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
            title="Oldingi oy"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            title="Keyingi oy"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels (Monday to Sunday) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {WEEKDAYS_UZ.map((w, idx) => (
          <div
            key={w}
            className={`text-xs font-semibold py-1 ${
              idx >= 5 ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="h-60 flex flex-col items-center justify-center space-y-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs">Sanalar yuklanmoqda...</span>
        </div>
      ) : error ? (
        <div className="h-60 flex flex-col items-center justify-center space-y-2 text-red-500">
          <span className="text-xs">{error}</span>
          <button
            type="button"
            onClick={() => setCurrentMonth((m) => m)}
            className="text-xs underline text-slate-600"
          >
            Qayta yuklash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty offset slots for preceding days */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12" />
          ))}

          {/* Days of current month */}
          {days.map((day) => {
            const isSelected = selectedDate === day.date;
            const isAvailable = day.status === "AVAILABLE" && !day.isPast;
            const isBooked = day.status === "BOOKED";
            const isHold = day.status === "HOLD";

            let buttonStyles = "border border-transparent text-slate-700 hover:bg-emerald-50 hover:border-emerald-200";

            if (day.isPast) {
              buttonStyles = "text-slate-300 bg-slate-50 cursor-not-allowed";
            } else if (isSelected) {
              buttonStyles =
                "bg-emerald-700 text-white font-bold shadow-md shadow-emerald-700/30 ring-2 ring-emerald-500 ring-offset-2";
            } else if (isBooked) {
              buttonStyles =
                "bg-red-50 text-red-500 border border-red-200 cursor-not-allowed font-medium";
            } else if (isHold) {
              buttonStyles =
                "bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed font-medium";
            } else if (isAvailable) {
              buttonStyles =
                "bg-white border border-slate-200 text-slate-800 hover:border-emerald-500 hover:text-emerald-700 font-semibold";
            }

            return (
              <button
                key={day.date}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelectDate(day.date)}
                className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-150 relative ${buttonStyles}`}
              >
                <span className="text-xs sm:text-sm">{day.dayOfMonth}</span>

                {/* Sub-label under day */}
                {isSelected ? (
                  <span className="text-[9px] font-medium leading-none mt-0.5 text-emerald-100">
                    Tanlandi
                  </span>
                ) : isBooked ? (
                  <span className="text-[9px] font-medium leading-none mt-0.5 text-red-500">
                    Band
                  </span>
                ) : isHold ? (
                  <span className="text-[9px] font-medium leading-none mt-0.5 text-amber-600">
                    Kutilmoqda
                  </span>
                ) : isAvailable ? (
                  <span className="text-[8px] leading-none mt-0.5 text-emerald-600 font-normal">
                    Bo‘sh
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
          <span>Bo‘sh sana</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span>Band</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Vaqtincha ushlangan</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" />
          <span>Tanlangan</span>
        </div>
      </div>
    </div>
  );
}
