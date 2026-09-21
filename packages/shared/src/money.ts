import type { MinorAmount } from "./types.js";

export const GHS_DECIMALS = 2;

type MoneyInput = string | number;

function parseToCents(value: MoneyInput): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value * 100);
  }
  const cleaned = value.replace(/\s/g, "").replace(/[GH₵,]/gi, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const padded = (frac + "00").slice(0, 2);
  const cents = Number(whole) * 100 + Number(padded);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Parse user-spoken/typed amounts like "GHS 580", "580.5", "cedis 20" into minor units. */
export function parseGhsToMinor(value: MoneyInput): MinorAmount | null {
  return parseToCents(value);
}

const GHS_SYMBOL = "GH\u20B5";

export function formatMinorToGhs(amountMinor: MinorAmount): string {
  const whole = Math.floor(amountMinor / 100);
  const frac = Math.abs(amountMinor % 100).toString().padStart(2, "0");
  return `${GHS_SYMBOL}${whole.toLocaleString("en-GH")}.${frac}`;
}