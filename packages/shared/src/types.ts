/**
 * Shared domain contracts for Aya.
 * AppLanguage mirrors the app's UI languages (tw = Akan/Twi, ee = Ewe, en = English).
 * Money is always integer minor units of Ghana Cedi (pesewas) to avoid float drift.
 */

export type AppLanguage = "tw" | "ee" | "en";

/** High-level user intent, mirrors the flows in the mobile app. */
export type FlowId = "transfer" | "balance" | "airtime" | "data" | "bill";

/** Amount stored as integer minor units (pesewas). GH₵ 2,648.34 => 264834. */
export type MinorAmount = number;

export type UserProfile = {
  id: string;
  phone: string;
  name: string | null;
  preferredLanguage: AppLanguage | null;
};

export type Wallet = {
  id: string;
  userId: string;
  balanceMinor: MinorAmount;
  currency: "GHS";
  updatedAt: string;
};

export type TxType = "send" | "airtime" | "data" | "bill" | "receive";
export type TxStatus = "pending" | "completed" | "failed";

export type Transaction = {
  id: string;
  userId: string;
  walletId: string | null;
  type: TxType;
  amountMinor: MinorAmount;
  feeMinor: MinorAmount;
  /** Recipient name, phone, or network label as displayed. */
  counterpart: string | null;
  reference: string;
  status: TxStatus;
  createdAt: string;
};

export type Receipt = {
  id: string;
  transactionId: string;
  /** Opaque JSON payload rendered by the client receipt view. */
  payload: string | null;
  issuedAt: string;
};

/** Parsed intent produced by the phrase-bank matcher (Phase 2). Tolerant of WER. */
export type ParsedIntent = {
  flow: FlowId | null;
  language: AppLanguage;
  slots: {
    amountMinor?: MinorAmount;
    payee?: string;
    phone?: string;
    networkId?: string;
  };
  rawText: string;
  confidence: number;
};

export type UssdSessionStatus =
  | "dialed"
  | "awaiting-input"
  | "menu"
  | "result"
  | "closed"
  | "failed";

/** Live USSD session state mirrored from the device automator (Phase 4). */
export type UssdSession = {
  id: string;
  networkId: string;
  shortCode: string;
  status: UssdSessionStatus;
  menuLabel: string | null;
  options: string[];
  awaitedPrompt: string | null;
  steps: { label: string; at: string }[];
};

/** Contract shared with ayaai (Python ASR/TTS). */
export type AyaaiTranscriptRequest = {
  /** Raw PCM16 LE mono audio; base64 string or raw bytes. */
  audio: string;
  sampleRate: number;
  language: AppLanguage;
};

export type AyaaiTranscriptResponse = {
  text: string;
  language: AppLanguage;
  confidence: number | null;
};

export type AyaaiSpeechRequest = {
  text: string;
  language: AppLanguage;
  /** e.g. "mms-tts-aka" — default chosen by ayaai if omitted. */
  voice?: string;
};

export type AyaaiSpeechResponse = {
  /** Base64-encoded WAV. */
  audio: string;
  mimeType: "audio/wav";
  sampleRate: number;
};

export type HealthResponse = {
  status: "ok";
  service: "ayaserver";
  time: string;
  version: string;
};

/* ----------------------------- API contracts ----------------------------- */

/** Body for POST /v1/auth/request-otp */
export type RequestOtpBody = {
  phone: string;
};

/** Body for POST /v1/auth/verify-otp */
export type VerifyOtpBody = {
  phone: string;
  code: string;
};

export type AuthResult = {
  token: string;
  user: UserProfile;
  wallet: Wallet;
};

/**
 * Body for POST /v1/transactions — any financial operation Aya can place:
 * send (mobile money), airtime, data, bill payments. `receive` is tracked
 * server-side when the merchant QR flow is settled.
 */
export type CreateTransactionBody = {
  type: TxType;
  amountMinor: MinorAmount;
  /** Display name of recipient / biller / bundle (human label). */
  counterpart?: string | null;
  /** Recipient or account phone/number. */
  destination?: string | null;
  /** Network shortcode registry key when relevant (e.g. "mtn", "telecel", "at"). */
  networkId?: string | null;
  /** Client-supplied idempotency key; re-sending the same key returns the original result. */
  idempotencyKey?: string | null;
};

export type TransactionResponse = {
  transaction: Transaction;
  receipt: Receipt | null;
};

export type TransactionListResponse = {
  transactions: Transaction[];
};

export type WalletResponse = {
  wallet: Wallet;
};

/** NEW: receipts are the merchant-facing proof-of-payment payload. */
export type ReceiptResponse = {
  receipt: Receipt;
};