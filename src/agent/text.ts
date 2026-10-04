/**
 * Text normalisation shared by every part of the engine, so lexicons, user
 * speech, and contact names are all compared in the same shape.
 */

const CURRENCY_MARKERS = /(gh\s*[₵¢]|gh[sc]\b|ghana\s+cedis?|[₵¢])/giu;

/**
 * Lowercase, strip tone marks (ɛ́ -> ɛ), unify look-alike letters used for Twi
 * and Ewe, turn currency symbols into the word "cedis", and drop punctuation.
 */
export function normalize(text: string): string {
  let t = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").toLowerCase();
  t = t.replace(/ε/g, "ɛ").replace(/ↄ/g, "ɔ").replace(/ʋ/g, "v").replace(/ƒ/g, "f");
  t = t.replace(CURRENCY_MARKERS, " cedis ");
  t = t.replace(/(\d)[,](\d{3})\b/g, "$1$2"); // 1,500 -> 1500
  t = t.replace(/(\d)[,](\d{1,2})\b/g, "$1.$2"); // 12,50 -> 12.50
  // Keep letters (incl. ɛ ɔ ɖ ŋ ɣ), digits, spaces, and decimal points only inside numbers.
  t = t.replace(/[^\p{L}\p{N}\s.]/gu, " ");
  t = t.replace(/(\d)\.(\d)/g, "$1\u0000$2").replace(/\./g, " ").replace(/\u0000/g, ".");
  return t.replace(/\s+/g, " ").trim();
}

export function tokenize(normalized: string): string[] {
  return normalized ? normalized.split(" ").filter(Boolean) : [];
}

/** Sørensen–Dice similarity on character bigrams; forgiving of ASR spelling drift. */
export function similarity(a: string, b: string): number {
  const x = normalize(a).replace(/\s+/g, "");
  const y = normalize(b).replace(/\s+/g, "");
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return x[0] === y[0] ? 0.5 : 0;
  const grams = (s: string) => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const ga = grams(x);
  const gb = grams(y);
  let shared = 0;
  for (const [g, n] of ga) shared += Math.min(n, gb.get(g) ?? 0);
  return (2 * shared) / (x.length - 1 + (y.length - 1));
}

/** True when `phrase` (one or more words) appears as whole words inside `tokens`. */
export function hasPhrase(tokens: string[], phrase: string): boolean {
  const p = tokenize(normalize(phrase));
  if (p.length === 0) return false;
  outer: for (let i = 0; i + p.length <= tokens.length; i++) {
    for (let j = 0; j < p.length; j++) if (tokens[i + j] !== p[j]) continue outer;
    return true;
  }
  return false;
}

/** Index of the first token of `phrase` in `tokens`, or -1. */
export function indexOfPhrase(tokens: string[], phrase: string): number {
  const p = tokenize(normalize(phrase));
  if (p.length === 0) return -1;
  outer: for (let i = 0; i + p.length <= tokens.length; i++) {
    for (let j = 0; j < p.length; j++) if (tokens[i + j] !== p[j]) continue outer;
    return i;
  }
  return -1;
}

export function titleCase(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** "0244123456" -> "34 56": the last four digits in pairs, the way Aya speaks numbers. */
export function lastFourSpoken(phone: string): string {
  const last = phone.replace(/\D/g, "").slice(-4);
  return `${last.slice(0, 2)} ${last.slice(2)}`.trim();
}
