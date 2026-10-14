import { demoStore } from "@/lib/store/demo-store";
import { config } from "@/lib/config";
import {
  BookingRecord,
  DayAvailability,
  PaymentMethod,
} from "@/lib/types";

export const bookingService = {
  /**
   * Oylik kalendar bandlik ma'lumotlarini olish
   * O'tgan sanalar PAST, band sanalar BOOKED, vaqtinchalik ushlangani HOLD, qolgani AVAILABLE
   */
  async getMonthlyCalendar(year: number, month: number): Promise<DayAvailability[]> {
    demoStore.expireOverdueBookings();

    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allBookings = demoStore.getAllBookings();
    const days: DayAvailability[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(year, month - 1, day);
      d.setHours(0, 0, 0, 0);

      const isPast = d.getTime() < today.getTime();

      let status: DayAvailability["status"] = isPast ? "PAST" : "AVAILABLE";
      let bookingCode: string | undefined;
      let totalPrice: number | undefined;

      const matchedBooking = allBookings.find((b) => b.hallDate === dateStr);

      if (matchedBooking) {
        if (
          matchedBooking.status === "CONFIRMED" ||
          matchedBooking.status === "AWAITING_ADMIN_APPROVAL" ||
          matchedBooking.status === "PENDING_CASH_CONFIRMATION"
        ) {
          status = "BOOKED";
          bookingCode = matchedBooking.code;
          totalPrice = matchedBooking.totalPrice;
        } else if (matchedBooking.status === "HOLD_AWAITING_RECEIPT") {
          status = "HOLD";
          bookingCode = matchedBooking.code;
          totalPrice = matchedBooking.totalPrice;
        }
      }

      days.push({
        date: dateStr,
        dayOfMonth: day,
        isPast,
        status,
        bookingCode,
        totalPrice,
      });
    }

    return days;
  },

  /**
   * Yangi bron yaratish (Double bookingdan himoyalangan)
   */
  async createBooking(params: {
    userId: string;
    hallDate: string; // YYYY-MM-DD
    guestCount: number;
    serviceIds: string[];
    paymentMethod: PaymentMethod;
  }) {
    return demoStore.createBooking(params);
  },

  /**
   * To'lov chekini topshirish
   */
  async submitReceipt(params: {
    bookingCode: string;
    telegramFileId?: string;
    fileUrl?: string;
  }) {
    return demoStore.submitReceipt(params);
  },

  /**
   * To'lovni tasdiqlash (Admin)
   */
  async verifyPayment(params: {
    paymentId: string;
    actorTelegramId?: string;
    note?: string;
  }) {
    return demoStore.verifyPayment(params);
  },

  /**
   * To'lovni rad etish (Admin)
   */
  async rejectPayment(params: {
    paymentId: string;
    actorTelegramId?: string;
    note?: string;
  }) {
    return demoStore.rejectPayment(params);
  },

  /**
   * Bronni bekor qilish
   */
  async cancelBooking(params: {
    bookingId: string;
    actorTelegramId?: string;
    reason?: string;
  }) {
    return demoStore.cancelBooking(params);
  },

  /**
   * Kod bo'yicha bronni olish
   */
  async getBookingByCode(code: string): Promise<BookingRecord | null> {
    return demoStore.getBookingByCode(code);
  },

  /**
   * ID bo'yicha bronni olish
   */
  async getBookingById(id: string): Promise<BookingRecord | null> {
    return demoStore.getBookingById(id);
  },

  /**
   * Barcha bronlarni filtrlash bilan olish
   */
  async listBookings(filters?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BookingRecord[]> {
    let bookings = demoStore.getAllBookings();

    if (filters?.status && filters.status !== "ALL") {
      bookings = bookings.filter((b) => b.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.user?.firstName.toLowerCase().includes(q) ||
          (b.user?.lastName && b.user.lastName.toLowerCase().includes(q)) ||
          (b.user?.phone && b.user.phone.includes(q))
      );
    }

    if (filters?.startDate) {
      bookings = bookings.filter((b) => b.hallDate >= filters.startDate!);
    }

    if (filters?.endDate) {
      bookings = bookings.filter((b) => b.hallDate <= filters.endDate!);
    }

    // Sort descending by hallDate
    return bookings.sort((a, b) => b.hallDate.localeCompare(a.hallDate));
  },

  /**
   * Admin paneli uchun to'liq statistika
   */
  async getAdminDashboardStats() {
    demoStore.expireOverdueBookings();
    const bookings = demoStore.getAllBookings();
    const todayStr = new Date().toISOString().split("T")[0];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const todayBookings = bookings.filter((b) => b.hallDate === todayStr);
    const monthBookings = bookings.filter((b) => b.hallDate.startsWith(currentMonthPrefix));

    const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
    const awaitingApproval = bookings.filter((b) => b.status === "AWAITING_ADMIN_APPROVAL");
    const pendingCash = bookings.filter((b) => b.status === "PENDING_CASH_CONFIRMATION");
    const holdAwaitingReceipt = bookings.filter((b) => b.status === "HOLD_AWAITING_RECEIPT");
    const expired = bookings.filter((b) => b.status === "EXPIRED");

    const totalDepositCollected = confirmed.reduce((sum, b) => {
      const verifiedPayments = b.payments.filter((p) => p.status === "VERIFIED");
      return sum + verifiedPayments.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0);

    const pendingDebt = confirmed.reduce((sum, b) => sum + b.remainingAmount, 0);

    return {
      todayBookedCount: todayBookings.length,
      currentMonthCount: monthBookings.length,
      confirmedCount: confirmed.length,
      awaitingApprovalCount: awaitingApproval.length,
      pendingCashCount: pendingCash.length,
      holdCount: holdAwaitingReceipt.length,
      expiredCount: expired.length,
      totalDepositCollected,
      pendingDebt,
    };
  },

  /**
   * Boss Dashboard uchun yuqori darajadagi biznes ko'rsatkichlar (KPI)
   */
  async getBossKpis() {
    demoStore.expireOverdueBookings();
    const bookings = demoStore.getAllBookings();
    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    // Keyingi 30 kunlik
    const next30DaysDate = new Date(now.getTime() + 30 * 86400000);
    const todayStr = now.toISOString().split("T")[0];
    const next30DaysStr = next30DaysDate.toISOString().split("T")[0];

    const next30DaysBookings = bookings.filter(
      (b) => b.hallDate >= todayStr && b.hallDate <= next30DaysStr && (b.status === "CONFIRMED" || b.status === "AWAITING_ADMIN_APPROVAL")
    );

    const monthBookings = bookings.filter(
      (b) => b.hallDate.startsWith(currentMonthPrefix) && b.status === "CONFIRMED"
    );

    const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
    const cancelled = bookings.filter((b) => b.status === "CANCELLED" || b.status === "REJECTED");

    // Kelishilgan umumiy daromad (tasdiqlangan bronlar)
    const totalAgreedRevenue = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);

    // Haqiqiy tushgan to'lovlar (VERIFIED payments)
    const actualCollected = confirmed.reduce((sum, b) => {
      const verifiedPayments = b.payments.filter((p) => p.status === "VERIFIED");
      return sum + verifiedPayments.reduce((pSum, p) => pSum + p.amount, 0);
    }, 0);

    // Kutilayotgan qarzdorlik
    const pendingReceivable = totalAgreedRevenue - actualCollected;

    // Eng ko'p buyurtma qilingan xizmatlar
    const serviceCounts: Record<string, { name: string; count: number; totalRevenue: number }> = {};
    confirmed.forEach((b) => {
      b.services.forEach((bs) => {
        if (!serviceCounts[bs.serviceId]) {
          serviceCounts[bs.serviceId] = {
            name: bs.serviceNameSnapshot,
            count: 0,
            totalRevenue: 0,
          };
        }
        serviceCounts[bs.serviceId].count += 1;
        serviceCounts[bs.serviceId].totalRevenue += bs.servicePriceSnapshot;
      });
    });

    const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count);

    return {
      currentMonthBookedCount: monthBookings.length,
      next30DaysCount: next30DaysBookings.length,
      totalAgreedRevenue,
      actualCollected,
      depositTotal: actualCollected,
      pendingDebt: pendingReceivable,
      cancelledCount: cancelled.length,
      topServices,
    };
  },
};

