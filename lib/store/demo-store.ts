import {
  BookingRecord,
  BookingStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  ServiceRecord,
  UserRecord,
  VenueSettingsRecord,
  AuditLogRecord,
} from "@/lib/types";
import { calculateBookingPrice } from "@/lib/booking/pricing";
import { generateBookingCode } from "@/lib/utils";

// Singleton global in-memory store so hot-reloads keep demo data
interface GlobalStoreState {
  venue: VenueSettingsRecord;
  services: ServiceRecord[];
  users: UserRecord[];
  bookings: BookingRecord[];
  auditLogs: AuditLogRecord[];
}

const defaultVenue: VenueSettingsRecord = {
  name: "Doston To'yxonasi",
  address: "Toshkent shahri, Chilonzor tumani, Bunyodkor ko'chasi 42-uy",
  phone: "+998 90 123 45 67",
  mainHallPrice: 12000000,
  capacity: 500,
  depositPercent: 10,
  cardNumber: "8600 5500 1234 5678",
  cardHolder: "Doston To'yxonasi",
  holdDurationMinutes: 60,
};

const defaultServices: ServiceRecord[] = [
  {
    id: "srv-decor",
    name: "Zal bezaklari",
    description: "Kelin-kuyov stoli va butun zalning gullar bilan hashamatli bezatilishi",
    price: 1000000,
    icon: "Flower2",
    isActive: true,
  },
  {
    id: "srv-music",
    name: "Musiqa xizmati",
    description: "Professional ovoz apparaturasi, DJ va jonli orkestr uskunasi",
    price: 700000,
    icon: "Music",
    isActive: true,
  },
  {
    id: "srv-media",
    name: "Foto va video",
    description: "2 ta 4K kamera, kran, dron va marosim fotosessiyasi",
    price: 1200000,
    icon: "Camera",
    isActive: true,
  },
];

const defaultUsers: UserRecord[] = [
  {
    id: "usr-demo-1",
    telegramId: "8501558045",
    firstName: "Doston",
    lastName: "Qodirov",
    phone: "+998 90 123 45 67",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr-demo-legacy",
    telegramId: "123456789",
    firstName: "Doston",
    lastName: "Qodirov",
    phone: "+998 90 123 45 67",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr-demo-2",
    telegramId: "99887766",
    firstName: "Anvar",
    lastName: "Karimov",
    phone: "+998 93 555 44 33",
    role: "USER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function initDefaultStore(): GlobalStoreState {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const nextMonthStr = nextMonthDate.toISOString().split("T")[0];

  const initialBookings: BookingRecord[] = [
    {
      id: "bkg-sample-1",
      code: "DST-2026-0001",
      userId: "usr-demo-2",
      hallDate: nextMonthStr,
      guestCount: 200,
      hallPriceSnapshot: 12000000,
      totalPrice: 13000000,
      depositAmount: 1300000,
      remainingAmount: 11700000,
      paymentMethod: "CARD_DEPOSIT",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      services: [
        {
          id: "bs-1",
          bookingId: "bkg-sample-1",
          serviceId: "srv-decor",
          serviceNameSnapshot: "Zal bezaklari",
          servicePriceSnapshot: 1000000,
        },
      ],
      payments: [
        {
          id: "pay-1",
          bookingId: "bkg-sample-1",
          amount: 1300000,
          status: "VERIFIED",
          method: "CARD_DEPOSIT",
          verifiedAt: new Date(Date.now() - 86400000).toISOString(),
          verifiedBy: "123456789",
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          receipts: [
            {
              id: "rcpt-1",
              paymentId: "pay-1",
              telegramFileId: "demo-receipt-file-id",
              fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
              submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
              reviewedAt: new Date(Date.now() - 86400000).toISOString(),
              adminNote: "To'lov hisobga tushdi, tasdiqlandi",
            },
          ],
        },
      ],
    },
  ];

  return {
    venue: { ...defaultVenue },
    services: JSON.parse(JSON.stringify(defaultServices)),
    users: JSON.parse(JSON.stringify(defaultUsers)),
    bookings: initialBookings,
    auditLogs: [
      {
        id: "log-1",
        actorTelegramId: "123456789",
        action: "APPROVE_RECEIPT",
        entityType: "PAYMENT",
        entityId: "pay-1",
        details: "DST-2026-0001 bron uchun 1 300 000 so'm zakalat tasdiqlandi",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
}

// Global declaration for HMR persistence
const globalStore = globalThis as unknown as { __dostonStore?: GlobalStoreState };
if (!globalStore.__dostonStore) {
  globalStore.__dostonStore = initDefaultStore();
}

export const demoStore = {
  getVenue(): VenueSettingsRecord {
    return globalStore.__dostonStore!.venue;
  },
  updateVenue(data: Partial<VenueSettingsRecord>): VenueSettingsRecord {
    globalStore.__dostonStore!.venue = { ...globalStore.__dostonStore!.venue, ...data };
    return globalStore.__dostonStore!.venue;
  },

  getServices(): ServiceRecord[] {
    return globalStore.__dostonStore!.services;
  },
  getActiveServices(): ServiceRecord[] {
    return globalStore.__dostonStore!.services.filter((s) => s.isActive);
  },
  getServiceById(id: string): ServiceRecord | undefined {
    return globalStore.__dostonStore!.services.find((s) => s.id === id);
  },
  createService(data: Omit<ServiceRecord, "id">): ServiceRecord {
    const newService: ServiceRecord = {
      ...data,
      id: `srv-${Date.now()}`,
    };
    globalStore.__dostonStore!.services.push(newService);
    return newService;
  },
  updateService(id: string, data: Partial<ServiceRecord>): ServiceRecord | null {
    const index = globalStore.__dostonStore!.services.findIndex((s) => s.id === id);
    if (index === -1) return null;
    globalStore.__dostonStore!.services[index] = {
      ...globalStore.__dostonStore!.services[index],
      ...data,
    };
    return globalStore.__dostonStore!.services[index];
  },

  getUsers(): UserRecord[] {
    return globalStore.__dostonStore!.users;
  },
  getUserByTelegramId(telegramId: string): UserRecord | undefined {
    return globalStore.__dostonStore!.users.find((u) => u.telegramId === telegramId);
  },
  getUserById(id: string): UserRecord | undefined {
    return globalStore.__dostonStore!.users.find((u) => u.id === id);
  },
  upsertUser(data: { telegramId: string; firstName: string; lastName?: string | null; phone?: string | null; role?: UserRecord["role"] }): UserRecord {
    const existingIndex = globalStore.__dostonStore!.users.findIndex((u) => u.telegramId === data.telegramId);
    if (existingIndex >= 0) {
      const prev = globalStore.__dostonStore!.users[existingIndex];
      const updated: UserRecord = {
        ...prev,
        firstName: data.firstName || prev.firstName,
        lastName: data.lastName !== undefined && data.lastName !== null ? data.lastName : prev.lastName,
        phone: data.phone || prev.phone,
        role: data.role || prev.role,
        updatedAt: new Date().toISOString(),
      };
      globalStore.__dostonStore!.users[existingIndex] = updated;
      return updated;
    }
    const newUser: UserRecord = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      telegramId: data.telegramId,
      firstName: data.firstName,
      lastName: data.lastName || null,
      phone: data.phone || null,
      role: data.role || "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.__dostonStore!.users.push(newUser);
    return newUser;
  },

  expireOverdueBookings(): number {
    const now = new Date();
    let expiredCount = 0;
    globalStore.__dostonStore!.bookings.forEach((b) => {
      if (b.status === "HOLD_AWAITING_RECEIPT" && b.expiresAt) {
        const exp = new Date(b.expiresAt);
        if (exp.getTime() <= now.getTime()) {
          b.status = "EXPIRED";
          b.updatedAt = now.toISOString();
          expiredCount++;
        }
      }
    });
    return expiredCount;
  },

  getAllBookings(): BookingRecord[] {
    this.expireOverdueBookings();
    return globalStore.__dostonStore!.bookings.map((b) => ({
      ...b,
      user: this.getUserById(b.userId),
    }));
  },

  getBookingByCode(code: string): BookingRecord | null {
    this.expireOverdueBookings();
    const b = globalStore.__dostonStore!.bookings.find(
      (b) => b.code.toUpperCase() === code.toUpperCase()
    );
    if (!b) return null;
    return {
      ...b,
      user: this.getUserById(b.userId),
    };
  },

  getBookingById(id: string): BookingRecord | null {
    this.expireOverdueBookings();
    const b = globalStore.__dostonStore!.bookings.find((b) => b.id === id);
    if (!b) return null;
    return {
      ...b,
      user: this.getUserById(b.userId),
    };
  },

  updateBooking(id: string, data: Partial<BookingRecord>): BookingRecord | null {
    const booking = globalStore.__dostonStore!.bookings.find((b) => b.id === id);
    if (!booking) return null;
    Object.assign(booking, data);
    return booking;
  },

  isDateAvailable(hallDate: string, excludeBookingId?: string): boolean {
    this.expireOverdueBookings();
    const now = new Date();

    const conflict = globalStore.__dostonStore!.bookings.find((b) => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.hallDate !== hallDate) return false;

      // Active statuses that occupy the date
      if (
        b.status === "CONFIRMED" ||
        b.status === "AWAITING_ADMIN_APPROVAL" ||
        b.status === "PENDING_CASH_CONFIRMATION"
      ) {
        return true;
      }

      if (b.status === "HOLD_AWAITING_RECEIPT" && b.expiresAt) {
        return new Date(b.expiresAt).getTime() > now.getTime();
      }

      return false;
    });

    return !conflict;
  },

  /**
   * Atomar bron yaratish — Double booking himoyasi
   */
  createBooking(params: {
    userId: string;
    hallDate: string; // YYYY-MM-DD
    guestCount: number;
    serviceIds: string[];
    paymentMethod: PaymentMethod;
  }): { success: true; booking: BookingRecord } | { success: false; error: string; code: string } {
    this.expireOverdueBookings();

    // Check date format & past check
    const bookingDate = new Date(params.hallDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(bookingDate.getTime())) {
      return { success: false, error: "Noto'g'ri sana formati", code: "INVALID_DATE" };
    }

    if (bookingDate.getTime() < today.getTime()) {
      return { success: false, error: "O'tgan sanani bron qilib bo'lmaydi", code: "PAST_DATE" };
    }

    // Double-booking check
    if (!this.isDateAvailable(params.hallDate)) {
      return {
        success: false,
        error: "Ushbu sana allaqachon boshqa mijoz tomonidan band qilingan",
        code: "DATE_ALREADY_BOOKED",
      };
    }

    const venue = this.getVenue();
    const activeServices = this.getActiveServices().filter((s) =>
      params.serviceIds.includes(s.id)
    );

    const priceBreakdown = calculateBookingPrice(
      venue.mainHallPrice,
      activeServices.map((s) => s.price),
      venue.depositPercent
    );

    const code = generateBookingCode();
    const now = new Date();
    const expiresAt =
      params.paymentMethod === "CARD_DEPOSIT"
        ? new Date(now.getTime() + venue.holdDurationMinutes * 60 * 1000).toISOString()
        : null;

    const initialStatus: BookingStatus =
      params.paymentMethod === "CARD_DEPOSIT"
        ? "HOLD_AWAITING_RECEIPT"
        : "PENDING_CASH_CONFIRMATION";

    const bookingId = `bkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newBooking: BookingRecord = {
      id: bookingId,
      code,
      userId: params.userId,
      hallDate: params.hallDate,
      guestCount: params.guestCount,
      hallPriceSnapshot: venue.mainHallPrice,
      totalPrice: priceBreakdown.totalPrice,
      depositAmount: priceBreakdown.depositAmount,
      remainingAmount: priceBreakdown.remainingAmount,
      paymentMethod: params.paymentMethod,
      status: initialStatus,
      expiresAt,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      services: activeServices.map((s, idx) => ({
        id: `bs-${Date.now()}-${idx}`,
        bookingId,
        serviceId: s.id,
        serviceNameSnapshot: s.name,
        servicePriceSnapshot: s.price,
      })),
      payments: [
        {
          id: `pay-${Date.now()}`,
          bookingId,
          amount: priceBreakdown.depositAmount,
          status: params.paymentMethod === "CARD_DEPOSIT" ? "PENDING" : "CASH_PENDING",
          method: params.paymentMethod,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          receipts: [],
        },
      ],
    };

    globalStore.__dostonStore!.bookings.push(newBooking);

    return {
      success: true,
      booking: {
        ...newBooking,
        user: this.getUserById(newBooking.userId),
      },
    };
  },

  submitReceipt(params: {
    bookingCode: string;
    telegramFileId?: string;
    fileUrl?: string;
  }): { success: true; booking: BookingRecord } | { success: false; error: string; code: string } {
    this.expireOverdueBookings();

    const booking = globalStore.__dostonStore!.bookings.find(
      (b) => b.code.toUpperCase() === params.bookingCode.toUpperCase()
    );

    if (!booking) {
      return { success: false, error: "Bron kodi topilmadi", code: "NOT_FOUND" };
    }

    if (booking.status === "EXPIRED") {
      return {
        success: false,
        error: "Ushbu bronning muddati tugagan. Iltimos, qayta bron qiling yoki administratorga murojaat qiling.",
        code: "BOOKING_EXPIRED",
      };
    }

    if (booking.status === "CONFIRMED") {
      return {
        success: false,
        error: "Ushbu bron allaqachon tasdiqlangan.",
        code: "ALREADY_CONFIRMED",
      };
    }

    const now = new Date().toISOString();
    booking.status = "AWAITING_ADMIN_APPROVAL";
    booking.updatedAt = now;

    // Update or create payment record
    if (booking.payments.length === 0) {
      booking.payments.push({
        id: `pay-${Date.now()}`,
        bookingId: booking.id,
        amount: booking.depositAmount,
        status: "RECEIPT_SUBMITTED",
        method: booking.paymentMethod,
        createdAt: now,
        updatedAt: now,
        receipts: [],
      });
    }

    const payment = booking.payments[0];
    payment.status = "RECEIPT_SUBMITTED";
    payment.updatedAt = now;
    if (!payment.receipts) payment.receipts = [];

    payment.receipts.push({
      id: `rcpt-${Date.now()}`,
      paymentId: payment.id,
      telegramFileId: params.telegramFileId,
      fileUrl: params.fileUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600",
      submittedAt: now,
    });

    return {
      success: true,
      booking: {
        ...booking,
        user: this.getUserById(booking.userId),
      },
    };
  },

  verifyPayment(params: {
    paymentId: string;
    actorTelegramId?: string;
    note?: string;
  }): { success: boolean; error?: string; booking?: BookingRecord } {
    const booking = globalStore.__dostonStore!.bookings.find((b) =>
      b.payments.some((p) => p.id === params.paymentId)
    );

    if (!booking) {
      return { success: false, error: "To'lov yoki bron topilmadi" };
    }

    const payment = booking.payments.find((p) => p.id === params.paymentId);
    if (!payment) {
      return { success: false, error: "To'lov topilmadi" };
    }

    // Idempotency: agar allaqachon VERIFIED bo'lsa, qayta tasdiqlamaydi
    if (payment.status === "VERIFIED" && booking.status === "CONFIRMED") {
      return { success: true, booking };
    }

    const now = new Date().toISOString();
    payment.status = "VERIFIED";
    payment.verifiedAt = now;
    payment.verifiedBy = params.actorTelegramId || "admin";
    payment.updatedAt = now;

    if (payment.receipts && payment.receipts.length > 0) {
      payment.receipts[payment.receipts.length - 1].reviewedAt = now;
      payment.receipts[payment.receipts.length - 1].adminNote = params.note || "Tasdiqlandi";
    }

    booking.status = "CONFIRMED";
    booking.updatedAt = now;

    // Audit log yozish
    globalStore.__dostonStore!.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorTelegramId: params.actorTelegramId || "admin",
      action: "APPROVE_RECEIPT",
      entityType: "PAYMENT",
      entityId: payment.id,
      details: `${booking.code} broni uchun ${payment.amount} so'm to'lov tasdiqlandi. Izoh: ${params.note || "Muvaffaqiyatli"}`,
      timestamp: now,
    });

    return { success: true, booking: { ...booking, user: this.getUserById(booking.userId) } };
  },

  rejectPayment(params: {
    paymentId: string;
    actorTelegramId?: string;
    note?: string;
  }): { success: boolean; error?: string; booking?: BookingRecord } {
    const booking = globalStore.__dostonStore!.bookings.find((b) =>
      b.payments.some((p) => p.id === params.paymentId)
    );

    if (!booking) {
      return { success: false, error: "To'lov yoki bron topilmadi" };
    }

    const payment = booking.payments.find((p) => p.id === params.paymentId);
    if (!payment) {
      return { success: false, error: "To'lov topilmadi" };
    }

    const now = new Date().toISOString();
    payment.status = "REJECTED";
    payment.updatedAt = now;

    if (payment.receipts && payment.receipts.length > 0) {
      payment.receipts[payment.receipts.length - 1].reviewedAt = now;
      payment.receipts[payment.receipts.length - 1].adminNote = params.note || "Rad etildi";
    }

    booking.status = "REJECTED";
    booking.updatedAt = now;

    // Audit log
    globalStore.__dostonStore!.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorTelegramId: params.actorTelegramId || "admin",
      action: "REJECT_RECEIPT",
      entityType: "PAYMENT",
      entityId: payment.id,
      details: `${booking.code} broni uchun ${payment.amount} so'm to'lov rad etildi. Sabab: ${params.note || "Chek mos kelmadi"}`,
      timestamp: now,
    });

    return { success: true, booking: { ...booking, user: this.getUserById(booking.userId) } };
  },

  cancelBooking(params: {
    bookingId: string;
    actorTelegramId?: string;
    reason?: string;
  }): { success: boolean; error?: string; booking?: BookingRecord } {
    const booking = globalStore.__dostonStore!.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Bron topilmadi" };

    const now = new Date().toISOString();
    booking.status = "CANCELLED";
    booking.adminNotes = params.reason || "Bekor qilindi";
    booking.updatedAt = now;

    globalStore.__dostonStore!.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorTelegramId: params.actorTelegramId || "admin",
      action: "CANCEL_BOOKING",
      entityType: "BOOKING",
      entityId: booking.id,
      details: `${booking.code} broni bekor qilindi. Sabab: ${params.reason || "Mijoz xohishi"}`,
      timestamp: now,
    });

    return { success: true, booking: { ...booking, user: this.getUserById(booking.userId) } };
  },

  getAuditLogs(): AuditLogRecord[] {
    return globalStore.__dostonStore!.auditLogs;
  },

  resetDemoData(): void {
    globalStore.__dostonStore = initDefaultStore();
  },
};
