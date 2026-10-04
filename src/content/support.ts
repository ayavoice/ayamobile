import type { ComponentProps } from "react";
import type Ionicons from "@expo/vector-icons/Ionicons";
import type { AppLanguage } from "./flows";

type IonName = ComponentProps<typeof Ionicons>["name"];

export type SupportCategory =
  | "wrong_person"
  | "wrong_amount"
  | "not_received"
  | "scam"
  | "app_issue"
  | "other";

/** Where a problem goes after Aya understands it (support.md §3.2). */
export type SupportRoute =
  | "self_reversal"
  | "mtn_case"
  | "fraud_urgent"
  | "status_check"
  | "aya_queue";

export type SignalLevel = "low" | "medium" | "high";

export type TicketPriority = "normal" | "urgent";

export type TicketStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "waiting_on_mtn"
  | "resolved";

export type SupportTransaction = {
  id: string;
  title: string;
  amount: string;
  counterpart: string;
  number: string;
  when: string;
  hoursAgo: number;
  reference: string;
};

export type TicketEvent = {
  at: number;
  title: string;
  detail?: string;
};

export type SupportTicket = {
  reference: string;
  category: SupportCategory;
  route: SupportRoute;
  priority: TicketPriority;
  status: TicketStatus;
  language: AppLanguage;
  createdAt: number;
  transaction: SupportTransaction | null;
  /** Only the level is kept, never audio or voice features (architecture.md §6.5). */
  signalLevel: SignalLevel;
  callbackRequested: boolean;
  events: TicketEvent[];
};

export const SUPPORT_TRANSACTIONS: SupportTransaction[] = [
  {
    id: "ricky",
    title: "Sent to Ricky Martin",
    amount: "GH₵580.00",
    counterpart: "Ricky Martin",
    number: "Ac no. 8050530XXX",
    when: "Today, 3:02 PM",
    hoursAgo: 2,
    reference: "AYA-2609-7K8X",
  },
  {
    id: "airtime",
    title: "Airtime",
    amount: "GH₵10.00",
    counterpart: "Your MTN number",
    number: "Self top-up",
    when: "6 Sep, 10:00 AM",
    hoursAgo: 30,
    reference: "AYA-2609-RT9M",
  },
  {
    id: "data",
    title: "Data bundle",
    amount: "GH₵25.00",
    counterpart: "Your MTN number",
    number: "Self top-up",
    when: "5 Sep, 2:15 PM",
    hoursAgo: 50,
    reference: "AYA-0509-DT4Q",
  },
];

export const SUPPORT_CATEGORIES: {
  id: SupportCategory;
  label: string;
  hint: string;
  icon: IonName;
  needsTransaction: boolean;
}[] = [
  {
    id: "wrong_person",
    label: "Sent to the wrong person",
    hint: "The money went to someone else",
    icon: "person-remove-outline",
    needsTransaction: true,
  },
  {
    id: "wrong_amount",
    label: "Sent the wrong amount",
    hint: "Too much or too little",
    icon: "calculator-outline",
    needsTransaction: true,
  },
  {
    id: "not_received",
    label: "Money left but didn't arrive",
    hint: "Taken from me, not received",
    icon: "hourglass-outline",
    needsTransaction: true,
  },
  {
    id: "scam",
    label: "Someone tricked me",
    hint: "A call, SMS or person pressured me",
    icon: "alert-circle-outline",
    needsTransaction: true,
  },
  {
    id: "app_issue",
    label: "Aya didn't work right",
    hint: "Voice, screen or app problem",
    icon: "construct-outline",
    needsTransaction: false,
  },
  {
    id: "other",
    label: "Something else",
    hint: "Talk to a person about it",
    icon: "chatbubbles-outline",
    needsTransaction: false,
  },
];

export function categoryLabel(id: SupportCategory): string {
  return SUPPORT_CATEGORIES.find((c) => c.id === id)?.label ?? "Support request";
}

export function routeFor(
  category: SupportCategory,
  transaction: SupportTransaction | null,
): SupportRoute {
  switch (category) {
    case "wrong_person":
    case "wrong_amount":
      return transaction && transaction.hoursAgo < 24 ? "self_reversal" : "mtn_case";
    case "scam":
      return "fraud_urgent";
    case "not_received":
      return "status_check";
    default:
      return "aya_queue";
  }
}

export function isMoneyRoute(route: SupportRoute) {
  return route !== "aya_queue";
}

const DISTRESS_WORDS = [
  "help me",
  "please help",
  "boa me",
  "kpe ɖe ŋunye",
  "scared",
  "afraid",
  "worried",
  "crying",
  "i don't know what to do",
];

const PRESSURE_WORDS = [
  "hurry",
  "quickly",
  "they said",
  "he said i should",
  "the man on the phone",
  "customer care called",
  "mtn called",
  "asked for my pin",
  "asked for my code",
  "told me to",
];

const SCAM_WORDS = ["scam", "tricked", "fraud", "daadaa", "fake"];

const CATEGORY_HINTS: { category: SupportCategory; words: string[] }[] = [
  { category: "scam", words: SCAM_WORDS },
  {
    category: "wrong_person",
    words: ["wrong person", "wrong number", "ankɔ baabi", "meyi afi si", "didn't go where"],
  },
  { category: "wrong_amount", words: ["wrong amount", "too much", "extra zero"] },
  { category: "not_received", words: ["didn't arrive", "not received", "never got", "pending"] },
  { category: "app_issue", words: ["aya didn't", "app", "not working", "doesn't understand"] },
];

export type SupportSignals = {
  level: SignalLevel;
  distress: boolean;
  pressure: boolean;
  suggestedCategory: SupportCategory | null;
};

/**
 * Behaviour and keyword signals only (architecture.md §6.3, hackathon stage).
 * These may only add care and safety steps; they never block or decide.
 */
export function detectSupportSignals(text: string): SupportSignals {
  const t = text.toLowerCase();
  const has = (words: string[]) => words.some((w) => t.includes(w));
  const distress = has(DISTRESS_WORDS);
  const pressure = has(PRESSURE_WORDS);
  const scam = has(SCAM_WORDS);
  const suggestedCategory =
    CATEGORY_HINTS.find((hint) => has(hint.words))?.category ?? null;
  const level: SignalLevel = pressure || scam ? "high" : distress ? "medium" : "low";
  return { level, distress, pressure, suggestedCategory };
}

export function raiseLevel(a: SignalLevel, b: SignalLevel): SignalLevel {
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return rank[a] >= rank[b] ? a : b;
}

const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newTicketReference(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `AYA-T-${code}`;
}

/** "AYA-T-4F2K" -> "A Y A, T, 4 F, 2 K" so screen readers and TTS read it slowly in pairs. */
export function spokenReference(reference: string): string {
  const [prefix, t, code = ""] = reference.split("-");
  const pairs = code.match(/.{1,2}/g) ?? [];
  return [prefix.split("").join(" "), t, ...pairs.map((p) => p.split("").join(" "))].join(", ");
}

function addWorkingDays(from: number, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

function addDays(from: number, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDay(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Complaint timelines from the Payment Systems and Services Act, 2019 (support.md §1.4). */
export function ticketDeadlines(createdAt: number) {
  return {
    acknowledgeBy: formatDay(addWorkingDays(createdAt, 3)),
    resolveBy: formatDay(addDays(createdAt, 5)),
    complexResolveBy: formatDay(addDays(createdAt, 20)),
  };
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Opened",
  acknowledged: "Picked up by an agent",
  in_progress: "Being worked on",
  waiting_on_mtn: "Waiting on MTN",
  resolved: "Resolved",
};

export const LANGUAGE_NAME: Record<AppLanguage, string> = {
  tw: "Twi",
  ee: "Ewe",
  en: "English",
};

/** Short comfort phrase in the user's language, shown and spoken first. */
export const COMFORT_LINE: Record<AppLanguage, string> = {
  tw: "Mewɔ ha ma wo.",
  ee: "Mele afi kpli wò.",
  en: "I'm here with you.",
};

export const MTN_SELF_REVERSAL_STEPS = [
  "Dial *170#",
  "Choose 6, My Wallet",
  "Choose 8, Reversals",
  "Choose 2, Transaction Reversal",
  "Press 1 to request a reversal",
  "Pick this payment from the list",
  "Type your PIN privately. Aya will not hear it",
];

export function fraudSmsBody(tx: SupportTransaction | null): string {
  if (!tx) return "MoMo fraud report. Please call me back.";
  return [
    "MoMo fraud report.",
    `Amount: ${tx.amount}.`,
    `To: ${tx.counterpart} (${tx.number}).`,
    `When: ${tx.when}.`,
    `Reference: ${tx.reference}.`,
    "I was pressured into this payment. Please call me back.",
  ].join(" ");
}
