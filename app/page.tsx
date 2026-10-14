import Link from "next/link";
import { Calendar, Shield, Crown, Sparkles, Phone, MapPin, Users } from "lucide-react";
import { config } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 text-white">
      {/* Top Navbar */}
      <nav className="border-b border-emerald-800/40 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">
                {config.venue.name}
              </span>
              <span className="block text-xs text-emerald-400">Onlayn Bron Tizimi</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-800/60 transition"
            >
              Admin Panel
            </Link>
            <Link
              href="/boss"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
            >
              Boss Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hashamatli to‘y va tantanalar saroyi</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Hayotingizdagi eng unutilmas kunni{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-emerald-200 to-amber-200 bg-clip-text text-transparent">
            {config.venue.name}da
          </span>{" "}
          o‘tkazing
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Telegram Mini App orqali qulay sanani tanlang, mehmonlar sonini belgilang va 10% zakalat bilan to‘y sanangizni bir zumda rasman band qiling.
        </p>

        {/* Quick Access Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          {/* User Mini App */}
          <Link
            href="/user"
            className="group relative p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Mijoz Mini App (/user)
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Bo‘sh sanalarni ko‘rish, zal va xizmatlarni tanlash, umumiy narx va 10% zakalatni hisoblash hamda bron qilish.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-emerald-400 text-sm font-semibold">
              <span>Mini App'ga kirish</span>
              <span>→</span>
            </div>
          </Link>

          {/* Admin Web Panel */}
          <Link
            href="/admin"
            className="group relative p-6 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                Administrator Paneli (/admin)
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Barcha bronlar, bandlik kalendari, cheklarni tekshirish va tasdiqlash, xizmat narxlarini boshqarish.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-blue-400 text-sm font-semibold">
              <span>Admin panelga kirish</span>
              <span>→</span>
            </div>
          </Link>

          {/* Boss Dashboard */}
          <Link
            href="/boss"
            className="group relative p-6 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Boss Dashboard (/boss)
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                To‘yxona egasi uchun sof moliyaviy ko‘rsatkichlar, kelib tushgan to‘lovlar, kutilayotgan qarzlar va audit tarixi.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-amber-400 text-sm font-semibold">
              <span>Boss panelga kirish</span>
              <span>→</span>
            </div>
          </Link>
        </div>

        {/* Venue Info Badges */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center space-x-3">
            <Users className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-left text-xs">
              <span className="text-slate-400 block">Zal sig‘imi</span>
              <span className="font-semibold text-white">{config.venue.capacity} nafargacha mehmon</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-left text-xs">
              <span className="text-slate-400 block">Boshlang‘ich narx</span>
              <span className="font-semibold text-white">{formatCurrency(config.venue.mainHallPrice)}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center space-x-3">
            <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <div className="text-left text-xs">
              <span className="text-slate-400 block">Aloqa</span>
              <span className="font-semibold text-white">{config.venue.phone}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>© 2026 {config.venue.name}. Barcha huquqlar himoyalangan.</p>
        <p className="mt-1 text-slate-600">Telegram Bot: @{config.telegram.botUsername}</p>
      </footer>
    </main>
  );
}
