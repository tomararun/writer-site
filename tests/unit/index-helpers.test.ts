import { describe, expect, it } from "vitest";
import {
  parseJournalParams,
  parsePage,
  parseProjectParams,
  parseWritingParams,
  writingSummary,
} from "@/lib/index-params";
import { groupByMonth, monthLabel, yearStats } from "@/lib/journal-stats";
import { collectionPageJsonLd, personJsonLd, webSiteJsonLd } from "@/lib/jsonld";

describe("parseWritingParams", () => {
  it("restores a full filter state from the URL (shareable links)", () => {
    expect(
      parseWritingParams({
        kind: "essay",
        category: "craft",
        tag: "typography",
        sort: "oldest",
        page: "3",
      }),
    ).toEqual({ kind: "essay", category: "craft", tag: "typography", sort: "oldest", page: 3 });
  });

  it("degrades junk params to defaults instead of breaking", () => {
    expect(
      parseWritingParams({
        kind: "poetry",
        category: "NOT A SLUG!!",
        tag: undefined,
        sort: "loudest",
        page: "-4",
      }),
    ).toEqual({ kind: null, category: null, tag: null, sort: "newest", page: 1 });
  });

  it("takes the first value of repeated params", () => {
    expect(parseWritingParams({ kind: ["tutorial", "essay"] }).kind).toBe("tutorial");
  });
});

describe("parsePage", () => {
  it("clamps to sane bounds", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
    expect(parsePage("9999")).toBe(100);
    expect(parsePage(undefined)).toBe(1);
  });
});

describe("parseJournalParams / parseProjectParams", () => {
  it("accepts valid values and rejects junk", () => {
    expect(parseJournalParams({ topic: "postgres", page: "2" })).toEqual({
      topic: "postgres",
      page: 2,
    });
    expect(parseJournalParams({ topic: "Postgres!" }).topic).toBeNull();
    expect(parseProjectParams({ status: "wip" }).status).toBe("wip");
    expect(parseProjectParams({ status: "dead" }).status).toBeNull();
  });
});

describe("writingSummary", () => {
  it("builds the §6.3 active-filter summary", () => {
    expect(
      writingSummary(
        8,
        { kind: "essay", category: null, tag: "attention" },
        { tag: "Attention" },
      ),
    ).toBe("Showing 8 essays tagged “Attention”");
  });

  it("falls back to pieces without a kind filter", () => {
    expect(writingSummary(1, { kind: null, category: null, tag: null }, {})).toBe(
      "Showing 1 piece",
    );
  });
});

describe("journal-stats", () => {
  const entries = [
    {
      _id: "a",
      title: "A",
      slug: "a",
      entryDate: "2026-07-24",
      timeSpent: 90,
      topics: [{ title: "React", slug: "react" }],
    },
    {
      _id: "b",
      title: "B",
      slug: "b",
      entryDate: "2026-07-18",
      timeSpent: 120,
      topics: [
        { title: "React", slug: "react" },
        { title: "CSS", slug: "css" },
      ],
    },
    {
      _id: "c",
      title: "C",
      slug: "c",
      entryDate: "2026-06-13",
      timeSpent: 30,
      topics: [{ title: "CSS", slug: "css" }],
    },
    { _id: "d", title: "D", slug: "d", entryDate: "2025-12-31", timeSpent: 600, topics: [] },
  ];

  it("groups newest-first rows under month headings", () => {
    const groups = groupByMonth(entries);
    expect(groups.map((g) => [g.key, g.entries.length])).toEqual([
      ["2026-07", 2],
      ["2026-06", 1],
      ["2025-12", 1],
    ]);
    expect(monthLabel("2026-03")).toBe("March 2026");
  });

  it("computes the year strip for the most recent year only", () => {
    const stats = yearStats(entries);
    expect(stats).toEqual({
      year: "2026",
      entryCount: 3,
      hours: 4, // 240 minutes
      topTopics: ["CSS", "React"], // both count 2 → alphabetical tiebreak
    });
  });

  it("returns null with no dated entries", () => {
    expect(yearStats([])).toBeNull();
  });
});

describe("index JSON-LD", () => {
  it("builds CollectionPage with positioned items", () => {
    const jsonLd = collectionPageJsonLd({
      name: "Writing",
      url: "https://example.com/writing",
      items: [
        { url: "https://example.com/writing/a", name: "A" },
        { url: "https://example.com/writing/b", name: "B" },
      ],
    });
    const list = jsonLd.mainEntity as { itemListElement: { position: number }[] };
    expect(list.itemListElement.map((i) => i.position)).toEqual([1, 2]);
  });

  it("builds Person with only http sameAs and WebSite with SearchAction", () => {
    const person = personJsonLd({
      name: "Alex",
      url: "https://example.com",
      sameAs: ["https://github.com/x", null],
    });
    expect(person.sameAs).toEqual(["https://github.com/x"]);
    const site = webSiteJsonLd({ name: "Alex", url: "https://example.com" });
    expect(JSON.stringify(site)).toContain("SearchAction");
  });
});
