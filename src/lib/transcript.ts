/**
 * Streaming ASR display helpers. A recogniser sends partial hypotheses that
 * may rewrite their tail, then a final that never changes. Words shown solid
 * must have stopped moving; the rest is a provisional tail.
 */

/** A word must survive this many consecutive partials before it is shown as stable. */
export const STABILITY_WINDOW = 3;

/** Longest common word prefix across the last `window` hypotheses. */
export function stableWordCount(history: string[][], window = STABILITY_WINDOW): number {
  const recent = history.slice(-window);
  if (recent.length < window) return 0;
  const [first, ...rest] = recent;
  let count = 0;
  while (count < first.length && rest.every((h) => h[count] === first[count])) count++;
  return count;
}

/**
 * Demo stand-in for a recogniser's partial stream: each longer word is first
 * heard as a fragment, then corrected, the way real partials revise their tail.
 */
export function simulatePartials(words: string[]): string[][] {
  const partials: string[][] = [];
  words.forEach((word, i) => {
    const heard = words.slice(0, i);
    if (word.length > 4) partials.push([...heard, word.slice(0, Math.ceil(word.length / 2))]);
    partials.push([...heard, word]);
  });
  return partials;
}
