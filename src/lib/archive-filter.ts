/**
 * SPEC §6.10 — the archive's client-side filter model, pure and tested.
 * Groups combine with AND; options within a group with OR. Facet counts for
 * each group are computed against the selection in the OTHER groups, so a
 * checkbox always tells the truth about what ticking it would show.
 */

export type ArchiveItem = {
  id: string;
  /** post | caseStudy | journalEntry */
  type: string;
  title: string;
  path: string;
  /** ISO date — entryDate for journal, publishedAt otherwise. */
  date: string | null;
  kind: string | null;
  category: string | null;
  tags: string[];
  readingTime: number | null;
};

/** The lean rows from archiveIndexQuery, mapped once for both archive pages. */
export function toArchiveItems(
  rows: {
    _id: string;
    _type: string;
    title: string | null;
    slug: string | null;
    date: string | null;
    kind: string | null;
    category: string | null;
    tags: (string | null)[] | null;
    readingTime: number | null;
  }[],
): ArchiveItem[] {
  const pathFor: Record<string, (slug: string) => string> = {
    post: (slug) => `/writing/${slug}`,
    caseStudy: (slug) => `/case-studies/${slug}`,
    journalEntry: (slug) => `/journal/${slug}`,
  };
  return rows.flatMap((row) => {
    const toPath = pathFor[row._type];
    if (!toPath || !row.slug) return [];
    return [
      {
        id: row._id,
        type: row._type,
        title: row.title ?? (row.date ? `Journal, ${row.date.slice(0, 10)}` : "Untitled"),
        path: toPath(row.slug),
        date: row.date,
        kind: row.kind,
        category: row.category,
        tags: (row.tags ?? []).filter((tag): tag is string => Boolean(tag)),
        readingTime: row.readingTime,
      },
    ];
  });
}

export type ArchiveFilters = {
  q: string;
  types: string[];
  categories: string[];
  tags: string[];
  years: string[];
};

export const EMPTY_FILTERS: ArchiveFilters = {
  q: "",
  types: [],
  categories: [],
  tags: [],
  years: [],
};

export function yearOf(item: ArchiveItem): string | null {
  return item.date?.slice(0, 4) ?? null;
}

function matchesGroup(values: string[], value: string | null): boolean {
  if (values.length === 0) return true;
  return value !== null && values.includes(value);
}

function matchesTags(selected: string[], tags: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((tag) => tags.includes(tag));
}

function matchesQuery(q: string, item: ArchiveItem): boolean {
  if (!q.trim()) return true;
  const haystack = [item.title, item.category ?? "", item.kind ?? "", ...item.tags]
    .join(" ")
    .toLowerCase();
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function filterArchive(items: ArchiveItem[], filters: ArchiveFilters): ArchiveItem[] {
  return items.filter(
    (item) =>
      matchesQuery(filters.q, item) &&
      matchesGroup(filters.types, item.type) &&
      matchesGroup(filters.categories, item.category) &&
      matchesTags(filters.tags, item.tags) &&
      matchesGroup(filters.years, yearOf(item)),
  );
}

export type FacetCounts = {
  types: Map<string, number>;
  categories: Map<string, number>;
  tags: Map<string, number>;
  years: Map<string, number>;
};

/** Counts per option, each group computed with the OTHER groups applied. */
export function facetCounts(items: ArchiveItem[], filters: ArchiveFilters): FacetCounts {
  const without = (group: keyof ArchiveFilters): ArchiveFilters => ({
    ...filters,
    [group]: group === "q" ? "" : [],
  });

  const count = (pool: ArchiveItem[], pick: (item: ArchiveItem) => (string | null)[]) => {
    const map = new Map<string, number>();
    for (const item of pool) {
      for (const value of pick(item)) {
        if (!value) continue;
        map.set(value, (map.get(value) ?? 0) + 1);
      }
    }
    return map;
  };

  return {
    types: count(filterArchive(items, without("types")), (item) => [item.type]),
    categories: count(filterArchive(items, without("categories")), (item) => [item.category]),
    tags: count(filterArchive(items, without("tags")), (item) => item.tags),
    years: count(filterArchive(items, without("years")), (item) => [yearOf(item)]),
  };
}

/** Newest year first, newest item first within each year — regardless of input order. */
export function groupItemsByYear(
  items: ArchiveItem[],
): { year: string; items: ArchiveItem[] }[] {
  const byYear = new Map<string, ArchiveItem[]>();
  for (const item of items) {
    const year = yearOf(item) ?? "Undated";
    const group = byYear.get(year);
    if (group) {
      group.push(item);
    } else {
      byYear.set(year, [item]);
    }
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, groupItems]) => ({
      year,
      items: groupItems.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    }));
}

/* ── URL state ────────────────────────────────────────────────────────── */

const LIST_KEYS = ["types", "categories", "tags", "years"] as const;

export function parseArchiveFilters(search: string): ArchiveFilters {
  const params = new URLSearchParams(search);
  const list = (key: string, pattern: RegExp) =>
    (params.get(key) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => pattern.test(value));
  const slug = /^[a-zA-Z0-9-]{1,60}$/;
  return {
    q: (params.get("q") ?? "").slice(0, 120),
    types: list("types", slug),
    categories: list("categories", slug),
    tags: list("tags", slug),
    years: list("years", /^\d{4}$/),
  };
}

export function serializeArchiveFilters(filters: ArchiveFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  for (const key of LIST_KEYS) {
    if (filters[key].length > 0) params.set(key, filters[key].join(","));
  }
  return params.toString();
}

export function activeFilterCount(filters: ArchiveFilters): number {
  return (
    LIST_KEYS.reduce((sum, key) => sum + filters[key].length, 0) + (filters.q.trim() ? 1 : 0)
  );
}
