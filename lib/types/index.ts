export type UserRole = "USER" | "ADMIN" | "BOSS";

export type BookingStatus =
  | "HOLD_AWAITING_RECEIPT"
  | "AWAITING_ADMIN_APPROVAL"
  | "PENDING_CASH_CONFIRMATION"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus =
  | "PENDING"
  | "RECEIPT_SUBMITTED"
  | "VERIFIED"
  | "REJECTED"
  | "REFUNDED"
  | "CASH_PENDING";

export type PaymentMethod = "CARD_DEPOSIT" | "CASH";

export interface UserRecord {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  icon?: string | null;
  isActive: boolean;
}

export interface BookingServiceRecord {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  servicePriceSnapshot: number;
}

export interface PaymentReceiptRecord {
  id: string;
  paymentId: string;
  telegramFileId?: string | null;
  fileUrl?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  adminNote?: string | null;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  receipts?: PaymentReceiptRecord[];
}

export interface BookingRecord {
  id: string;
  code: string;
  userId: string;
  user?: UserRecord;
  hallId?: string | null;
  hallDate: string; // ISO date YYYY-MM-DD
  guestCount: number;
  hallPriceSnapshot: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: BookingStatus;
  expiresAt?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  services: BookingServiceRecord[];
  payments: PaymentRecord[];
}

export interface AuditLogRecord {
  id: string;
  actorTelegramId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | null;
  timestamp: string;
}

export interface VenueSettingsRecord {
  name: string;
  address: string;
  phone: string;
  mainHallPrice: number;
  capacity: number;
  depositPercent: number;
  cardNumber: string;
  cardHolder: string;
  holdDurationMinutes: number;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  isPast: boolean;
  status: "AVAILABLE" | "BOOKED" | "HOLD" | "SELECTED" | "PAST";
  bookingCode?: string;
  totalPrice?: number;
}

export interface PriceBreakdown {
  hallPrice: number;
  servicesTotal: number;
  totalPrice: number;
  depositPercent: number;
  depositAmount: number;
  remainingAmount: number;
}

