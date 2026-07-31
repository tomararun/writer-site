import { describe, expect, it } from "vitest";
import { isIndexable, pathsFor, tagsFor } from "@/lib/revalidate-paths";
import { toSearchDocument } from "@/lib/search-index";
import {
  EMPTY_FILTERS,
  facetCounts,
  filterArchive,
  groupItemsByYear,
  parseArchiveFilters,
  serializeArchiveFilters,
  toArchiveItems,
  type ArchiveItem,
} from "@/lib/archive-filter";

describe("pathsFor / tagsFor (§5.4)", () => {
  it("covers a post's page, indexes, home, archive and taxonomy facets", () => {
    const paths = pathsFor({
      _id: "a",
      _type: "post",
      slug: "the-66-character-rule",
      tags: ["typography", "design-systems"],
      category: "attention",
      series: "typography-for-developers",
    });
    expect(paths).toEqual(
      expect.arrayContaining([
        "/writing/the-66-character-rule",
        "/writing",
        "/",
        "/archive",
        "/writing/tag/typography",
        "/writing/tag/design-systems",
        "/writing/category/attention",
        "/writing/series/typography-for-developers",
      ]),
    );
  });

  it("routes journal entries to their topic facets", () => {
    const paths = pathsFor({
      _id: "b",
      _type: "journalEntry",
      slug: "2026-07-24-x",
      tags: ["react"],
    });
    expect(paths).toEqual(
      expect.arrayContaining(["/journal/2026-07-24-x", "/journal", "/journal/topic/react"]),
    );
  });

  it("emits type, slug and taxonomy cache tags", () => {
    const tags = tagsFor({
      _id: "a",
      _type: "post",
      slug: "x",
      tags: ["react"],
      category: "craft",
    });
    expect(tags).toEqual(
      expect.arrayContaining(["post", "post:x", "tag:react", "category:craft"]),
    );
  });

  it("knows which types are indexable", () => {
    expect(isIndexable("post")).toBe(true);
    expect(isIndexable("siteSettings")).toBe(false);
  });
});

describe("toSearchDocument", () => {
  it("maps a post payload to a search row", () => {
    const row = toSearchDocument({
      _id: "p1",
      _type: "post",
      kind: "essay",
      slug: "attention-is-a-budget",
      title: "Attention is a budget",
      excerpt: "Every element withdraws.",
      plainText: "Every element on a page withdraws from the same account.",
      tagTitles: ["Writing", "Performance"],
      category: "Attention",
      publishedAt: "2026-05-02T09:00:00Z",
      readingTime: 4,
    });
    expect(row).toMatchObject({
      id: "p1",
      path: "/writing/attention-is-a-budget",
      tagsText: "Writing Performance",
      year: 2026,
    });
  });

  it("gives untitled journal entries a dated title and uses the reflection as excerpt", () => {
    const row = toSearchDocument({
      _id: "j1",
      _type: "journalEntry",
      slug: "2026-07-24-grid",
      entryDate: "2026-07-24",
      reflection: "Accessibility work is information architecture.",
    });
    expect(row?.title).toBe("Journal, 2026-07-24");
    expect(row?.excerpt).toContain("information architecture");
    expect(row?.year).toBe(2026);
  });

  it("returns null without a slug or usable title", () => {
    expect(toSearchDocument({ _id: "x", _type: "post", title: "T" })).toBeNull();
    expect(toSearchDocument({ _id: "x", _type: "unknown", slug: "s", title: "T" })).toBeNull();
  });
});

describe("archive filtering (§6.10)", () => {
  const items: ArchiveItem[] = toArchiveItems([
    {
      _id: "1",
      _type: "post",
      title: "A",
      slug: "a",
      date: "2026-06-14",
      kind: "essay",
      category: "attention",
      tags: ["typography"],
      readingTime: 7,
    },
    {
      _id: "2",
      _type: "post",
      title: "B",
      slug: "b",
      date: "2025-03-01",
      kind: "tutorial",
      category: "systems",
      tags: ["typescript"],
      readingTime: 9,
    },
    {
      _id: "3",
      _type: "journalEntry",
      title: null,
      slug: "2026-07-24-x",
      date: "2026-07-24",
      kind: null,
      category: null,
      tags: ["react"],
      readingTime: 1,
    },
    {
      _id: "4",
      _type: "caseStudy",
      title: "C",
      slug: "c",
      date: "2026-07-20",
      kind: null,
      category: null,
      tags: ["design-systems"],
      readingTime: 8,
    },
  ]);

  it("combines groups with AND and options with OR", () => {
    const byType = filterArchive(items, { ...EMPTY_FILTERS, types: ["post"] });
    expect(byType.map((i) => i.id)).toEqual(["1", "2"]);

    const combined = filterArchive(items, {
      ...EMPTY_FILTERS,
      types: ["post", "journalEntry"],
      years: ["2026"],
    });
    expect(combined.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("searches titles and taxonomy text", () => {
    expect(filterArchive(items, { ...EMPTY_FILTERS, q: "typescript" })).toHaveLength(1);
    expect(filterArchive(items, { ...EMPTY_FILTERS, q: "zzz" })).toHaveLength(0);
  });

  it("computes facet counts against the OTHER groups' selection", () => {
    const counts = facetCounts(items, { ...EMPTY_FILTERS, types: ["post"] });
    // Year counts respect the type filter…
    expect(counts.years.get("2026")).toBe(1);
    expect(counts.years.get("2025")).toBe(1);
    // …but type counts ignore it, so the other checkboxes stay honest.
    expect(counts.types.get("journalEntry")).toBe(1);
    expect(counts.types.get("caseStudy")).toBe(1);
  });

  it("groups by year and titles untitled journal rows by date", () => {
    const groups = groupItemsByYear(filterArchive(items, EMPTY_FILTERS));
    expect(groups.map((g) => g.year)).toEqual(["2026", "2025"]);
    expect(items.find((i) => i.id === "3")?.title).toBe("Journal, 2026-07-24");
  });

  it("round-trips filter state through the URL", () => {
    const filters = {
      q: "grid",
      types: ["post", "journalEntry"],
      categories: [],
      tags: ["react"],
      years: ["2026"],
    };
    const parsed = parseArchiveFilters(`?${serializeArchiveFilters(filters)}`);
    expect(parsed).toEqual(filters);
  });

  it("drops junk values while parsing", () => {
    const parsed = parseArchiveFilters("?types=post,<script>&years=20x6");
    expect(parsed.types).toEqual(["post"]);
    expect(parsed.years).toEqual([]);
  });
});
