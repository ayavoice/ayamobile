/**
 * Shared types for Aya's on-device intelligence layer.
 *
 * The layer turns what a person said (in Twi, Ewe, English, or a mix) into a
 * structured, confidence-scored request, carries a conversation until every
 * money-related slot is certain, reads the transaction back, and only then
 * hands off to private authorization. It never moves money itself.
 */

import type { Recipient } from "../content/send";

/** Languages Aya listens and replies in. Matches `AppLanguage` in content/flows. */
export type Lang = "tw" | "ee" | "en";

/** Intents that lead to a transaction. */
export type ActionIntent = "TRANSFER_MONEY" | "CHECK_BALANCE" | "BUY_AIRTIME" | "BUY_DATA";

/** Short commands that steer the conversation. Must work in every state. */
export type SystemIntent =
  | "CONFIRM"
  | "CANCEL"
  | "REPEAT"
  | "HELP"
  | "CHANGE_AMOUNT"
  | "CHANGE_RECIPIENT";

/** Problems and requests for a person (support.md §4.1). */
export type SupportIntent =
  | "REPORT_PROBLEM"
  | "WRONG_TRANSFER"
  | "REPORT_SCAM"
  | "UNAUTHORISED_TRANSACTION"
  | "MISTAKE_CLAIM_CHECK"
  | "TICKET_STATUS"
  | "TALK_TO_PERSON";

export type Intent = ActionIntent | SystemIntent | SupportIntent | "UNKNOWN";

/** A value plus how sure the engine is about it. Money slots below 0.75 are always re-asked. */
export type Slot<T> = { value: T; confidence: number; source: "digits" | "words" | "contact" | "spoken" | "tap" };

export type LanguageGuess = { lang: Lang; confidence: number; mixed: boolean };

/** What the conversation is waiting for, so one-word answers can be understood. */
export type Expecting = "open" | "amount" | "recipient" | "recipient_choice" | "confirm" | "safety_confirm";

export type ParsedUtterance = {
  text: string;
  normalized: string;
  language: LanguageGuess;
  intent: Intent;
  /** 0..1, how clearly the intent cues matched. */
  confidence: number;
  amount?: Slot<number>;
  /** Spoken recipient name, not yet matched to a contact. */
  recipientName?: Slot<string>;
  /** A spoken Ghana phone number, digits only. */
  phone?: Slot<string>;
  /** "for me" / "ma me" / "nam": airtime or data for the speaker's own number. */
  forSelf?: boolean;
  /** Pressure, urgency, or scam vocabulary heard in this utterance. */
  pressureWords: string[];
  /** Distress vocabulary heard in this utterance. */
  distressWords: string[];
};

export type RiskLevel = "low" | "medium" | "high";

export type RiskReason =
  | "pressure_words"
  | "scam_words"
  | "distress_words"
  | "new_recipient"
  | "large_amount"
  | "very_large_amount"
  | "confusion";

export type RiskAssessment = { level: RiskLevel; reasons: RiskReason[] };

/** A recipient after matching against contacts or a spoken number. */
export type ResolvedRecipient = {
  recipient: Recipient;
  /** Name MTN has on the account (name check). Equal to the saved name for saved contacts in the demo. */
  registeredName: string;
  /** The saved contact name differs from the registered name. */
  nameMismatch: boolean;
};

export type Draft = {
  intent: ActionIntent;
  lang: Lang;
  amount?: Slot<number>;
  recipient?: Slot<ResolvedRecipient>;
  /** The spoken name while it is still unresolved. */
  recipientQuery?: string;
  /** Several contacts matched the spoken name. */
  candidates?: Recipient[];
  /** Airtime or data for the user's own number. */
  forSelf?: boolean;
};

export type Phase =
  | "idle"
  | "listening"
  | "clarifying"
  | "readback"
  | "cooling_off"
  | "confirmed"
  | "cancelled"
  | "handoff";

export type Turn = { who: "user" | "aya"; text: string; key?: string };

export type Handoff = { to: "support" | "person"; intent: SupportIntent; text: string; signal: RiskLevel };

export type DialogueState = {
  phase: Phase;
  expecting: Expecting;
  lang: Lang;
  draft: Draft | null;
  risk: RiskAssessment | null;
  /** The user accepted the cooling-off warning; do not show it twice. */
  riskAcknowledged: boolean;
  turns: Turn[];
  /** Failed attempts to understand in a row. After three, tap mode is offered. */
  misses: number;
  repeats: number;
  corrections: number;
  pressureWords: string[];
  distressWords: string[];
  handoff: Handoff | null;
  /** The last thing Aya said, so "repeat" can say it again. */
  lastSaid: { text: string; key: string } | null;
};

export type DialogueEvent =
  | { type: "start" }
  | { type: "utterance"; text: string }
  | { type: "command"; command: SystemIntent }
  | { type: "choose_recipient"; recipient: Recipient }
  | { type: "set_amount"; value: number }
  | { type: "reset" };

export type Effect =
  | "haptic:listening"
  | "haptic:understood"
  | "haptic:micOff"
  | "haptic:failed"
  | "mic:close"
  | "offer_tap"
  | "navigate:confirmed"
  | "navigate:cancelled"
  | "navigate:handoff";

export type StepResult = {
  state: DialogueState;
  /** What Aya says now, already in the user's language. Null when she stays quiet. */
  say: { text: string; key: string } | null;
  effects: Effect[];
};

/** Everything the dialogue manager needs from the app. Kept as plain data so the manager stays pure. */
export type AgentContext = {
  preferredLang: Lang;
  contacts: Recipient[];
  /** Spoken nickname (normalized) -> contact name, e.g. "maame" -> "Ama Serwaa". */
  nicknames: Record<string, string>;
  /** MoMo name check for a number Aya has not seen before. Swappable for the live lookup. */
  lookupName: (phone: string) => string | null;
  /** Amount in GH₵ from which a transfer counts as unusually large. */
  largeAmount: number;
  veryLargeAmount: number;
};
