/**
 * Per-utterance language identification. Decides which language Aya replies
 * in: the one the person mostly spoke, unless nothing marks a language, in
 * which case the user's preference wins. Code-switching is expected, so the
 * result also says whether more than one language was heard.
 */

import { EWE_LETTERS, LANGUAGE_MARKERS } from "./lexicon";
import type { Lang, LanguageGuess } from "./types";

const MARKER_SETS: Record<Lang, Set<string>> = {
  tw: new Set(LANGUAGE_MARKERS.tw),
  ee: new Set(LANGUAGE_MARKERS.ee),
  en: new Set(LANGUAGE_MARKERS.en),
};

export function identifyLanguage(tokens: string[], preferred: Lang): LanguageGuess {
  const score: Record<Lang, number> = { tw: 0, ee: 0, en: 0 };

  for (const tok of tokens) {
    if (/^\d/.test(tok)) continue;
    const hits = (Object.keys(MARKER_SETS) as Lang[]).filter((l) => MARKER_SETS[l].has(tok));
    // A word shared by two languages ("me", "na", "ma") counts half for each.
    for (const l of hits) score[l] += hits.length > 1 ? 0.5 : 1;
    if (EWE_LETTERS.test(tok)) score.ee += 1.5;
    else if (/[ɛɔ]/.test(tok) && hits.length === 0) {
      score.tw += 0.4;
      score.ee += 0.4;
    }
  }

  const ranked = (Object.keys(score) as Lang[]).sort((a, b) => score[b] - score[a]);
  const top = ranked[0];
  const topScore = score[top];
  const second = score[ranked[1]];
  const total = score.tw + score.ee + score.en;

  if (topScore === 0) return { lang: preferred, confidence: 0, mixed: false };

  const mixed = (Object.keys(score) as Lang[]).filter((l) => score[l] >= 1).length > 1;
  // Prefer the user's chosen language when the evidence is a near tie.
  const lang = topScore - second < 0.5 && score[preferred] >= second ? preferred : top;
  const confidence = Math.min(1, (topScore - second + 0.5) / (total + 0.5));
  return { lang, confidence, mixed };
}
