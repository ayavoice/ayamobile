/** Shared merchant QR payload — must match MerchantReceiveScreen. */

export const DEMO_SHOP = {
  id: "pratik-shop",
  name: "Pratik's Shop",
  account: "Merchant · pratik-shop",
  currency: "GHS",
} as const;

export const SHOP_PAY_URL =
  `https://pay.aya.app/m/${DEMO_SHOP.id}?name=${encodeURIComponent(DEMO_SHOP.name)}&currency=${DEMO_SHOP.currency}`;

/** Default demo amount when scanning a shop QR with no amount in the payload. */
export const DEMO_SCAN_AMOUNT = "45.00";

/** Wallet holder shown on the merchant loudspeaker when this device pays. */
export const DEMO_PAYER_NAME = "Ama Mensah";

export type ScannedMerchant = {
  id: string;
  name: string;
  account: string;
  currency: string;
};

export function parseMerchantPayUrl(raw: string): ScannedMerchant | null {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("pay.aya.app")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "m" || !parts[1]) return null;
    const id = parts[1];
    const name = url.searchParams.get("name")?.trim() || id;
    const currency = url.searchParams.get("currency")?.trim() || "GHS";
    return {
      id,
      name,
      account: `Merchant · ${id}`,
      currency,
    };
  } catch {
    return null;
  }
}
