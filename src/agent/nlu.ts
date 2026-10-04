/**
 * Intent engine, rules layer (architecture.md §4.2). Turns one utterance into
 * an intent plus confidence-scored slots. Pure and synchronous, so it runs on
 * the phone with no network and is easy to test.
 *
 * Order of work for each utterance:
 *   1. normalise and identify the language
 *   2. pull out a phone number, then an amount (so digits are never confused)
 *   3. short commands first (cancel must always win)
 *   4. score action intents and support intents from cue phrases
 *   5. for a transfer, find who the money is for
 */

import {
  ACTION_CUES,
  BUY_VERBS,
  DISTRESS_WORDS,
  LANGUAGE_MARKERS,
  PRESSURE_WORDS,
  PRONOUNS,
  RECIPIENT_PREPOSITIONS,
  RECIPIENT_STOP_WORDS,
  RECIPIENT_VERBS,
  SELF_WORDS,
  SUPPORT_CUES,
  SYSTEM_CUES,
  TRAILING_FILLERS,
  type Cue,
} from "./lexicon";
import { identifyLanguage } from "./language";
import { findAmount, withoutSpan } from "./numbers";
import { hasPhrase, indexOfPhrase, normalize, titleCase, tokenize } from "./text";
import type { ActionIntent, Expecting, Lang, ParsedUtterance, Slot, SupportIntent, SystemIntent } from "./types";

export type ParseOptions = { expecting: Expecting; preferredLang: Lang };

const ACTION_THRESHOLD = 2;
const SUPPORT_THRESHOLD = 3;

const DIGIT_WORDS = new Map<string, string>(
  (
    [
      ["zero", "0"], ["oh", "0"], ["o", "0"], ["one", "1"], ["two", "2"], ["three", "3"], ["four", "4"], ["five", "5"],
      ["six", "6"], ["seven", "7"], ["eight", "8"], ["nine", "9"],
    ] as [string, string][]
  ).map(([w, d]) => [normalize(w), d]),
);

const ALL_MARKERS = new Set<string>([...LANGUAGE_MARKERS.tw, ...LANGUAGE_MARKERS.ee, ...LANGUAGE_MARKERS.en]);

/** Words that are dropped before a short utterance is compared to a command. */
const ADDRESS_FILLERS = new Set(["aya", "please", "mepa", "wo", "kyɛw", "meɖe", "kuku", "oh", "eh", "ah", "um", "hmm"].map(normalize));

// ---------------------------------------------------------------------------
// Phone numbers
// ---------------------------------------------------------------------------

type PhoneMatch = { digits: string; start: number; end: number };

/** Finds a Ghana mobile number spoken as digits ("024 412 3456", "+233 24 412 3456") or digit words. */
export function findPhone(tokens: string[]): PhoneMatch | null {
  // Fold runs of digit words ("zero two four ...") into digit tokens when the run is long enough to be a number.
  const folded: { text: string; start: number; end: number }[] = [];
  for (let i = 0; i < tokens.length; ) {
    if (DIGIT_WORDS.has(tokens[i])) {
      let j = i;
      let digits = "";
      while (j < tokens.length && DIGIT_WORDS.has(tokens[j])) digits += DIGIT_WORDS.get(tokens[j++]);
      if (digits.length >= 7) {
        folded.push({ text: digits, start: i, end: j });
        i = j;
        continue;
      }
    }
    folded.push({ text: tokens[i], start: i, end: i + 1 });
    i++;
  }

  for (let i = 0; i < folded.length; i++) {
    if (!/^\+?\d+$/.test(folded[i].text)) continue;
    let j = i;
    let digits = "";
    while (j < folded.length && /^\+?\d+$/.test(folded[j].text) && digits.length < 13) {
      digits += folded[j].text.replace("+", "");
      j++;
    }
    const local = toLocalNumber(digits);
    if (local) return { digits: local, start: folded[i].start, end: folded[j - 1].end };
  }
  return null;
}

/** "233244123456" / "0244123456" / "244123456" -> "0244123456". */
export function toLocalNumber(digits: string): string | null {
  const d = digits.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) return d;
  if (d.length === 12 && d.startsWith("233")) return `0${d.slice(3)}`;
  if (d.length === 9 && /^[2-5]/.test(d)) return `0${d}`;
  return null;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreCues(tokens: string[], cueList: readonly Cue[]): number {
  let score = 0;
  for (const cue of cueList) if (hasPhrase(tokens, cue.phrase)) score += cue.weight;
  return score;
}

function matchedWords(tokens: string[], words: string[]): string[] {
  return words.filter((w) => hasPhrase(tokens, w));
}

/**
 * Commands. A command matches when the utterance is short and is (or contains)
 * the command, or when a multi-word command phrase appears anywhere.
 */
function detectSystemIntent(tokens: string[], expecting: Expecting): SystemIntent | null {
  const core = tokens.filter((t) => !ADDRESS_FILLERS.has(t));
  const confirming = expecting === "confirm" || expecting === "safety_confirm";
  // "Change the amount" only means something while a transaction is being read back;
  // at the start of a conversation "wrong person" is a support request.
  const order: SystemIntent[] = confirming
    ? ["CHANGE_AMOUNT", "CHANGE_RECIPIENT", "CANCEL", "REPEAT", "CONFIRM", "HELP"]
    : ["CANCEL", "REPEAT", "CONFIRM", "HELP"];
  for (const intent of order) {
    for (const phrase of SYSTEM_CUES[intent]) {
      const words = phrase.split(" ");
      if (words.length >= 2) {
        if (hasPhrase(core, phrase)) return intent;
        continue;
      }
      if (!core.includes(phrase)) continue;
      // A one- or two-word utterance that is the command ("cancel", "yes please").
      if (core.length <= 2) return intent;
      // A short utterance that starts with the command ("okay continue", "no wait").
      if (core.length <= 4 && core[0] === phrase) return intent;
      // Longer answers to a yes/no question still count when they start with the command word.
      if (confirming && core[0] === phrase) return intent;
      // "cancel ..." at the start of anything always wins.
      if (intent === "CANCEL" && core[0] === phrase && phrase !== "no") return intent;
    }
  }
  return null;
}

type Scored<T extends string> = { intent: T; score: number; second: number };

function best<T extends string>(scores: Record<T, number>): Scored<T> {
  const ranked = (Object.keys(scores) as T[]).sort((a, b) => scores[b] - scores[a]);
  return { intent: ranked[0], score: scores[ranked[0]], second: scores[ranked[1]] ?? 0 };
}

// ---------------------------------------------------------------------------
// Recipient extraction
// ---------------------------------------------------------------------------

function cleanName(words: string[]): string[] {
  let out = [...words];
  // Trim trailing fillers, possibly several.
  let trimmed = true;
  while (trimmed && out.length) {
    trimmed = false;
    for (const filler of TRAILING_FILLERS) {
      const f = filler.split(" ");
      if (out.length >= f.length && out.slice(-f.length).join(" ") === filler) {
        out = out.slice(0, -f.length);
        trimmed = true;
      }
    }
  }
  return out;
}

function captureAfter(tokens: string[], index: number): string[] {
  const out: string[] = [];
  for (let i = index + 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (RECIPIENT_STOP_WORDS.includes(t) || /^\d/.test(t)) break;
    out.push(t);
  }
  return cleanName(out);
}

type RecipientCapture = { name?: Slot<string>; forSelf: boolean };

function extractRecipient(tokens: string[]): RecipientCapture {
  const tryWords = (words: string[], base: number): RecipientCapture | null => {
    if (words.length === 0) return null;
    if (words.every((w) => SELF_WORDS.includes(w)) || SELF_WORDS.includes(words.join(" "))) return { forSelf: true };
    if (words.every((w) => PRONOUNS.includes(w))) return { forSelf: false };
    const alphabetic = words.every((w) => /^\p{L}+$/u.test(w));
    if (!alphabetic) return null;
    // A name made only of vocabulary words ("ma wo", "to the") is probably a misparse.
    const vocab = words.filter((w) => ALL_MARKERS.has(w)).length;
    if (vocab === words.length) return null;
    const confidence = Math.max(0.4, base - 0.15 * vocab - (words.length > 3 ? 0.2 : 0));
    return { name: { value: titleCase(words.join(" ")), confidence, source: "spoken" }, forSelf: false };
  };

  // Last preposition wins: "me pɛ sɛ me sendi ... ma Kwame".
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!RECIPIENT_PREPOSITIONS.includes(tokens[i])) continue;
    const got = tryWords(captureAfter(tokens, i), 0.85);
    if (got) return got;
  }
  // "mane Kwame sika", "pay Kofi".
  for (let i = 0; i < tokens.length; i++) {
    if (!RECIPIENT_VERBS.includes(tokens[i])) continue;
    const got = tryWords(captureAfter(tokens, i), 0.75);
    if (got) return got;
  }
  return { forSelf: false };
}

/** The whole utterance is the answer to "who?" */
function recipientFromAnswer(tokens: string[]): RecipientCapture {
  const lead = ["it's", "its", "to", "ma", "na", "send it to", "ɛyɛ", "enye", "the name is"].map(normalize);
  let words = [...tokens];
  for (const l of lead) {
    const idx = indexOfPhrase(words, l);
    if (idx === 0) words = words.slice(l.split(" ").length);
  }
  words = cleanName(words.filter((w) => !ADDRESS_FILLERS.has(w) && !RECIPIENT_STOP_WORDS.includes(w)));
  if (words.length === 0 || words.length > 4) return { forSelf: false };
  if (words.every((w) => SELF_WORDS.includes(w))) return { forSelf: true };
  if (words.every((w) => PRONOUNS.includes(w))) return { forSelf: false };
  if (!words.every((w) => /^\p{L}+$/u.test(w))) return { forSelf: false };
  return { name: { value: titleCase(words.join(" ")), confidence: 0.8, source: "spoken" }, forSelf: false };
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function parseUtterance(text: string, opts: ParseOptions): ParsedUtterance {
  const normalized = normalize(text);
  const allTokens = tokenize(normalized);
  const language = identifyLanguage(allTokens, opts.preferredLang);

  const base: ParsedUtterance = {
    text,
    normalized,
    language,
    intent: "UNKNOWN",
    confidence: 0,
    pressureWords: matchedWords(allTokens, PRESSURE_WORDS),
    distressWords: matchedWords(allTokens, DISTRESS_WORDS),
  };
  if (allTokens.length === 0) return base;

  // Phone first, then amount, so "024 412 3456" is never read as GH₵24.
  const phone = findPhone(allTokens);
  const afterPhone = withoutSpan(allTokens, phone);
  if (phone) base.phone = { value: phone.digits, confidence: 0.9, source: "digits" };

  const amount = findAmount(afterPhone.join(" "));
  const tokens = withoutSpan(afterPhone, amount);
  if (amount) base.amount = { value: amount.value, confidence: amount.confidence, source: amount.source };

  // Commands win over everything, in every state.
  const system = detectSystemIntent(allTokens, opts.expecting);
  if (system) {
    // "no, fifty" while reading back is a correction, not a cancel; the dialogue manager decides.
    return { ...base, intent: system, confidence: 0.9 };
  }

  // Action intents.
  const actionScores: Record<ActionIntent, number> = {
    TRANSFER_MONEY: scoreCues(tokens, ACTION_CUES.TRANSFER_MONEY),
    CHECK_BALANCE: scoreCues(tokens, ACTION_CUES.CHECK_BALANCE),
    BUY_AIRTIME: scoreCues(tokens, ACTION_CUES.BUY_AIRTIME),
    BUY_DATA: scoreCues(tokens, ACTION_CUES.BUY_DATA),
  };
  const buying = BUY_VERBS.some((v) => hasPhrase(tokens, v));
  if (buying) {
    if (actionScores.BUY_AIRTIME > 0) actionScores.BUY_AIRTIME += 1.5;
    if (actionScores.BUY_DATA > 0) actionScores.BUY_DATA += 1.5;
  }
  // "send 10 airtime to Kwame" is airtime for Kwame, not a transfer.
  if (Math.max(actionScores.BUY_AIRTIME, actionScores.BUY_DATA) >= 3) actionScores.TRANSFER_MONEY *= 0.3;
  if (actionScores.CHECK_BALANCE > 0 && !amount) actionScores.CHECK_BALANCE += 1;
  if (amount && actionScores.CHECK_BALANCE > 0 && actionScores.TRANSFER_MONEY > 0) actionScores.CHECK_BALANCE *= 0.5;

  const recipient = extractRecipient(tokens);
  if (amount && recipient.name && actionScores.TRANSFER_MONEY > 0) actionScores.TRANSFER_MONEY += 1.5;
  // An amount and a name with no verb at all ("50 to Kwame") still reads as a transfer.
  if (amount && recipient.name && Math.max(...Object.values(actionScores)) === 0) actionScores.TRANSFER_MONEY = ACTION_THRESHOLD;

  const action = best(actionScores);

  // Support intents.
  const supportScores: Record<SupportIntent, number> = {
    REPORT_SCAM: scoreCues(allTokens, SUPPORT_CUES.REPORT_SCAM),
    WRONG_TRANSFER: scoreCues(allTokens, SUPPORT_CUES.WRONG_TRANSFER),
    UNAUTHORISED_TRANSACTION: scoreCues(allTokens, SUPPORT_CUES.UNAUTHORISED_TRANSACTION),
    MISTAKE_CLAIM_CHECK: scoreCues(allTokens, SUPPORT_CUES.MISTAKE_CLAIM_CHECK),
    TICKET_STATUS: scoreCues(allTokens, SUPPORT_CUES.TICKET_STATUS),
    REPORT_PROBLEM: scoreCues(allTokens, SUPPORT_CUES.REPORT_PROBLEM),
    TALK_TO_PERSON: scoreCues(allTokens, SUPPORT_CUES.TALK_TO_PERSON),
  };
  // Scam words anywhere make the whole utterance a scam report.
  if (supportScores.REPORT_SCAM >= 3) supportScores.REPORT_SCAM += 2;
  const support = best(supportScores);

  if (support.score >= SUPPORT_THRESHOLD && support.score >= action.score) {
    return { ...base, intent: support.intent, confidence: Math.min(1, support.score / (support.score + support.second + 1)) };
  }

  if (action.score >= ACTION_THRESHOLD) {
    const out: ParsedUtterance = {
      ...base,
      intent: action.intent,
      confidence: Math.min(1, action.score / (action.score + action.second + 1)),
    };
    if (action.intent === "TRANSFER_MONEY" || action.intent === "BUY_AIRTIME" || action.intent === "BUY_DATA") {
      if (recipient.name) out.recipientName = recipient.name;
      out.forSelf = recipient.forSelf || (action.intent !== "TRANSFER_MONEY" && !recipient.name && !phone);
    }
    return out;
  }

  // Short answers to a clarifying question: an amount is already on `base`; a name needs capturing.
  if (opts.expecting === "recipient" || opts.expecting === "recipient_choice") {
    if (phone) return base;
    const answer = recipientFromAnswer(allTokens);
    if (answer.name) base.recipientName = answer.name;
    if (answer.forSelf) base.forSelf = true;
    return base;
  }

  return base;
}
