import type { Currency } from "@prisma/client";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency as Currency] ?? currency;
}
