/**
 * SPEC P2 / §6.4 — related content scoring.
 *
 * Shared tag: 3 points each · same series: 5 · same category: 1 · recency
 * breaks ties. Returns `limit` items, excludes the source itself, and defers
 * entirely to a manual selection when one exists.
 *
 * Pure function over lean projections — no client, no fetch — so it's unit
 * testable and reusable by the archive and journal (Phase 3+).
 */

export type RelatedSource = {
  _id: string;
  tagIds?: readonly string[] | null;
  categoryId?: string | null;
  seriesId?: string | null;
};

export type RelatedCandidate = RelatedSource & {
  publishedAt?: string | null;
};

const POINTS = { sharedTag: 3, sameSeries: 5, sameCategory: 1 } as const;

export function scoreCandidate(source: RelatedSource, candidate: RelatedCandidate): number {
  let score = 0;

  const sourceTags = new Set(source.tagIds ?? []);
  for (const tagId of candidate.tagIds ?? []) {
    if (sourceTags.has(tagId)) score += POINTS.sharedTag;
  }

  if (source.seriesId && candidate.seriesId === source.seriesId) {
    score += POINTS.sameSeries;
  }

  if (source.categoryId && candidate.categoryId === source.categoryId) {
    score += POINTS.sameCategory;
  }

  return score;
}

export function relatedContent<T extends RelatedCandidate>(
  source: RelatedSource,
  candidates: readonly T[],
  options: { limit?: number; manual?: readonly T[] | null } = {},
): T[] {
  const { limit = 3, manual } = options;

  // §3.3 — relatedManual "overrides the algorithm when set".
  if (manual && manual.length > 0) {
    return manual.filter((item) => item._id !== source._id).slice(0, limit);
  }

  return candidates
    .filter((candidate) => candidate._id !== source._id)
    .map((candidate) => ({ candidate, score: scoreCandidate(source, candidate) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        // Recency tiebreak: ISO datetimes compare correctly as strings.
        (b.candidate.publishedAt ?? "").localeCompare(a.candidate.publishedAt ?? ""),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
