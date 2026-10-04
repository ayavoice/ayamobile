/**
 * Dialogue manager (architecture.md §5): a strict, pure state machine.
 *
 *   listening -> clarifying* -> readback -> (cooling_off) -> confirmed
 *                                     \-> cancelled          \-> mic closes
 *   any state -> handoff (support / talk to a person)
 *
 * It is the only module allowed to move a transaction forward. It never
 * guesses a money slot: low confidence on an amount or recipient always
 * becomes a question. "Cancel" and "talk to a person" work in every state.
 */

import { parseUtterance } from "./nlu";
import { chooseCandidate, resolveName, resolvePhone, withNameCheck, type Resolution } from "./recipients";
import { candidateList, coolingOff, line, readback, type LineKey } from "./responses";
import { assessRisk, isGentle } from "./risk";
import type {
  AgentContext,
  Draft,
  DialogueEvent,
  DialogueState,
  Effect,
  Lang,
  ParsedUtterance,
  RiskLevel,
  StepResult,
  SupportIntent,
  SystemIntent,
} from "./types";
import type { Recipient } from "../content/send";
import { formatCurrency as formatAmount } from "../lib/currency";

/** Money slots below this are re-asked, never assumed. */
export const MONEY_CONFIDENCE = 0.75;
/** After this many misunderstandings in a row, Aya offers tap mode. */
export const TAP_AFTER_MISSES = 3;

const SUPPORT_INTENTS: SupportIntent[] = [
  "REPORT_PROBLEM",
  "WRONG_TRANSFER",
  "REPORT_SCAM",
  "UNAUTHORISED_TRANSACTION",
  "MISTAKE_CLAIM_CHECK",
  "TICKET_STATUS",
  "TALK_TO_PERSON",
];
const SYSTEM_INTENTS: SystemIntent[] = ["CONFIRM", "CANCEL", "REPEAT", "HELP", "CHANGE_AMOUNT", "CHANGE_RECIPIENT"];

export function initialState(lang: Lang): DialogueState {
  return {
    phase: "idle",
    expecting: "open",
    lang,
    draft: null,
    risk: null,
    riskAcknowledged: false,
    turns: [],
    misses: 0,
    repeats: 0,
    corrections: 0,
    pressureWords: [],
    distressWords: [],
    handoff: null,
    lastSaid: null,
  };
}

const isTerminal = (s: DialogueState) => s.phase === "confirmed" || s.phase === "cancelled" || s.phase === "handoff";
const uniq = (xs: string[]) => [...new Set(xs)];

function reply(state: DialogueState, text: string, key: string, effects: Effect[] = []): StepResult {
  return {
    state: { ...state, turns: [...state.turns, { who: "aya", text, key }], lastSaid: { text, key } },
    say: { text, key },
    effects,
  };
}

function say(state: DialogueState, key: LineKey, params: Record<string, string> = {}, effects: Effect[] = []): StepResult {
  return reply(state, line(key, state.lang, params), key, effects);
}

// ---------------------------------------------------------------------------
// Slot filling
// ---------------------------------------------------------------------------

type Notice = "unknown_recipient" | "unknown_number" | "bank_airtime";
type Merge = { draft: Draft; changed: boolean; notice?: { key: Notice; name?: string } };

function applyResolution(draft: Draft, res: Resolution, viaPhone: boolean): Merge {
  const topUp = draft.intent === "BUY_AIRTIME" || draft.intent === "BUY_DATA";
  switch (res.status) {
    case "resolved":
      if (topUp && res.resolved.recipient.kind === "bank") return { draft, changed: false, notice: { key: "bank_airtime" } };
      return {
        draft: {
          ...draft,
          recipient: { value: res.resolved, confidence: res.confidence, source: viaPhone ? "digits" : "contact" },
          candidates: undefined,
          recipientQuery: undefined,
          forSelf: false,
        },
        changed: true,
      };
    case "ambiguous": {
      const candidates = topUp ? res.candidates.filter((c) => c.kind === "wallet") : res.candidates;
      if (candidates.length === 0) return { draft, changed: false, notice: { key: "bank_airtime" } };
      return { draft: { ...draft, recipient: undefined, candidates }, changed: true };
    }
    case "unknown":
      return {
        draft: { ...draft, recipient: undefined, candidates: undefined, recipientQuery: res.name },
        changed: true,
        notice: { key: viaPhone ? "unknown_number" : "unknown_recipient", name: res.name },
      };
  }
}

function merge(draft: Draft, p: ParsedUtterance, ctx: AgentContext): Merge {
  let out: Merge = { draft, changed: false };
  if (draft.intent === "CHECK_BALANCE") return out;

  if (p.amount) {
    const prev = draft.amount;
    // Hearing the same uncertain number twice makes it certain.
    const confidence = prev && prev.confidence < MONEY_CONFIDENCE && prev.value === p.amount.value ? 0.95 : p.amount.confidence;
    out = { draft: { ...out.draft, amount: { ...p.amount, confidence } }, changed: true };
  }

  const topUp = draft.intent !== "TRANSFER_MONEY";
  if (p.phone) {
    const m = applyResolution(out.draft, resolvePhone(p.phone.value, ctx), true);
    out = { draft: m.draft, changed: out.changed || m.changed, notice: m.notice };
  } else if (p.recipientName) {
    const m = applyResolution(out.draft, resolveName(p.recipientName.value, ctx), false);
    out = { draft: m.draft, changed: out.changed || m.changed, notice: m.notice };
  } else if (topUp && p.forSelf) {
    out = { draft: { ...out.draft, forSelf: true, recipient: undefined, candidates: undefined }, changed: true };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Moving forward
// ---------------------------------------------------------------------------

function clarify(state: DialogueState, draft: Draft, key: LineKey, params: Record<string, string>, expecting: DialogueState["expecting"]): StepResult {
  return say({ ...state, draft, phase: "clarifying", expecting, misses: 0 }, key, params);
}

/** Ask for the next missing or uncertain slot, or read the transaction back. */
function advance(state: DialogueState, ctx: AgentContext, notice?: Merge["notice"]): StepResult {
  const draft = state.draft!;
  const lang = state.lang;
  const amountText = draft.amount ? formatAmount(draft.amount.value) : "";

  if (notice) return clarify(state, draft, notice.key, { name: notice.name ?? "" }, "recipient");

  if (draft.candidates?.length) {
    const key: LineKey = draft.candidates.length === 1 ? "confirm_candidate" : "choose_recipient";
    return clarify(state, draft, key, { list: candidateList(draft.candidates, lang) }, "recipient_choice");
  }

  if (draft.intent === "TRANSFER_MONEY") {
    if (!draft.recipient) {
      return draft.amount
        ? clarify(state, draft, "ask_recipient", { amount: amountText }, "recipient")
        : clarify(state, draft, "ask_recipient_any", {}, "recipient");
    }
    if (!draft.amount) {
      return clarify(state, draft, "ask_amount_transfer", { name: draft.recipient.value.registeredName }, "amount");
    }
  }
  if ((draft.intent === "BUY_AIRTIME" || draft.intent === "BUY_DATA") && !draft.amount) {
    return clarify(state, draft, draft.intent === "BUY_DATA" ? "ask_amount_data" : "ask_amount_airtime", {}, "amount");
  }

  if (draft.amount) {
    if (!(draft.amount.value > 0)) return clarify(state, { ...draft, amount: undefined }, "amount_invalid", {}, "amount");
    if (draft.amount.confidence < MONEY_CONFIDENCE) return clarify(state, draft, "amount_unsure", { amount: amountText }, "amount");
  }

  const risk = assessRisk(
    {
      draft,
      pressureWords: state.pressureWords,
      distressWords: state.distressWords,
      repeats: state.repeats,
      corrections: state.corrections,
    },
    ctx,
  );
  const next = { ...state, draft, risk, misses: 0 };

  if (risk.level === "high" && !state.riskAcknowledged) {
    const { text, key } = coolingOff(draft, lang);
    return reply({ ...next, phase: "cooling_off", expecting: "safety_confirm" }, text, key, ["haptic:understood"]);
  }
  const gentle = isGentle(state.repeats, state.corrections, state.distressWords);
  const { text, key } = readback(draft, lang, risk, gentle);
  return reply({ ...next, phase: "readback", expecting: "confirm" }, text, key, ["haptic:understood"]);
}

function confirm(state: DialogueState): StepResult {
  return say({ ...state, phase: "confirmed", expecting: "open" }, "confirmed", {}, ["haptic:micOff", "mic:close", "navigate:confirmed"]);
}

function cancel(state: DialogueState): StepResult {
  return say({ ...state, phase: "cancelled", expecting: "open" }, "cancelled", {}, ["haptic:failed", "mic:close", "navigate:cancelled"]);
}

function signalLevel(state: DialogueState): RiskLevel {
  if (state.pressureWords.length) return "high";
  if (state.distressWords.length) return "medium";
  return state.risk?.level ?? "low";
}

function handoff(state: DialogueState, intent: SupportIntent, text: string): StepResult {
  const to = intent === "TALK_TO_PERSON" ? "person" : "support";
  const next: DialogueState = {
    ...state,
    phase: "handoff",
    expecting: "open",
    handoff: { to, intent, text, signal: signalLevel(state) },
  };
  return say(next, to === "person" ? "handoff_person" : "handoff_support", {}, ["mic:close", "navigate:handoff"]);
}

function miss(state: DialogueState, ctx: AgentContext): StepResult {
  const misses = state.misses + 1;
  if (misses >= TAP_AFTER_MISSES) {
    return say({ ...state, misses }, "offer_tap", {}, ["offer_tap", "haptic:failed"]);
  }
  if (state.draft && state.phase !== "listening") {
    // Ask the same question again rather than starting over.
    const again = state.phase === "readback" || state.phase === "cooling_off" ? say(state, "confirm_unclear") : advance(state, ctx);
    return { ...again, state: { ...again.state, misses } };
  }
  return say({ ...state, misses }, "not_understood");
}

function startDraft(state: DialogueState, intent: Draft["intent"]): DialogueState {
  const replacing = state.draft && state.draft.intent !== intent;
  return {
    ...state,
    draft: { intent, lang: state.lang },
    risk: null,
    riskAcknowledged: false,
    corrections: replacing ? state.corrections + 1 : state.corrections,
  };
}

// ---------------------------------------------------------------------------
// Event handling
// ---------------------------------------------------------------------------

function handleCommand(state: DialogueState, command: SystemIntent, p: ParsedUtterance | null, ctx: AgentContext): StepResult {
  const draft = state.draft;
  switch (command) {
    case "CANCEL":
      return cancel(state);
    case "REPEAT": {
      const s = { ...state, repeats: state.repeats + 1 };
      // A repeated read-back gets slower and simpler.
      if (draft && (state.phase === "readback" || state.phase === "cooling_off")) return advance(s, ctx);
      if (state.lastSaid) return reply(s, state.lastSaid.text, state.lastSaid.key);
      return say(s, "greet");
    }
    case "HELP":
      return say(state, "help");
    case "CHANGE_AMOUNT": {
      if (!draft) return miss(state, ctx);
      const amount = p?.amount ? { ...p.amount } : undefined;
      return advance({ ...state, draft: { ...draft, amount }, corrections: state.corrections + 1 }, ctx);
    }
    case "CHANGE_RECIPIENT": {
      if (!draft) return miss(state, ctx);
      const cleared: Draft = { ...draft, recipient: undefined, candidates: undefined, recipientQuery: undefined, forSelf: false };
      const s = { ...state, corrections: state.corrections + 1 };
      if (p?.phone) {
        const m = applyResolution(cleared, resolvePhone(p.phone.value, ctx), true);
        return advance({ ...s, draft: m.draft }, ctx, m.notice);
      }
      return advance({ ...s, draft: cleared }, ctx);
    }
    case "CONFIRM":
      if (state.expecting === "confirm" && draft) return confirm(state);
      if (state.expecting === "safety_confirm" && draft) return confirm({ ...state, riskAcknowledged: true });
      if (state.expecting === "recipient_choice" && draft?.candidates?.length === 1) {
        return chooseRecipient(state, draft.candidates[0], ctx);
      }
      return miss(state, ctx);
  }
}

function chooseRecipient(state: DialogueState, recipient: Recipient, ctx: AgentContext): StepResult {
  const draft = state.draft!;
  const next: Draft = {
    ...draft,
    recipient: { value: withNameCheck(recipient, ctx), confidence: 0.98, source: "contact" },
    candidates: undefined,
    recipientQuery: undefined,
    forSelf: false,
  };
  return advance({ ...state, draft: next }, ctx);
}

function handleUtterance(state: DialogueState, text: string, ctx: AgentContext): StepResult {
  const p = parseUtterance(text, { expecting: state.expecting, preferredLang: state.lang });
  let s: DialogueState = {
    ...state,
    turns: [...state.turns, { who: "user", text }],
    pressureWords: uniq([...state.pressureWords, ...p.pressureWords]),
    distressWords: uniq([...state.distressWords, ...p.distressWords]),
  };
  // Reply in the language the person is speaking right now.
  if (p.language.confidence > 0.15) s = { ...s, lang: p.language.lang };

  const reviewing = s.phase === "readback" || s.phase === "cooling_off";

  // "No, 50" / "no, 024 412 3456" while reading back is a correction, not a cancel.
  if (p.intent === "CANCEL" && reviewing && s.draft && (p.amount || p.phone)) {
    const m = merge(s.draft, { ...p, recipientName: undefined }, ctx);
    return advance({ ...s, draft: m.draft, corrections: s.corrections + 1, riskAcknowledged: false }, ctx, m.notice);
  }

  if ((SYSTEM_INTENTS as string[]).includes(p.intent)) return handleCommand(s, p.intent as SystemIntent, p, ctx);
  if ((SUPPORT_INTENTS as string[]).includes(p.intent)) return handoff(s, p.intent as SupportIntent, text);

  if (p.intent !== "UNKNOWN") {
    const intent = p.intent as Draft["intent"];
    if (!s.draft || s.draft.intent !== intent) s = startDraft(s, intent);
    else if (reviewing) s = { ...s, corrections: s.corrections + 1, riskAcknowledged: false };
    const m = merge(s.draft!, p, ctx);
    return advance({ ...s, draft: m.draft }, ctx, m.notice);
  }

  if (!s.draft) return miss(s, ctx);

  if (s.expecting === "recipient_choice" && s.draft.candidates?.length && !p.phone) {
    const picked = chooseCandidate(text, s.draft.candidates);
    if (picked) return chooseRecipient(s, picked, ctx);
  }

  const m = merge(s.draft, p, ctx);
  if (!m.changed && !m.notice) return miss(s, ctx);
  if (reviewing) s = { ...s, corrections: s.corrections + 1, riskAcknowledged: false };
  return advance({ ...s, draft: m.draft }, ctx, m.notice);
}

export function step(state: DialogueState, event: DialogueEvent, ctx: AgentContext): StepResult {
  switch (event.type) {
    case "reset":
      return { state: initialState(ctx.preferredLang), say: null, effects: [] };
    case "start":
      return {
        state: { ...initialState(state.lang || ctx.preferredLang), phase: "listening" },
        say: null,
        effects: ["haptic:listening"],
      };
  }
  if (isTerminal(state)) return { state, say: null, effects: [] };

  switch (event.type) {
    case "utterance":
      if (!event.text.trim()) return miss(state, ctx);
      return handleUtterance(state, event.text, ctx);
    case "command":
      return handleCommand(state, event.command, null, ctx);
    case "choose_recipient":
      return state.draft ? chooseRecipient(state, event.recipient, ctx) : { state, say: null, effects: [] };
    case "set_amount":
      if (!state.draft) return { state, say: null, effects: [] };
      return advance({ ...state, draft: { ...state.draft, amount: { value: event.value, confidence: 1, source: "tap" } } }, ctx);
  }
}