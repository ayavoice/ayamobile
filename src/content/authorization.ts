/**
 * Private authorization built on MTN MoMo pre-approval:
 * the owner approves a standing permission once with their MoMo PIN,
 * then everyday payments inside it only need fingerprint or face.
 * The PIN comes back only as a deliberate safety step.
 */

export type PreApproval = {
  perPayment: number;
  perDay: number;
  savedContactsOnly: boolean;
};

export const DEFAULT_PRE_APPROVAL: PreApproval = {
  perPayment: 200,
  perDay: 500,
  savedContactsOnly: true,
};

export const PER_PAYMENT_OPTIONS = [100, 200, 500] as const;
export const PER_DAY_OPTIONS = [300, 500, 1000] as const;

export type PinReason = "no-pre-approval" | "over-payment" | "over-day" | "new-recipient";

export type AuthDecision = { mode: "fingerprint" } | { mode: "pin"; reason: PinReason };

type AuthInput = {
  amount: number;
  savedRecipient: boolean;
  spentToday: number;
  preApproval: PreApproval | null;
};

export function decideAuth({ amount, savedRecipient, spentToday, preApproval }: AuthInput): AuthDecision {
  if (!preApproval) return { mode: "pin", reason: "no-pre-approval" };
  if (amount > preApproval.perPayment) return { mode: "pin", reason: "over-payment" };
  if (spentToday + amount > preApproval.perDay) return { mode: "pin", reason: "over-day" };
  if (preApproval.savedContactsOnly && !savedRecipient) return { mode: "pin", reason: "new-recipient" };
  return { mode: "fingerprint" };
}

export function pinReasonText(reason: PinReason, preApproval: PreApproval | null): string {
  switch (reason) {
    case "no-pre-approval":
      return "No everyday limit set yet";
    case "over-payment":
      return `Over your GH₵${preApproval?.perPayment} per-payment limit`;
    case "over-day":
      return `Over your GH₵${preApproval?.perDay} daily limit`;
    case "new-recipient":
      return "New recipient";
  }
}

export function parseAmount(text: string): number {
  return Number(text.replace(/[^\d.]/g, "")) || 0;
}

export const AUTH_LINES = {
  owner: "Use biometrics to confirm it's you.",
  pin: "For your safety, enter your MoMo PIN. It goes to MTN only.",
  approved: "Approved.",
  preApproved: "Done. Everyday payments inside your limits now only need biometrics.",
} as const;
