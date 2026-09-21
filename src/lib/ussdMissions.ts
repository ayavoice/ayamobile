import type {
  UssdMission,
  UssdMissionStep,
  UssdPinMode,
  UssdResult,
} from "@aya/automator";
import type { FlowId, MinorAmount, ParsedIntent } from "@aya/shared";

/**
 * Carrier USSD mission builders (MTN *170#, Telecel *110#, AT *110#).
 *
 * The native accessibility engine is a dumb executor; every menu label,
 * ordering choice and PIN policy decision lives in THIS file so that tuning the
 * flows is a JS reload — never a native rebuild.
 *
 * Labelling convention for `click` steps:
 *   match    = the human label to click (exact/substring, case-insensitive)
 *   fallback = "N. <label>" — the leading digit is typed into the response
 *              field when the menu renders as a single text block (no clickable
 *              nodes). Digits follow the real carrier menus and can be tuned on
 *              device from the sanitized MENU… log.
 *
 * Flows (carrier menus observed from a real phone, Sept 2026):
 *   MTN     *170#  1 Transfer Money · 2 MoMoPay & Pay Bill · 3 Airtime &
 *                  Bundles · 4 Allow Cash-Out · 5 Financial Services · 6 My Wallet
 *   Telecel *110#  1 Send Money · …
 *   AT      *110#  1 Send Money · …
 */

let seq = 0;

export function newMissionId(prefix: "bal" | "send" | "air" | "data"): string {
  seq = (seq + 1) % 1_000_000;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}`;
}

/** GH₵ amount as typed into a USSD prompt ("5" or "5.5"; no "GH₵" suffix). */
export function ghsInput(amountMinor: MinorAmount): string {
  const ghs = amountMinor / 100;
  const fixed = ghs.toFixed(2);
  return fixed.replace(/\.?0+$/, "").replace(/^$/, "0");
}

/** Random 4-digit transaction reference shown to MTN/Telecel/AT ("Aya-4821"). */
export function randomReference(): string {
  return `Aya-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Best-effort MoMo reference from a real USSD terminal screen. Prefers the
 * automator's parsed `reference`, then scans the raw dialog text for a typical
 * MTN reference token.
 */
export function referenceFromResult(
  result: Pick<UssdResult, "reference" | "message"> | null | undefined,
): string | null {
  if (!result) return null;
  if (result.reference) return result.reference;
  const token = result.message.match(/\b[A-Z]{2}[A-Za-z0-9]{6,12}\b/);
  if (token) return token[0];
  const digits = result.message.match(/\b\d{6,12}\b/);
  return digits ? digits[0] : null;
}

export type PinSpec = { pinMode: UssdPinMode; pin?: string };

/** Resolve a 10-digit Ghanaian number to its home carrier for flow routing. */
export type CarrierId = "mtn" | "telecel" | "at";

export function carrierForPhone(phoneDigits: string): CarrierId {
  const p = phoneDigits.replace(/\D/g, "");
  const tel = p.slice(0, 3);
  if (["020", "050"].includes(tel)) return "telecel";
  if (["026", "027", "056", "057"].includes(tel)) return "at";
  return "mtn";
}

function mission(
  id: string,
  shortCode: string,
  steps: UssdMissionStep[],
  pinSpec: PinSpec,
  timeoutMs = 180_000,
): UssdMission {
  return {
    id,
    shortCode,
    steps,
    pinMode: pinSpec.pinMode,
    pin: pinSpec.pin,
    timeoutMs,
  };
}

/**
 * *170# → 6 My Wallet → 1 Check Balance → 1 MoMo Balance → PIN → done.
 * The balance screen ("Your balance is GH₵ …") is detected by the terminal
 * scanner and the parsed amount is returned in `result.balanceMinor`.
 */
export function balanceMission(pinSpec: PinSpec = { pinMode: "manual" }): UssdMission {
  return mission(
    newMissionId("bal"),
    "170",
    [
      { action: "click", label: "My Wallet", match: "1. my wallet", fallback: "6. My Wallet" },
      { action: "click", label: "Check balance", match: "1. check balance", fallback: "1. Check Balance" },
      { action: "click", label: "MoMo balance", match: "1. momo balance", fallback: "1. MoMo Balance" },
      pinStep(pinSpec),
      { action: "done", label: "Balance fetched", match: "your balance" },
    ],
    pinSpec,
  );
}

/**
 * MTN *170# → 1 Transfer Money → 1 MoMo User → recipient number → re-enter
 * number (confirmation) → amount → reference ("Aya-####") → PIN → authorize
 * (1) Yes → done ("your request is being processed…").
 * `recipientPhone` is the recipient's number WITHOUT the country code.
 */
export function sendMission(
  recipientPhone: string,
  amountMinor: MinorAmount,
  pinSpec: PinSpec,
): UssdMission {
  const phone = recipientPhone.replace(/\D/g, "");
  return mission(
    newMissionId("send"),
    "170",
    [
      { action: "click", label: "Transfer money", match: "1. transfer money", fallback: "1. Transfer Money" },
      { action: "click", label: "To a MoMo user", match: "momo user", fallback: "1. MoMo User" },
      { action: "input", label: "Recipient number", match: "number", value: phone },
      { action: "input", label: "Confirm recipient number", match: "number", value: phone },
      { action: "input", label: "Amount in cedis", match: "amount", value: ghsInput(amountMinor) },
      { action: "input", label: "Add a reference", match: "reference", value: randomReference() },
      pinStep(pinSpec),
      { action: "click", label: "Authorise transfer", match: "1. yes", fallback: "1. Yes" },
      { action: "done", label: "Transaction sent", match: "processe" },
    ],
    pinSpec,
  );
}

/**
 * Telecel *110# → 1 Send Money → 1 Telecel Cash → number → amount → reference
 * → PIN → (1) Confirm → done ("transaction submitted…").
 * Built for future sender-awareness; routed today via `missionForFlow` only
 * when the caller opts into a Telecel session.
 */
export function telecelTransferMission(
  recipientPhone: string,
  amountMinor: MinorAmount,
  pinSpec: PinSpec,
): UssdMission {
  const phone = recipientPhone.replace(/\D/g, "");
  return mission(
    newMissionId("send"),
    "110",
    [
      { action: "click", label: "Send money", match: "1. send money", fallback: "1. Send Money" },
      { action: "click", label: "Telecel Cash user", match: "telecel cash", fallback: "1. Telecel Cash" },
      { action: "input", label: "Recipient number", match: "number", value: phone },
      { action: "input", label: "Amount in cedis", match: "amount", value: ghsInput(amountMinor) },
      { action: "input", label: "Add a reference", match: "reference", value: randomReference() },
      pinStep(pinSpec),
      { action: "click", label: "Confirm transaction", match: "1. confirm", fallback: "1. Confirm" },
      { action: "done", label: "Transaction submitted", match: "submitted" },
    ],
    pinSpec,
  );
}

/**
 * AT *110# → 1 Send Money → 1 AT User → number → amount → reference → PIN →
 * (1) Yes → done ("request processing…").
 * Built for future sender-awareness; routed today via `missionForFlow` only
 * when the caller opts into an AT session.
 */
export function atTransferMission(
  recipientPhone: string,
  amountMinor: MinorAmount,
  pinSpec: PinSpec,
): UssdMission {
  const phone = recipientPhone.replace(/\D/g, "");
  return mission(
    newMissionId("send"),
    "110",
    [
      { action: "click", label: "Send money", match: "1. send money", fallback: "1. Send Money" },
      { action: "click", label: "AT user", match: "at user", fallback: "1. AT User" },
      { action: "input", label: "Recipient number", match: "number", value: phone },
      { action: "input", label: "Amount in cedis", match: "amount", value: ghsInput(amountMinor) },
      { action: "input", label: "Add a reference", match: "reference", value: randomReference() },
      pinStep(pinSpec),
      { action: "click", label: "Confirm transaction", match: "1. yes", fallback: "1. Yes" },
      { action: "done", label: "Transaction sent", match: "processe" },
    ],
    pinSpec,
  );
}

/**
 * MTN *170# → 3 Airtime & Bundles → 1 Airtime → 1 Self / 2 Others → amount →
 * PIN → close (OK) → done. Airtime is bought for the authenticated number when
 * `recipientPhone` is absent, otherwise for `recipientPhone` (2 Others + number).
 */
export function airtimeMission(
  amountMinor: MinorAmount,
  recipientPhone: string | null,
  pinSpec: PinSpec,
): UssdMission {
  const steps: UssdMissionStep[] = [
    { action: "click", label: "Airtime & bundles", match: "airtime & bundles", fallback: "3. Airtime & Bundles" },
    { action: "click", label: "Airtime", match: "1. airtime", fallback: "1. Airtime" },
  ];

  if (recipientPhone) {
    steps.push(
      { action: "click", label: "Airtime for another number", match: "2. others", fallback: "2. Others" },
      {
        action: "input",
        label: "Airtime recipient number",
        match: "number",
        value: recipientPhone.replace(/\D/g, ""),
      },
    );
  } else {
    steps.push({ action: "click", label: "Airtime for self", match: "1. self", fallback: "1. Self" });
  }

  steps.push(
    { action: "input", label: "Airtime amount", match: "amount", value: ghsInput(amountMinor) },
    pinStep(pinSpec),
    { action: "click", label: "Close", match: "ok", fallback: "1. Continue" },
    { action: "done", label: "Airtime sent", match: "successfully" },
  );

  return mission(newMissionId("air"), "170", steps, pinSpec);
}

/**
 * Normalise a phone for the USSD prompt: carriers expect the 10-digit form
 * ("0241234567"). Accepts E.164 ("+233241234567"), "233…" or bare digits.
 */
export function ussdPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return digits;
}

/**
 * Builds the mission for whatever flow Aya is about to drive. Returns null
 * when the draft lacks what the flow needs or the flow isn't automatable yet.
 * The sender is assumed to be an MTN line this round; receiver routing for
 * Telecel/AT senders is wired through `telecelTransferMission`/`atTransferMission`.
 */
export function missionForFlow(
  flow: FlowId,
  draft: {
    slots: ParsedIntent["slots"];
    recipient?: { name: string; phone: string };
  },
  pinSpec: PinSpec,
): UssdMission | null {
  switch (flow) {
    case "balance":
      return balanceMission(pinSpec);
    case "transfer": {
      const amount = draft.slots.amountMinor;
      if (!draft.recipient?.phone || !amount) return null;
      return sendMission(ussdPhone(draft.recipient.phone), amount, pinSpec);
    }
    case "airtime": {
      const amount = draft.slots.amountMinor;
      if (!amount) return null;
      return airtimeMission(
        amount,
        draft.recipient?.phone ? ussdPhone(draft.recipient.phone) : null,
        pinSpec,
      );
    }
    default:
      return null;
  }
}

export function pinStep(pinSpec: PinSpec): UssdMissionStep {
  if (pinSpec.pinMode === "auto" && pinSpec.pin) {
    return {
      action: "input",
      label: "Authorising with Aya",
      match: "pin",
      value: pinSpec.pin,
    };
  }
  return {
    action: "await-user-input",
    label: "Enter your MoMo PIN on the screen",
    match: "pin",
  };
}