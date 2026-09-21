import type {
  UssdMission,
  UssdMissionStep,
  UssdPinMode,
  UssdResult,
} from "@aya/automator";
import type { FlowId, MinorAmount, ParsedIntent } from "@aya/shared";

/**
 * MTN MoMo USSD mission builders.
 *
 * The native accessibility engine is a dumb executor; every MTN menu label,
 * ordering choice and PIN policy decision lives in THIS file so that tuning the
 * flows is a JS reload — never a native rebuild.
 *
 * Labelling convention for `click` steps:
 *   match    = the human label to click (exact/substring, case-insensitive)
 *   fallback = "N. <label>" — the leading digit is typed into the response
 *              field when the menu renders as a single text block (no clickable
 *              nodes). Digits are best-effort sequencing and are tuned on
 *              device.
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

/** Dial *170# and read the MoMo main menu. Shared preamble for most flows. */
const MOMO_MAIN_MENU: UssdMissionStep = {
  action: "click",
  label: "MoMo menu",
  match: "momo",
  fallback: "1. MoMo",
};

/**
 * *170# → "Your Balance".
 * The balance screen ("Your balance is GH₵ …") is detected by the terminal
 * scanner and the parsed amount is returned in `result.balanceMinor`.
 *
 * Provisional menu position: "Your Balance" is option 1 on the classic MoMo
 * main menu. Tune `fallback` on device.
 */
export function balanceMission(pinSpec: PinSpec = { pinMode: "manual" }): UssdMission {
  return mission(
    newMissionId("bal"),
    "170",
    [
      MOMO_MAIN_MENU,
      {
        action: "click",
        label: "Your balance",
        match: "your balance",
        fallback: "1. Your Balance",
      },
      { action: "await-dialog", label: "Reading balance", match: "balance" },
      { action: "done", label: "Balance fetched", match: "balance" },
    ],
    pinSpec,
  );
}

/**
 * *170# → "Send Money" → recipient number → amount → confirm → PIN → done.
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
      MOMO_MAIN_MENU,
      {
        action: "click",
        label: "Send money",
        match: "send money",
        fallback: "2. Send Money",
      },
      // MTN then asks who to send to: "MoMo user" vs bank/other networks.
      {
        action: "click",
        label: "To Mobile Money user",
        match: "to",
        fallback: "1. Mobile Money user",
      },
      {
        action: "input",
        label: "Recipient number",
        match: "number",
        value: phone,
      },
      // Number → name confirmation screen ("Send to Saint Dannyyy?").
      {
        action: "click",
        label: "Confirm recipient",
        match: "confirm",
        fallback: "1. Confirm",
      },
      {
        action: "input",
        label: "Amount in cedis",
        match: "amount",
        value: ghsInput(amountMinor),
      },
      {
        action: "click",
        label: "Confirm amount",
        match: "confirm",
        fallback: "1. Confirm",
      },
      pinStep(pinSpec),
      { action: "done", label: "Transaction sent", match: "successful" },
    ],
    pinSpec,
  );
}

/**
 * *170# → "Buy Airtime" → amount → confirm → PIN → done.
 * Airtime is bought for the authenticated number when `recipientPhone` is
 * absent, otherwise for `recipientPhone` (digit type + confirm tie-in).
 */
export function airtimeMission(
  amountMinor: MinorAmount,
  recipientPhone: string | null,
  pinSpec: PinSpec,
): UssdMission {
  const steps: UssdMissionStep[] = [
    MOMO_MAIN_MENU,
    {
      action: "click",
      label: "Buy airtime",
      match: "airtime",
      fallback: "4. Buy Airtime",
    },
  ];

  if (recipientPhone) {
    steps.push(
      {
        action: "click",
        label: "Airtime for another number",
        match: "another number",
        fallback: "2. Another number",
      },
      {
        action: "input",
        label: "Airtime recipient number",
        match: "number",
        value: recipientPhone.replace(/\D/g, ""),
      },
    );
  }

  steps.push(
    {
      action: "input",
      label: "Airtime amount",
      match: "amount",
      value: ghsInput(amountMinor),
    },
    {
      action: "click",
      label: "Confirm airtime",
      match: "confirm",
      fallback: "1. Confirm",
    },
    pinStep(pinSpec),
    { action: "done", label: "Airtime sent", match: "successful" },
  );

  return mission(newMissionId("air"), "170", steps, pinSpec);
}

/**
 * PIN policy: `manual` (default) hands the dialog back to the user — Aya never
 * sees the PIN; `auto` fills it in-process from expo-secure-store (device-local
 * only, never logged/transmitted/spoken).
 */
/**
 * Normalise a phone for the USSD prompt: MTN expects the 10-digit form
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