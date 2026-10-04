/**
 * Amount extraction: digits ("150", "12.50") and spoken numbers in English
 * ("one hundred and fifty"), Twi ("ɔha ne aduonum") and Ewe
 * ("alafa ɖeka kple blaatɔ̃"). Returns the value, a confidence, and the token
 * span so the words can be removed before recipient extraction.
 */

import { normalize, tokenize } from "./text";
import type { Slot } from "./types";

export type AmountMatch = Slot<number> & { start: number; end: number };

type Word = { value: number; kind: "unit" | "teen" | "ten" | "hundred" | "thousand" | "and" };

const WORDS = new Map<string, Word>();

function add(kind: Word["kind"], entries: [string, number][]) {
  for (const [w, value] of entries) WORDS.set(normalize(w), { value, kind });
}

// English
add("unit", [["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["six", 6], ["seven", 7], ["eight", 8], ["nine", 9]]);
add("teen", [
  ["ten", 10], ["eleven", 11], ["twelve", 12], ["thirteen", 13], ["fourteen", 14], ["fifteen", 15],
  ["sixteen", 16], ["seventeen", 17], ["eighteen", 18], ["nineteen", 19],
]);
add("ten", [["twenty", 20], ["thirty", 30], ["forty", 40], ["fourty", 40], ["fifty", 50], ["sixty", 60], ["seventy", 70], ["eighty", 80], ["ninety", 90]]);
add("hundred", [["hundred", 100]]);
add("thousand", [["thousand", 1000]]);
add("and", [["and", 0]]);

// Twi (Akan)
add("unit", [
  ["baako", 1], ["biako", 1], ["mmienu", 2], ["mmenu", 2], ["abien", 2], ["mmiɛnsa", 3], ["mmiensa", 3], ["abiɛsa", 3],
  ["ɛnan", 4], ["anan", 4], ["nnan", 4], ["enum", 5], ["anum", 5], ["nnum", 5], ["nsia", 6], ["asia", 6],
  ["nson", 7], ["ason", 7], ["nwɔtwe", 8], ["awɔtwe", 8], ["nkron", 9], ["akron", 9],
]);
add("teen", [
  ["edu", 10], ["du", 10], ["dubaako", 11], ["dummienu", 12], ["dummiɛnsa", 13], ["dunan", 14], ["dunum", 15],
  ["dunsia", 16], ["dunson", 17], ["dunwɔtwe", 18], ["dunkron", 19],
]);
add("ten", [
  ["aduonu", 20], ["aduasa", 30], ["aduanan", 40], ["aduonum", 50], ["aduosia", 60], ["aduɔson", 70],
  ["aduɔwɔtwe", 80], ["aduɔkron", 90],
]);
add("hundred", [["ɔha", 100], ["oha", 100], ["ɔhaa", 100]]);
// Twi has one-word hundreds; keep them as plain values.
const TWI_HUNDREDS: [string, number][] = [
  ["ahanu", 200], ["ahaanu", 200], ["ahasa", 300], ["ahaasa", 300], ["ahanan", 400], ["ahanum", 500],
  ["ahansia", 600], ["ahanson", 700], ["ahanwɔtwe", 800], ["ahankron", 900],
];
add("thousand", [["apem", 1000], ["mpem", 1000]]);
add("and", [["ne", 0]]);

// Ewe
add("unit", [
  ["ɖeka", 1], ["ɖekɛ", 1], ["eve", 2], ["etɔ̃", 3], ["etɔ", 3], ["ene", 4], ["atɔ̃", 5], ["atɔ", 5], ["ade", 6],
  ["adre", 7], ["enyi", 8], ["asieke", 9], ["asiekɛ", 9],
]);
add("teen", [
  ["ewo", 10], ["wuiɖekɛ", 11], ["wuiɖeka", 11], ["wuieve", 12], ["wuietɔ̃", 13], ["wuiene", 14], ["wuiatɔ̃", 15],
  ["wuiade", 16], ["wuiadre", 17], ["wuienyi", 18], ["wuiasieke", 19],
]);
add("ten", [
  ["blaeve", 20], ["blaetɔ̃", 30], ["blaene", 40], ["blaatɔ̃", 50], ["blaade", 60], ["blaadre", 70],
  ["blaenyi", 80], ["blaasieke", 90],
]);
add("hundred", [["alafa", 100]]);
add("thousand", [["akpe", 1000]]);
add("and", [["kple", 0], ["vɔ", 0]]);

const FIXED = new Map<string, number>(TWI_HUNDREDS.map(([w, v]) => [normalize(w), v]));

/** Twi and Ewe put the multiplier after the big word: "alafa eve" = 200, "mpem mmienu" = 2000. */
const POSTFIX_MULTIPLIER_LANG_WORDS = new Set(["alafa", "akpe", "ɔha", "oha", "ɔhaa", "apem", "mpem"].map(normalize));

const PESEWA_WORDS = new Set(["pesewas", "pesewa", "pɛsewa", "pesewa"].map(normalize));
const CEDI_WORDS = new Set(["cedis", "cedi", "sidi", "sika", "ga"].map(normalize));

function isNumberWord(token: string): boolean {
  return WORDS.has(token) || FIXED.has(token);
}

/** Evaluate a run of number words into a value. Returns null if the run is not a number. */
function evaluate(tokens: string[]): { value: number; ambiguous: boolean } | null {
  let total = 0;
  let current = 0;
  let sawValue = false;
  let ambiguous = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const fixed = FIXED.get(tok);
    if (fixed !== undefined) {
      current += fixed;
      sawValue = true;
      continue;
    }
    const w = WORDS.get(tok);
    if (!w) return null;
    switch (w.kind) {
      case "and":
        break;
      case "unit":
      case "teen": {
        const prev = i > 0 ? tokens[i - 1] : "";
        if (POSTFIX_MULTIPLIER_LANG_WORDS.has(prev)) {
          // "alafa eve" (100 x 2): the big word already added 100 once; replace with the product.
          const big = WORDS.get(prev)!.value;
          current = current - big + big * w.value;
          break;
        }
        // "one fifty" -> 150
        const next = i + 1 < tokens.length ? WORDS.get(tokens[i + 1]) : undefined;
        if (w.kind === "unit" && next?.kind === "ten" && current === 0 && total === 0) {
          current = w.value * 100;
          ambiguous = true;
          break;
        }
        current += w.value;
        sawValue = true;
        break;
      }
      case "ten":
        current += w.value;
        sawValue = true;
        break;
      case "hundred":
        current = (current || 1) * 100;
        sawValue = true;
        break;
      case "thousand":
        total += (current || 1) * 1000;
        current = 0;
        sawValue = true;
        break;
    }
  }
  if (!sawValue) return null;
  return { value: total + current, ambiguous };
}

/** Find the most plausible money amount in normalised text. */
export function findAmount(normalized: string): AmountMatch | null {
  const tokens = tokenize(normalized);
  let best: AmountMatch | null = null;

  const consider = (m: AmountMatch) => {
    if (!best || m.confidence > best.confidence || (m.confidence === best.confidence && m.value > best.value)) best = m;
  };

  // Digits, e.g. "150", "12.50", "1500".
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!/^\d+(\.\d{1,2})?$/.test(tok)) continue;
    // "024" or a 9+ digit run is part of a phone number, not money.
    if (/^0\d/.test(tok) || /^\d{9,}$/.test(tok)) continue;
    const value = Number(tok);
    if (!Number.isFinite(value) || value <= 0) continue;
    let end = i + 1;
    let confidence = 0.9;
    const prev = tokens[i - 1] ?? "";
    const next = tokens[i + 1] ?? "";
    if (CEDI_WORDS.has(prev) || CEDI_WORDS.has(next)) {
      confidence = 0.98;
      if (CEDI_WORDS.has(next)) end = i + 2;
    }
    // "12 cedis 50 pesewas"
    if (/^\d{1,2}$/.test(tokens[end] ?? "") && PESEWA_WORDS.has(tokens[end + 1] ?? "")) {
      consider({ value: value + Number(tokens[end]) / 100, confidence: 0.98, source: "digits", start: i, end: end + 2 });
      continue;
    }
    consider({ value, confidence, source: "digits", start: i, end });
  }

  if (best) return best;

  // Spoken numbers: longest run of number words.
  for (let i = 0; i < tokens.length; i++) {
    if (!isNumberWord(tokens[i]) || WORDS.get(tokens[i])?.kind === "and") continue;
    let j = i;
    while (j < tokens.length && isNumberWord(tokens[j])) j++;
    // Trim a trailing "and".
    while (j > i && WORDS.get(tokens[j - 1])?.kind === "and") j--;
    const result = evaluate(tokens.slice(i, j));
    if (result && result.value > 0) {
      const next = tokens[j] ?? "";
      const prev = tokens[i - 1] ?? "";
      const nearMoney = CEDI_WORDS.has(next) || CEDI_WORDS.has(prev);
      // Spoken numbers are less certain than digits; "one fifty" style shortcuts least of all.
      const confidence = result.ambiguous ? 0.7 : nearMoney ? 0.88 : 0.78;
      consider({
        value: result.value,
        confidence,
        source: "words",
        start: i,
        end: nearMoney && CEDI_WORDS.has(next) ? j + 1 : j,
      });
    }
    i = j;
  }

  return best;
}

/** Remove an amount span (and any attached currency word) from the token list. */
export function withoutSpan(tokens: string[], span: { start: number; end: number } | null): string[] {
  if (!span) return tokens;
  return [...tokens.slice(0, span.start), ...tokens.slice(span.end)];
}

/** Is the whole utterance just a number (an answer to "how much?")? */
export function parseBareAmount(text: string): Slot<number> | null {
  const normalized = normalize(text);
  const m = findAmount(normalized);
  if (!m) return null;
  const tokens = tokenize(normalized);
  const leftovers = withoutSpan(tokens, m).filter((t) => !CEDI_WORDS.has(t) && !PESEWA_WORDS.has(t));
  // A short answer like "fifty cedis" or "it's 50" is a bare amount; a full sentence is not.
  if (leftovers.length > 3) return null;
  return { value: m.value, confidence: Math.min(0.98, m.confidence + 0.05), source: m.source };
}
