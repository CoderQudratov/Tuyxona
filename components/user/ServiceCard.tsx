"use client";

import React from "react";
import { Check, Plus, Flower2, Music, Camera, Sparkles } from "lucide-react";
import { ServiceRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ServiceCardProps {
  service: ServiceRecord;
  isSelected: boolean;
  onToggle: () => void;
}

export function ServiceCard({ service, isSelected, onToggle }: ServiceCardProps) {
  // Render relevant icon
  const renderIcon = () => {
    switch (service.icon) {
      case "Flower2":
        return <Flower2 className="w-5 h-5" />;
      case "Music":
        return <Music className="w-5 h-5" />;
      case "Camera":
        return <Camera className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div
      onClick={onToggle}
      className={`relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected
          ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-500"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div>
        <div className="flex items-start justify-between mb-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {renderIcon()}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              isSelected
                ? "bg-emerald-600 text-white"
                : "border border-slate-300 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        <h4 className="font-bold text-slate-800 text-sm mb-1">{service.name}</h4>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">{service.description}</p>
      </div>

      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between">
        <span className="text-xs text-slate-400">Narxi:</span>
        <span className="font-extrabold text-sm text-slate-900">{formatCurrency(service.price)}</span>
      </div>
    </div>
  );
}
