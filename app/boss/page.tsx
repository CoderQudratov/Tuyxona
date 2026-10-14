"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Award,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDateUz } from "@/lib/utils";
import { AuditLogRecord } from "@/lib/types";
import { initTelegramWebApp, fetchWithTgAuth } from "@/lib/telegram/webapp";

export default function BossDashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchBossData = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetchWithTgAuth("/api/boss/kpis");
      if (res.status === 401 || res.status === 403) {
        setAuthError("Sizda Boss Dashboard'iga kirish huquqi mavjud emas. Ushbu sahifa faqat to‘yxona egasi (Boss) uchun.");
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error("Boss data error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initTelegramWebApp();
    fetchBossData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Boss Dashboard
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-[10px] tracking-wider uppercase">
                  Mulkdor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Doston To‘yxonasi boshqaruv va sof moliyaviy tahlil paneli
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={fetchBossData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
              <span>Yangilash</span>
            </button>

            <a
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-bold text-xs transition"
            >
              Admin Panelga o‘tish
            </a>
          </div>
        </div>

        {authError ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-amber-500/30 text-center space-y-4 max-w-lg mx-auto my-12 shadow-xl">
            <Crown className="w-12 h-12 text-amber-500/50 mx-auto" />
            <h3 className="text-lg font-bold text-white">Kirish huquqi cheklangan</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{authError}</p>
            <p className="text-[11px] text-amber-400">Faqat to‘yxona egasi Telegram botida (@doston_tuyxona_bot) /boss buyrug‘i orqali kirishi mumkin.</p>
          </div>
        ) : loading && !kpis ? (
          <div className="h-60 flex flex-col items-center justify-center space-y-2 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs">Moliyaviy ko‘rsatkichlar hisoblanmoqda...</span>
          </div>
        ) : kpis ? (
          <>
            {/* Primary Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Actual Collected Cash */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 shadow-lg">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-xs font-semibold">Haqiqiy olingan to‘lov</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(kpis.actualCollected)}
                </div>
                <span className="text-[11px] text-emerald-400/90 mt-1 block">
                  Kassaga kelib tushgan sof mablag‘
                </span>
              </div>

              {/* Total Agreed Revenue */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <span className="text-xs font-semibold">Kelishilgan umumiy daromad</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(kpis.totalAgreedRevenue)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tasdiqlangan barcha bronlar qiymati
                </span>
              </div>

              {/* Pending Debt / Receivables */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-xs font-semibold">Kutilayotgan qarzdorlik</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
                  {formatCurrency(kpis.pendingDebt)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  To‘y kunigacha undirilishi kerak
                </span>
              </div>

              {/* Cancellations */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-red-400 mb-2">
                  <span className="text-xs font-semibold">Bekor qilingan / Rad etilgan</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {kpis.cancelledCount} ta
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Mijoz yoki admin tomonidan
                </span>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">
                    Keyingi 30 kunlik tasdiqlangan to‘ylar
                  </span>
                  <span className="text-3xl font-black text-white mt-1 block">
                    {kpis.next30DaysCount} ta marosim
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">
                    Shu oy band qilingan sanalar
                  </span>
                  <span className="text-3xl font-black text-white mt-1 block">
                    {kpis.currentMonthBookedCount} kun
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Top Ordered Extra Services */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Eng ko‘p buyurtma qilingan qo‘shimcha xizmatlar</span>
                </h3>
              </div>

              {kpis.topServices.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">Hozircha xizmatlar statistikasi yo‘q.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {kpis.topServices.map((srv: any, idx: number) => (
                    <div
                      key={srv.name}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold block">#{idx + 1} O‘rin</span>
                        <h4 className="font-bold text-white text-sm">{srv.name}</h4>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {srv.count} marta buyurtma
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {formatCurrency(srv.totalRevenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Logs */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Boshqaruv va to‘lovlar Audit tarixi</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="pb-3 font-semibold">Vaqt</th>
                      <th className="pb-3 font-semibold">Amal (Action)</th>
                      <th className="pb-3 font-semibold">Bajaruvchi (Actor)</th>
                      <th className="pb-3 font-semibold">Tafsilotlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">
                          Audit yozuvlari yo‘q
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-850">
                          <td className="py-3 text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleString("uz-UZ")}
                          </td>
                          <td className="py-3 font-semibold text-amber-300">
                            {log.action}
                          </td>
                          <td className="py-3 font-mono text-slate-300">
                            {log.actorTelegramId || "admin"}
                          </td>
                          <td className="py-3 text-slate-300 leading-relaxed">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
