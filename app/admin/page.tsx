"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  BookOpen,
  Receipt,
  Settings,
  Sparkles,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  Trash2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { BookingRecord, ServiceRecord } from "@/lib/types";
import { formatCurrency, formatDateUz } from "@/lib/utils";
import { initTelegramWebApp, fetchWithTgAuth } from "@/lib/telegram/webapp";

type AdminTab = "DASHBOARD" | "CALENDAR" | "BOOKINGS" | "PAYMENTS" | "SERVICES" | "SETTINGS";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("DASHBOARD");
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected receipt for modal
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // New service modal
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState(1000000);
  const [newServiceDesc, setNewServiceDesc] = useState("");

  // Settings state
  const [settings, setSettings] = useState({
    name: "Doston To'yxonasi",
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor ko'chasi 42-uy",
    phone: "+998 90 123 45 67",
    mainHallPrice: 12000000,
    capacity: 500,
    depositPercent: 10,
    cardNumber: "8600 5500 1234 5678",
    cardHolder: "Doston To'yxonasi",
    holdDurationMinutes: 60,
  });

  const fetchData = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const [statsRes, bookingsRes, servicesRes, settingsRes] = await Promise.all([
        fetchWithTgAuth("/api/admin/stats"),
        fetchWithTgAuth("/api/bookings"),
        fetchWithTgAuth("/api/services"),
        fetchWithTgAuth("/api/venue/settings"),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        setAuthError("Sizda administrator paneliga kirish huquqi mavjud emas. Iltimos, ruxsat berilgan Telegram hisobidan kiring.");
        setLoading(false);
        return;
      }

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s.stats);
      }
      if (bookingsRes.ok) {
        const b = await bookingsRes.json();
        setBookings(b.bookings || []);
      }
      if (servicesRes.ok) {
        const srv = await servicesRes.json();
        setServices(srv.services || []);
      }
      if (settingsRes.ok) {
        const st = await settingsRes.json();
        if (st.venue) setSettings(st.venue);
      }
    } catch (e: any) {
      console.error("Admin data yuklanmadi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initTelegramWebApp();
    fetchData();
  }, []);

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.code.toLowerCase().includes(q) ||
        (b.user?.firstName && b.user.firstName.toLowerCase().includes(q)) ||
        (b.user?.phone && b.user.phone.includes(q))
      );
    }
    return true;
  });

  // Receipts awaiting approval
  const pendingReceipts = bookings.flatMap((b) =>
    b.payments
      .filter((p) => p.status === "RECEIPT_SUBMITTED")
      .map((p) => ({ ...p, booking: b }))
  );

  // Approve / Reject payment
  const handlePaymentAction = async (action: "APPROVE" | "REJECT") => {
    if (!selectedPayment) return;
    setActionLoading(true);

    try {
      const res = await fetchWithTgAuth("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          action,
          note: adminNote || (action === "APPROVE" ? "Tasdiqlandi" : "Rad etildi"),
        }),
      });

      if (res.ok) {
        setSelectedPayment(null);
        setAdminNote("");
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Xatolik yuz berdi");
      }
    } catch (e: any) {
      alert(e.message || "Xatolik");
    } finally {
      setActionLoading(false);
    }
  };

  // Add new service
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      const res = await fetchWithTgAuth("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName,
          description: newServiceDesc,
          price: Number(newServicePrice),
          isActive: true,
        }),
      });

      if (res.ok) {
        setShowNewServiceModal(false);
        setNewServiceName("");
        setNewServiceDesc("");
        setNewServicePrice(1000000);
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save venue settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithTgAuth("/api/venue/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert("Sozlamalar muvaffaqiyatli saqlandi!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (code: string) => {
    if (!confirm(`${code} raqamli bronni bekor qilmoqchimisiz?`)) return;
    try {
      const res = await fetchWithTgAuth(`/api/bookings/${code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin paneldan bekor qilindi" }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between p-4 border-r border-slate-800">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white">
                Doston To‘yxonasi
              </h1>
              <span className="text-[11px] text-emerald-400 font-medium">Admin Paneli</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "DASHBOARD"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("BOOKINGS")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "BOOKINGS"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-4 h-4" />
                <span>Bronlar</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("PAYMENTS")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "PAYMENTS"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Receipt className="w-4 h-4" />
                <span>Cheklar & To‘lovlar</span>
              </div>
              {pendingReceipts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {pendingReceipts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("SERVICES")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "SERVICES"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Xizmatlar & Narxlar</span>
            </button>

            <button
              onClick={() => setActiveTab("SETTINGS")}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === "SETTINGS"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Sozlamalar</span>
            </button>
          </nav>
        </div>

        {/* Bottom links */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <a
            href="/user"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 transition"
          >
            <span>Mijoz Mini App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/boss"
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800 text-amber-400 transition"
          >
            <span>Boss Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        {/* Top bar with refresh */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === "DASHBOARD" && "Dashboard"}
              {activeTab === "BOOKINGS" && "Barcha bronlar"}
              {activeTab === "PAYMENTS" && "Cheklar va to‘lovlarni tasdiqlash"}
              {activeTab === "SERVICES" && "Qo‘shimcha xizmatlar va narxlar"}
              {activeTab === "SETTINGS" && "To‘yxona sozlamalari"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Doston To‘yxonasi boshqaruv paneli</p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span>Yangilash</span>
          </button>
        </div>

        {authError && (
          <div className="p-6 mb-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-red-900">Kirish huquqi cheklangan</h3>
            <p className="text-xs text-red-700 max-w-md mx-auto">{authError}</p>
            <p className="text-[11px] text-slate-500">Iltimos, Telegram bot (@doston_tuyxona_bot) orqali ruxsat berilgan akkauntdan /admin buyrug‘ini yuboring.</p>
          </div>
        )}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {!authError && activeTab === "DASHBOARD" && stats && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Bugun band qilingan</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {stats.todayBookedCount} ta
                </span>
                <span className="text-[11px] text-emerald-600 mt-1 block">Joriy kunda</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Joriy oy bandligi</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {stats.currentMonthCount} kun
                </span>
                <span className="text-[11px] text-blue-600 mt-1 block">Tasdiqlangan va kutilayotgan</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Olingan zakalat</span>
                <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                  {formatCurrency(stats.totalDepositCollected)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">Faqat tasdiqlangan</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-xs text-slate-500 font-medium block">Kutilayotgan to‘lovlar</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                  {formatCurrency(stats.pendingDebt)}
                </span>
                <span className="text-[11px] text-amber-600 mt-1 block">To‘y kuni qoldig‘i</span>
              </div>
            </div>

            {/* Status counts pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-800 font-medium block">Tasdiqlangan</span>
                <span className="text-lg font-extrabold text-emerald-900">{stats.confirmedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-[11px] text-blue-800 font-medium block">Chek kutilmoqda</span>
                <span className="text-lg font-extrabold text-blue-900">{stats.awaitingApprovalCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                <span className="text-[11px] text-indigo-800 font-medium block">Naqd kelishilmoqda</span>
                <span className="text-lg font-extrabold text-indigo-900">{stats.pendingCashCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[11px] text-amber-800 font-medium block">1 soatlik Hold</span>
                <span className="text-lg font-extrabold text-amber-900">{stats.holdCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                <span className="text-[11px] text-orange-800 font-medium block">Muddati o‘tgan</span>
                <span className="text-lg font-extrabold text-orange-900">{stats.expiredCount}</span>
              </div>
            </div>

            {/* Recent bookings quick view */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Oxirgi bronlar</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="pb-3 font-semibold">Kod</th>
                      <th className="pb-3 font-semibold">Mijoz</th>
                      <th className="pb-3 font-semibold">To‘y sanasi</th>
                      <th className="pb-3 font-semibold">Mehmonlar</th>
                      <th className="pb-3 font-semibold">Jami narx</th>
                      <th className="pb-3 font-semibold">Zakalat</th>
                      <th className="pb-3 font-semibold">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 6).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono font-bold text-slate-900">{b.code}</td>
                        <td className="py-3 font-medium">
                          {b.user?.firstName || "Mijoz"} {b.user?.lastName || ""}
                          <span className="block text-[10px] text-slate-400">{b.user?.phone || ""}</span>
                        </td>
                        <td className="py-3 font-medium text-slate-700">{formatDateUz(b.hallDate)}</td>
                        <td className="py-3 text-slate-600">{b.guestCount} nafar</td>
                        <td className="py-3 font-bold text-slate-900">{formatCurrency(b.totalPrice)}</td>
                        <td className="py-3 font-semibold text-emerald-700">{formatCurrency(b.depositAmount)}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "AWAITING_ADMIN_APPROVAL"
                                ? "bg-blue-100 text-blue-800"
                                : b.status === "HOLD_AWAITING_RECEIPT"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: BOOKINGS ================= */}
        {activeTab === "BOOKINGS" && (
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Kod, ism yoki telefon orqali qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Barcha holatlar</option>
                  <option value="CONFIRMED">CONFIRMED (Tasdiqlangan)</option>
                  <option value="AWAITING_ADMIN_APPROVAL">AWAITING_ADMIN_APPROVAL (Chek tekshiruvda)</option>
                  <option value="PENDING_CASH_CONFIRMATION">PENDING_CASH_CONFIRMATION (Naqd kutilmoqda)</option>
                  <option value="HOLD_AWAITING_RECEIPT">HOLD_AWAITING_RECEIPT (Vaqtincha hold)</option>
                  <option value="EXPIRED">EXPIRED (Muddati tugagan)</option>
                  <option value="CANCELLED">CANCELLED (Bekor qilingan)</option>
                </select>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Bron kodi</th>
                      <th className="py-3 px-4 font-semibold">Mijoz</th>
                      <th className="py-3 px-4 font-semibold">To‘y sanasi</th>
                      <th className="py-3 px-4 font-semibold">Mehmonlar</th>
                      <th className="py-3 px-4 font-semibold">Umumiy narx</th>
                      <th className="py-3 px-4 font-semibold">Zakalat</th>
                      <th className="py-3 px-4 font-semibold">Qoldiq</th>
                      <th className="py-3 px-4 font-semibold">To‘lov usuli</th>
                      <th className="py-3 px-4 font-semibold">Holat</th>
                      <th className="py-3 px-4 font-semibold text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          Bronlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.code}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">
                              {b.user?.firstName || "Mijoz"} {b.user?.lastName || ""}
                            </span>
                            <span className="text-[10px] text-slate-400">{b.user?.phone || "Raqam yo‘q"}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{formatDateUz(b.hallDate)}</td>
                          <td className="py-3 px-4 text-slate-600">{b.guestCount} nafar</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(b.totalPrice)}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-700">{formatCurrency(b.depositAmount)}</td>
                          <td className="py-3 px-4 text-slate-600">{formatCurrency(b.remainingAmount)}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {b.paymentMethod === "CARD_DEPOSIT" ? "Karta" : "Naqd"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.status === "CONFIRMED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : b.status === "AWAITING_ADMIN_APPROVAL"
                                  ? "bg-blue-100 text-blue-800"
                                  : b.status === "HOLD_AWAITING_RECEIPT"
                                  ? "bg-amber-100 text-amber-800"
                                  : b.status === "EXPIRED"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {b.status !== "CANCELLED" && b.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(b.code)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Bronni bekor qilish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PAYMENTS & RECEIPTS ================= */}
        {activeTab === "PAYMENTS" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Tekshirish kutilayotgan to‘lov cheklari ({pendingReceipts.length} ta)
            </h3>

            {pendingReceipts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
                Hozircha tekshirilishi kerak bo‘lgan cheklar yo‘q. Barcha to‘lovlar ko‘rib chiqilgan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingReceipts.map((payment) => {
                  const receipt = payment.receipts && payment.receipts.length > 0 ? payment.receipts[0] : null;
                  return (
                    <div
                      key={payment.id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {payment.booking.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Chek yuborildi
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600">
                        <p>
                          <strong>Mijoz:</strong> {payment.booking.user?.firstName || "Mijoz"}{" "}
                          ({payment.booking.user?.phone || "Raqam yo‘q"})
                        </p>
                        <p>
                          <strong>To‘y sanasi:</strong> {formatDateUz(payment.booking.hallDate)}
                        </p>
                        <p>
                          <strong>Zakalat summasi:</strong>{" "}
                          <span className="text-emerald-700 font-extrabold">
                            {formatCurrency(payment.amount)}
                          </span>
                        </p>
                      </div>

                      {/* Receipt preview */}
                      {receipt?.fileUrl && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                          <img
                            src={receipt.fileUrl}
                            alt="Chek rasmi"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setAdminNote("");
                          }}
                          className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition"
                        >
                          Tasdiqlash / Rad etish
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: SERVICES ================= */}
        {activeTab === "SERVICES" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                To‘yxona qo‘shimcha xizmatlari va narxlari
              </h3>
              <button
                type="button"
                onClick={() => setShowNewServiceModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi xizmat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{srv.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          srv.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {srv.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{srv.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Narxi:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatCurrency(srv.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: SETTINGS ================= */}
        {activeTab === "SETTINGS" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm max-w-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">To‘yxona asosiy parametrlarini sozlash</h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">To‘yxona nomi</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Manzil</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Telefon</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Asosiy zal narxi (so'm)</label>
                  <input
                    type="number"
                    value={settings.mainHallPrice}
                    onChange={(e) => setSettings({ ...settings, mainHallPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Maksimal sig‘im (mehmon)</label>
                  <input
                    type="number"
                    value={settings.capacity}
                    onChange={(e) => setSettings({ ...settings, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Zakalat foizi (%)</label>
                  <input
                    type="number"
                    value={settings.depositPercent}
                    onChange={(e) => setSettings({ ...settings, depositPercent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Karta raqami</label>
                  <input
                    type="text"
                    value={settings.cardNumber}
                    onChange={(e) => setSettings({ ...settings, cardNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Karta egasi</label>
                  <input
                    type="text"
                    value={settings.cardHolder}
                    onChange={(e) => setSettings({ ...settings, cardHolder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
              >
                Sozlamalarni saqlash
              </button>
            </form>
          </div>
        )}

        {/* Modal: Receipt Verification */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">
                  Chekni ko‘rib chiqish: {selectedPayment.booking.code}
                </h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <p>
                  <strong>Mijoz:</strong> {selectedPayment.booking.user?.firstName}{" "}
                  {selectedPayment.booking.user?.lastName}
                </p>
                <p>
                  <strong>To‘lov summasi:</strong>{" "}
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(selectedPayment.amount)}
                  </span>
                </p>
              </div>

              {selectedPayment.receipts?.[0]?.fileUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-52 flex items-center justify-center">
                  <img
                    src={selectedPayment.receipts[0].fileUrl}
                    alt="Chek"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 text-xs block mb-1">
                  Administrator izohi
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Hisobga tushdi / Summa mos kelmadi"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePaymentAction("REJECT")}
                  className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-600 font-bold text-xs hover:bg-red-50 transition"
                >
                  ❌ Rad etish
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePaymentAction("APPROVE")}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
                >
                  ✅ Tasdiqlash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: New Service */}
        {showNewServiceModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-sm text-slate-900">Yangi xizmat qo‘shish</h3>
                <button
                  onClick={() => setShowNewServiceModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Xizmat nomi</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Feyerverk shousi"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Narxi (so'm)</label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Qisqa tavsifi</label>
                  <textarea
                    rows={3}
                    placeholder="Xizmat haqida ma'lumot..."
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewServiceModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-medium"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold"
                  >
                    Qo‘shish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
