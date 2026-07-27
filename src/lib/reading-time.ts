/**
 * SPEC §3.5 — "readingTime — words / 220, rounded up, minimum 1."
 *
 * Lives here rather than in the CMS action so it can be unit tested (§5.9) and
 * reused by the Sanity document action in Phase 1. Pure function, no imports.
 */
export const WORDS_PER_MINUTE = 220;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/u).length;
}

export function readingTime(text: string, wordsPerMinute = WORDS_PER_MINUTE): number {
  if (wordsPerMinute <= 0) throw new RangeError("wordsPerMinute must be positive");
  return Math.max(1, Math.ceil(countWords(text) / wordsPerMinute));
}

/** §6.4 meta line: "ESSAY · 12 MIN · 4 MARCH 2026" */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min`;
}
