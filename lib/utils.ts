import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pul birligini o'zbek so'mida formatlash (masalan, 12 000 000 so'm)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0 so'm";
  const rounded = Math.round(amount);
  const parts = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${parts} so'm`;
}

/**
 * Sanani o'zbek tilida chiroyli ko'rsatish
 */
const MONTH_NAMES_UZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
];

const WEEKDAY_NAMES_UZ = [
  "Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"
];

export function formatDateUz(dateInput: string | Date, options?: { withWeekday?: boolean; shortMonth?: boolean }): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();
  const monthName = MONTH_NAMES_UZ[monthIndex];

  if (options?.withWeekday) {
    const weekday = WEEKDAY_NAMES_UZ[d.getDay()];
    return `${weekday}, ${day}-${monthName.toLowerCase()}, ${year}`;
  }

  return `${day}-${monthName.toLowerCase()}, ${year}`;
}

export function formatShortDate(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Unikal bron kodi yaratish: masalan DST-2026-8492
 */
export function generateBookingCode(sequenceNumber?: number): string {
  const year = new Date().getFullYear();
  if (sequenceNumber !== undefined) {
    const padded = String(sequenceNumber).padStart(4, "0");
    return `DST-${year}-${padded}`;
  }
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `DST-${year}-${random4}`;
}

