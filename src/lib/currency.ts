const CURRENCY_SYMBOL = "GH₵";

/**
 * Formats a monetary value to a fixed 2 decimal places with thousands
 * separators, e.g. formatCurrency(2648.3) -> "GH₵2,648.30".
 * Accepts a number or a string (any non-numeric characters, including an
 * existing "GH₵" prefix, are stripped before parsing).
 */
export function formatCurrency(value: number | string): string {
  const numeric =
    typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  const safe = Number.isFinite(numeric) ? numeric : 0;

  const fixed = safe.toFixed(2);
  const negative = fixed.startsWith("-");
  const [whole, decimals] = (negative ? fixed.slice(1) : fixed).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "-" : ""}${CURRENCY_SYMBOL}${withCommas}.${decimals}`;
}

/**
 * Screen-reader friendly money phrasing, e.g.
 * formatCurrencySpoken(14.9) -> "14 Ghana cedis and 90 pesewas"
 * formatCurrencySpoken(-14.9) -> "minus 14 Ghana cedis and 90 pesewas"
 */
export function formatCurrencySpoken(value: number | string): string {
  const numeric =
    typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const negative = safe < 0;
  const [whole, decimals] = Math.abs(safe).toFixed(2).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "minus " : ""}${withCommas} Ghana cedis and ${decimals} pesewas`;
}

/**
 * Normalises free-typed amount input: digits + a single dot, max 2 decimal
 * places, leading "." becomes "0."; everything else is stripped.
 */
export function normalizeAmountInput(raw: string): string {
  let next = raw.replace(/[^0-9.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    const [whole, decimals = ""] = next.split(".");
    next = `${whole}.${decimals.slice(0, 2)}`;
  }
  if (next.startsWith(".")) next = `0${next}`;
  return next;
}

/**
 * Parses a sanitized amount string ("5", "5.5") into pesewas (minor units).
 * Returns null for non-positive or invalid input.
 */
export function parseGhsToMinor(amount: string): number | null {
  const numeric = Number(normalizeAmountInput(amount));
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.round(numeric * 100);
}

/** Prefer spoken currency when the visible string looks like a money amount. */
export function speakMaybeCurrency(value: string): string {
  if (/[₵$€£]|GH₵/i.test(value) && /\d/.test(value)) {
    return formatCurrencySpoken(value);
  }
  return value;
}

/** Hide decorative nodes from VoiceOver / TalkBack. */
export const DECORATIVE_A11Y = {
  accessible: false as const,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants" as const,
};
