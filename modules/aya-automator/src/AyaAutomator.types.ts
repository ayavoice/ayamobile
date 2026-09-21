// AyaAutomator — typed contract between the RN app and the native
// AccessibilityService that drives real MTN MoMo USSD sessions.
//
// The native side is intentionally a *generic mission executor*: all MTN menu
// intelligence lives in JS (aya-mobile/src/lib/ussdMissions.ts) so that tuning
// requires a JS reload, not a native rebuild.

import type { UssdSessionStatus } from "@aya/shared";

/** One ordered action in a USSD mission. */
export type UssdMissionStep = {
  /** What the executor should do at this step. */
  action:
    | "click"
    | "input"
    | "await-dialog"
    | "await-user-input"
    | "done";
  /** Substring to match against the dialog text for `click` steps. */
  match?: string;
  /** Text to type (`input` steps): recipient number, GHS amount, menu digit. */
  value?: string;
  /** Human label surfaced in progress/UI. */
  label: string;
  /** Optional alternative match used to skip a step (e.g. "0. Back"). */
  fallback?: string;
};

export type UssdPinMode = "manual" | "auto";

export type UssdMission = {
  /** Client-generated idempotency/session id. */
  id: string;
  /** Short code without the stars/hash, e.g. "170". */
  shortCode: string;
  steps: UssdMissionStep[];
  pinMode: UssdPinMode;
  /**
   * MoMo PIN for `auto` mode. DEVICE-LOCAL ONLY: handed to the native dialog
   * input in-process, never logged, never transmitted, never spoken. Persisted
   * only in expo-secure-store. MUST be absent in `manual` mode.
   */
  pin?: string;
  /** Overall budget in ms before the session is considered failed/timed out. */
  timeoutMs: number;
  /** Attempt a gentle back-guard at the first displayed screen. */
  safeStart?: boolean;
};

export type UssdOperationFlags = {
  /** True when a candidate (recipient/amount) was already confirmed. */
  shielded?: boolean;
};

export type UssdResult = {
  sessionId: string;
  status: "completed" | "failed" | "cancelled" | "timeout" | "pin-required";
  /** Final dialog text (terminal screen). Empty when the session closed. */
  message: string;
  /** MoMo reference/transaction id when known; null otherwise. */
  reference: string | null;
  /** Parsed balance in pesewas (minor units) when the text contains it. */
  balanceMinor: number | null;
  stepsTaken: string[];
  /** Epoch milliseconds when the session ended. */
  at: number;
};

export type UssdState = {
  status: UssdSessionStatus;
  label: string;
  /** Raw visible text of the current dialog (scrubbed of any PIN digits). */
  screenText: string | null;
  stepIndex: number;
};

export type UssdEvent =
  | { type: "state"; state: UssdState }
  | { type: "step"; label: string; stepIndex: number }
  | { type: "pin-required" }
  | { type: "complete"; result: UssdResult }
  | {
      type: "error";
      code: "dial-blocked" | "no-dialog" | "unknown" | "not-enabled" | "no-call-permission";
      message: string;
    };