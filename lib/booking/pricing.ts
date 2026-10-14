import { PriceBreakdown } from "@/lib/types";

/**
 * Narx hisoblash biznes mantig'i
 * Barcha hisob-kitoblar butun sonlarda (integer so'm) bajariladi.
 */
export function calculateBookingPrice(
  hallPrice: number,
  servicePrices: number[],
  depositPercent: number = 10
): PriceBreakdown {
  const safeHallPrice = Math.max(0, Math.round(hallPrice));
  const servicesTotal = servicePrices.reduce((sum, p) => sum + Math.max(0, Math.round(p)), 0);
  const totalPrice = safeHallPrice + servicesTotal;

  // Foizni hisoblash va yaxlitlash
  const validDepositPercent = Math.min(100, Math.max(1, Math.round(depositPercent)));
  const depositAmount = Math.round((totalPrice * validDepositPercent) / 100);
  const remainingAmount = totalPrice - depositAmount;

  return {
    hallPrice: safeHallPrice,
    servicesTotal,
    totalPrice,
    depositPercent: validDepositPercent,
    depositAmount,
    remainingAmount,
  };
}

/**
 * Mehmonlar soni validatsiyasi (min 50, max capacity, step 10)
 */
export function validateGuestCount(
  count: number,
  min: number = 50,
  max: number = 600
): { valid: boolean; value: number; error?: string } {
  if (isNaN(count)) {
    return { valid: false, value: min, error: "Mehmonlar soni raqam bo'lishi kerak" };
  }

  const rounded = Math.round(count);
  if (rounded < min) {
    return { valid: false, value: min, error: `Minimal mehmonlar soni: ${min} nafar` };
  }
  if (rounded > max) {
    return { valid: false, value: max, error: `Maksimal sig'im: ${max} nafar` };
  }

  return { valid: true, value: rounded };
}

