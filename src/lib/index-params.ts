/**
 * SPEC P4 — "Filters are URL state (searchParams), not component state."
 * One parser per index so a shared URL always restores the exact same view,
 * and junk params degrade to defaults instead of breaking the page.
 */

export const POST_KINDS = ["essay", "tutorial", "reflection", "opinion"] as const;
export const POST_SORTS = ["newest", "oldest", "longest"] as const;
export const PROJECT_STATUSES = ["live", "wip", "archived"] as const;

export type PostSort = (typeof POST_SORTS)[number];

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** A slug-ish param: lowercase letters, digits, hyphens. Anything else → null. */
function slugParam(value: string | undefined): string | null {
  if (!value || !/^[a-z0-9-]{1,96}$/.test(value)) return null;
  return value;
}

export function parsePage(value: string | string[] | undefined): number {
  const n = Number(first(value));
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, 100);
}

export type WritingParams = {
  kind: (typeof POST_KINDS)[number] | null;
  category: string | null;
  tag: string | null;
  sort: PostSort;
  page: number;
};

export function parseWritingParams(params: SearchParams): WritingParams {
  return {
    kind: oneOf(first(params.kind), POST_KINDS),
    category: slugParam(first(params.category)),
    tag: slugParam(first(params.tag)),
    sort: oneOf(first(params.sort), POST_SORTS) ?? "newest",
    page: parsePage(params.page),
  };
}

export function parseJournalParams(params: SearchParams): {
  topic: string | null;
  page: number;
} {
  return { topic: slugParam(first(params.topic)), page: parsePage(params.page) };
}

export function parseProjectParams(params: SearchParams): {
  status: (typeof PROJECT_STATUSES)[number] | null;
} {
  return { status: oneOf(first(params.status), PROJECT_STATUSES) };
}

/** §6.3 — "Showing 8 essays tagged 'attention'". */
export function writingSummary(
  total: number,
  filters: Pick<WritingParams, "kind" | "category" | "tag">,
  labels: { category?: string | null; tag?: string | null },
): string {
  const kindLabel = filters.kind
    ? {
        essay: "essays",
        tutorial: "tutorials",
        reflection: "reflections",
        opinion: "opinions",
      }[filters.kind]
    : total === 1
      ? "piece"
      : "pieces";
  const parts = [`Showing ${total} ${kindLabel}`];
  if (filters.category && labels.category) parts.push(`in ${labels.category}`);
  if (filters.tag && labels.tag) parts.push(`tagged “${labels.tag}”`);
  return parts.join(" ");
}
