/**
 * Recipient resolution (architecture.md §4.2):
 *   1. match the spoken name against saved contacts and nicknames,
 *   2. if several match, ask the user to choose,
 *   3. look up the registered MoMo name and warn if it differs.
 *
 * Fuzzy matching forgives speech-recognition spelling ("Riki Matin"), but a
 * match below the threshold is never guessed: Aya asks instead.
 */

import { detectNetwork, type Recipient } from "../content/send";
import { normalize, similarity, tokenize } from "./text";
import type { AgentContext, ResolvedRecipient } from "./types";

export type Resolution =
  | { status: "resolved"; resolved: ResolvedRecipient; confidence: number }
  | { status: "ambiguous"; candidates: Recipient[] }
  | { status: "unknown"; name: string };

const STRONG = 0.86;
const WEAK = 0.72;

/** Spoken nicknames for the demo contacts. In production these live in the user's secure storage. */
export const DEFAULT_NICKNAMES: Record<string, string> = Object.fromEntries(
  (
    [
      ["maame", "Ama Serwaa"],
      ["me maame", "Ama Serwaa"],
      ["my mother", "Ama Serwaa"],
      ["my mum", "Ama Serwaa"],
      ["mama", "Ama Serwaa"],
      ["danye", "Ama Serwaa"],
      ["nɔnye", "Ama Serwaa"],
      ["my son", "Kojo Mensah"],
      ["me ba", "Kojo Mensah"],
      ["me babarima", "Kojo Mensah"],
      ["vinye", "Kojo Mensah"],
      ["ricky", "Ricky Martin"],
    ] as [string, string][]
  ).map(([k, v]) => [normalize(k), v]),
);

function phoneOf(r: Recipient): string | null {
  return r.kind === "wallet" ? r.phone : null;
}

function scoreContact(query: string, contact: Recipient): number {
  const q = normalize(query);
  const full = normalize(contact.name);
  if (q === full) return 1;
  const qTokens = tokenize(q);
  const nameTokens = tokenize(full);
  // First name or surname alone: "Kwame" matches "Kwame Addo".
  if (qTokens.length === 1 && nameTokens.includes(qTokens[0])) return 0.95;
  let best = similarity(q, full);
  // Each spoken word against each name part, averaged, so "Riki Matin" still finds "Ricky Martin".
  if (qTokens.length > 0) {
    const perToken = qTokens.map((qt) => Math.max(...nameTokens.map((nt) => similarity(qt, nt))));
    best = Math.max(best, perToken.reduce((a, b) => a + b, 0) / perToken.length);
  }
  return best;
}

/** Resolve a spoken name. */
export function resolveName(name: string, ctx: AgentContext): Resolution {
  const q = normalize(name);
  const nick = ctx.nicknames[q];
  const query = nick ?? name;

  const scored = ctx.contacts
    .map((contact) => ({ contact, score: scoreContact(query, contact) }))
    .filter((s) => s.score >= WEAK)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { status: "unknown", name };

  const top = scored[0];
  const close = scored.filter((s) => top.score - s.score < 0.1 && s.score >= WEAK);
  if (close.length > 1 && top.score < 1) {
    return { status: "ambiguous", candidates: close.map((s) => s.contact) };
  }
  if (top.score < STRONG) {
    // One weak match: let the user confirm by choosing rather than guessing.
    return { status: "ambiguous", candidates: [top.contact] };
  }
  return {
    status: "resolved",
    resolved: withNameCheck(top.contact, ctx),
    confidence: Math.min(0.98, 0.8 + top.score * 0.18),
  };
}

/** Attach MTN's registered name to a saved contact, flagging a mismatch for the read-back. */
export function withNameCheck(contact: Recipient, ctx: AgentContext): ResolvedRecipient {
  const phone = phoneOf(contact);
  const registered = phone && contact.kind === "wallet" && contact.network !== "merchant" ? ctx.lookupName(phone) : null;
  if (!registered) return { recipient: contact, registeredName: contact.name, nameMismatch: false };
  return {
    recipient: contact,
    registeredName: registered,
    nameMismatch: similarity(registered, contact.name) < 0.6 && !normalize(registered).includes(normalize(contact.name)),
  };
}

/** Resolve a spoken phone number: a saved contact if we have it, otherwise a name check. */
export function resolvePhone(phone: string, ctx: AgentContext): Resolution {
  const digits = phone.replace(/\D/g, "");
  const saved = ctx.contacts.find((c) => phoneOf(c) === digits);
  if (saved) return { status: "resolved", resolved: withNameCheck(saved, ctx), confidence: 0.95 };
  const network = detectNetwork(digits);
  if (!network) return { status: "unknown", name: digits };
  const registered = ctx.lookupName(digits);
  if (!registered) return { status: "unknown", name: digits };
  return {
    status: "resolved",
    resolved: {
      recipient: { kind: "wallet", name: registered, phone: digits, network, saved: false },
      registeredName: registered,
      nameMismatch: false,
    },
    confidence: 0.92,
  };
}

const ORDINALS: Record<string, number> = Object.fromEntries(
  (
    [
      ["first", 0], ["the first", 0], ["first one", 0], ["the first one", 0], ["one", 0], ["number one", 0],
      ["deɛ ɛdi kan", 0], ["nea edi kan", 0], ["gbãtɔ", 0], ["gbãtɔ la", 0],
      ["second", 1], ["the second", 1], ["second one", 1], ["the second one", 1], ["two", 1], ["number two", 1],
      ["deɛ ɛtɔ so mmienu", 1], ["evelia", 1], ["evelia la", 1],
      ["third", 2], ["the third", 2], ["third one", 2], ["three", 2], ["deɛ ɛtɔ so mmiɛnsa", 2], ["etɔ̃lia", 2],
    ] as [string, number][]
  ).map(([k, v]) => [normalize(k), v]),
);

/** Pick one of several candidates from a spoken answer: ordinal, surname, or last digits. */
export function chooseCandidate(answer: string, candidates: Recipient[]): Recipient | null {
  const a = normalize(answer);
  const ordinal = ORDINALS[a];
  if (ordinal !== undefined && candidates[ordinal]) return candidates[ordinal];

  const digits = a.replace(/\D/g, "");
  if (digits.length >= 2) {
    const byDigits = candidates.filter((c) => {
      const p = phoneOf(c) ?? (c.kind === "bank" ? c.account : "");
      return p.endsWith(digits);
    });
    if (byDigits.length === 1) return byDigits[0];
  }

  const scored = candidates
    .map((c) => ({ c, score: scoreContact(a, c) }))
    .sort((x, y) => y.score - x.score);
  if (scored.length && scored[0].score >= WEAK && (scored.length === 1 || scored[0].score - scored[1].score >= 0.1)) {
    return scored[0].c;
  }
  return null;
}
