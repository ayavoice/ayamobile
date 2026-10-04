/**
 * Send money destinations, modelled on MTN MoMo Ghana:
 * any mobile money wallet by phone number (national interoperability),
 * or any bank account through GhIPSS, with a name check before sending.
 */

export type WalletNetwork = "mtn" | "telecel" | "at";

export const NETWORK_LABEL: Record<WalletNetwork, string> = {
  mtn: "MTN MoMo",
  telecel: "Telecel Cash",
  at: "AT Money",
};

const PREFIXES: Record<WalletNetwork, string[]> = {
  mtn: ["024", "054", "055", "059", "025", "053"],
  telecel: ["020", "050"],
  at: ["026", "056", "027", "057"],
};

export const BANKS = [
  "GCB Bank",
  "Ecobank",
  "Absa",
  "Stanbic",
  "Fidelity",
  "CalBank",
  "Access Bank",
  "Zenith",
  "UBA",
  "Republic Bank",
  "ADB",
  "Prudential",
] as const;

export type Bank = (typeof BANKS)[number];

export type Recipient =
  | { kind: "wallet"; name: string; phone: string; network: WalletNetwork | "merchant"; saved: boolean }
  | { kind: "bank"; name: string; account: string; bank: Bank; saved: boolean };

export const SAVED_RECIPIENTS: Recipient[] = [
  { kind: "wallet", name: "Ricky Martin", phone: "0244123456", network: "mtn", saved: true },
  { kind: "wallet", name: "Kwame Boateng", phone: "0245556631", network: "mtn", saved: true },
  { kind: "wallet", name: "Kwame Asante", phone: "0541239012", network: "mtn", saved: true },
  { kind: "wallet", name: "Ama Serwaa", phone: "0201234567", network: "telecel", saved: true },
  { kind: "wallet", name: "Kojo Mensah", phone: "0271555010", network: "at", saved: true },
  { kind: "bank", name: "Kofi Boateng", account: "1021450006789", bank: "GCB Bank", saved: true },
];

export function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}

export function detectNetwork(phone: string): WalletNetwork | null {
  const prefix = digitsOnly(phone).slice(0, 3);
  const hit = (Object.keys(PREFIXES) as WalletNetwork[]).find((n) => PREFIXES[n].includes(prefix));
  return hit ?? null;
}

export function isValidPhone(phone: string): boolean {
  const d = digitsOnly(phone);
  return d.length === 10 && detectNetwork(d) !== null;
}

export function isValidAccount(account: string): boolean {
  const n = digitsOnly(account).length;
  return n >= 10 && n <= 16;
}

/** "024 412 3456" */
export function formatPhone(phone: string): string {
  const d = digitsOnly(phone);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(" ");
}

export function maskAccount(account: string): string {
  return `•••• ${digitsOnly(account).slice(-4)}`;
}

export function recipientLine(r: Recipient): string {
  if (r.kind === "bank") return `${r.bank} · ${maskAccount(r.account)}`;
  if (r.network === "merchant") return `Aya Merchant · ${r.phone}`;
  return `${NETWORK_LABEL[r.network]} · ${formatPhone(r.phone)}`;
}

export function recipientNetworkLabel(r: Recipient): string {
  if (r.kind === "bank") return r.bank;
  return r.network === "merchant" ? "Aya Merchant" : NETWORK_LABEL[r.network];
}

/** Demo stand-in for MTN's registered-name lookup and the GhIPSS name enquiry. */
export const NAME_LOOKUP_MS = 700;
const DEMO_NAMES = ["Yaw Asante", "Akosua Owusu", "Efua Mensah", "Kwame Addo", "Abena Ofori"];

export function demoLookupName(id: string): string {
  const sum = digitsOnly(id)
    .split("")
    .reduce((s, c) => s + Number(c), 0);
  return DEMO_NAMES[sum % DEMO_NAMES.length];
}

/**
 * MTN wallet transfers (same or other network): 0.75% up to GH₵1,000, then GH₵7.50 flat.
 * Wallet to bank is free while the proposed fee is suspended by the Bank of Ghana.
 */
export function transferFee(amount: number, kind: Recipient["kind"]): number {
  if (kind === "bank" || amount <= 0) return 0;
  return amount <= 1000 ? Math.round(amount * 0.75) / 100 : 7.5;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
