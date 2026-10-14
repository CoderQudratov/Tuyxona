"use client";

import React from "react";
import { Minus, Plus, Users } from "lucide-react";

interface GuestStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function GuestStepper({
  value,
  onChange,
  min = 50,
  max = 500,
  step = 10,
}: GuestStepperProps) {
  const handleDecrement = () => {
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, value + step);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (!isNaN(raw)) {
      onChange(Math.min(max, Math.max(min, raw)));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Mehmonlar soni</h4>
            <p className="text-xs text-slate-400">Minimal: {min}, Maksimal: {max} nafar</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-600">
          ±{step} ta
        </span>
      </div>

      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-200">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg transition ${
            value <= min
              ? "bg-slate-200/60 text-slate-400 cursor-not-allowed"
              : "bg-white text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-100 active:scale-95"
          }`}
          title={`${step} taga kamaytirish`}
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={handleInputChange}
            className="w-24 text-center font-extrabold text-2xl bg-transparent text-slate-900 focus:outline-none"
          />
          <span className="text-[11px] text-slate-500 font-medium">nafar mehmon</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg transition ${
            value >= max
              ? "bg-slate-200/60 text-slate-400 cursor-not-allowed"
              : "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 active:scale-95"
          }`}
          title={`${step} taga oshirish`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
