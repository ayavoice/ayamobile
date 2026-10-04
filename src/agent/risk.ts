/**
 * Affect and risk signals, hackathon stage (architecture.md §6.3): behaviour
 * and vocabulary only, no voice model. The result can only add safety steps
 * (slower read-back, a pause, a warning, a second confirmation). It never
 * blocks the user, never changes the transaction, and only the level leaves
 * the phone.
 */

import type { AgentContext, Draft, RiskAssessment, RiskReason } from "./types";

export type RiskInput = {
  draft: Draft;
  pressureWords: string[];
  distressWords: string[];
  repeats: number;
  corrections: number;
};

const SCAM_HINTS = ["prize", "promotion", "lottery", "reward", "to unblock", "verify my account", "asked for my pin", "asked for my code"];

export function assessRisk(input: RiskInput, ctx: AgentContext): RiskAssessment {
  const reasons: RiskReason[] = [];
  const { draft } = input;

  if (input.pressureWords.length > 0) {
    reasons.push(input.pressureWords.some((w) => SCAM_HINTS.includes(w)) ? "scam_words" : "pressure_words");
  }
  if (input.distressWords.length > 0) reasons.push("distress_words");

  const movesMoney = draft.intent === "TRANSFER_MONEY";
  const newRecipient = movesMoney && draft.recipient ? !draft.recipient.value.recipient.saved : false;
  if (newRecipient) reasons.push("new_recipient");

  const amount = draft.amount?.value ?? 0;
  if (movesMoney && amount >= ctx.veryLargeAmount) reasons.push("very_large_amount");
  else if (movesMoney && amount >= ctx.largeAmount) reasons.push("large_amount");

  if (input.repeats + input.corrections >= 3) reasons.push("confusion");

  let level: RiskAssessment["level"] = "low";
  const high =
    reasons.includes("pressure_words") ||
    reasons.includes("scam_words") ||
    (newRecipient && reasons.includes("very_large_amount")) ||
    (reasons.includes("distress_words") && movesMoney);
  const medium =
    newRecipient || reasons.includes("large_amount") || reasons.includes("very_large_amount") || reasons.includes("confusion");
  if (high) level = "high";
  else if (medium) level = "medium";

  return { level, reasons };
}

/** Confusion signals call for slower, simpler wording. */
export function isGentle(repeats: number, corrections: number, distressWords: string[]): boolean {
  return repeats >= 2 || corrections >= 2 || distressWords.length > 0;
}
