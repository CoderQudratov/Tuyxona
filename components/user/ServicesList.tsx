"use client";

import { Check, Sparkles, Camera, Music, Flower2, Star } from "lucide-react";
import { ServiceRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ServicesListProps {
  services: ServiceRecord[];
  selectedServiceIds: string[];
  onToggleService: (serviceId: string) => void;
}

function getServiceIcon(iconName?: string | null) {
  switch (iconName) {
    case "Flower2":
      return <Flower2 className="w-5 h-5 text-rose-500" />;
    case "Music":
      return <Music className="w-5 h-5 text-indigo-500" />;
    case "Camera":
      return <Camera className="w-5 h-5 text-amber-500" />;
    default:
      return <Sparkles className="w-5 h-5 text-emerald-600" />;
  }
}

export function ServicesList({
  services,
  selectedServiceIds,
  onToggleService,
}: ServicesListProps) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-slate-900">Qo‘shimcha xizmatlar</h4>
            <p className="text-xs text-slate-500">To‘yingizni yanada unutilmas qilish uchun</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          {selectedServiceIds.length} ta tanlandi
        </span>
      </div>

      <div className="space-y-2.5">
        {services.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);

          return (
            <div
              key={service.id}
              onClick={() => onToggleService(service.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-xs">
                  {getServiceIcon(service.icon)}
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">{service.name}</h5>
                  <p className="text-xs text-slate-500 line-clamp-1">{service.description}</p>
                  <p className="text-xs font-bold text-emerald-800 mt-1">
                    +{formatCurrency(service.price)}
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                  isSelected
                    ? "bg-emerald-800 border-emerald-800 text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

