import { describe, expect, it } from "vitest";
import { relatedContent, scoreCandidate, type RelatedCandidate } from "@/lib/related";

const source = {
  _id: "source",
  tagIds: ["t1", "t2"],
  categoryId: "c1",
  seriesId: "s1",
};

function candidate(overrides: Partial<RelatedCandidate> & { _id: string }): RelatedCandidate {
  return { tagIds: [], categoryId: null, seriesId: null, publishedAt: null, ...overrides };
}

describe("scoreCandidate", () => {
  it("scores 3 points per shared tag", () => {
    expect(scoreCandidate(source, candidate({ _id: "a", tagIds: ["t1"] }))).toBe(3);
    expect(scoreCandidate(source, candidate({ _id: "b", tagIds: ["t1", "t2"] }))).toBe(6);
  });

  it("scores 5 for the same series and 1 for the same category", () => {
    expect(scoreCandidate(source, candidate({ _id: "a", seriesId: "s1" }))).toBe(5);
    expect(scoreCandidate(source, candidate({ _id: "b", categoryId: "c1" }))).toBe(1);
  });

  it("accumulates: 2 shared tags + series + category = 12", () => {
    const full = candidate({
      _id: "a",
      tagIds: ["t1", "t2"],
      seriesId: "s1",
      categoryId: "c1",
    });
    expect(scoreCandidate(source, full)).toBe(12);
  });

  it("does not credit unrelated tags, series or categories", () => {
    const other = candidate({ _id: "a", tagIds: ["t9"], seriesId: "s9", categoryId: "c9" });
    expect(scoreCandidate(source, other)).toBe(0);
  });
});

describe("relatedContent", () => {
  it("returns at most 3 by default, best score first", () => {
    const candidates = [
      candidate({ _id: "series-mate", seriesId: "s1" }), // 5
      candidate({ _id: "one-tag", tagIds: ["t1"] }), // 3
      candidate({ _id: "two-tags", tagIds: ["t1", "t2"] }), // 6
      candidate({ _id: "category-only", categoryId: "c1" }), // 1
    ];
    const result = relatedContent(source, candidates);
    expect(result.map((r) => r._id)).toEqual(["two-tags", "series-mate", "one-tag"]);
  });

  it("excludes the source document and zero-score candidates", () => {
    const candidates = [
      candidate({ _id: "source", tagIds: ["t1", "t2"] }),
      candidate({ _id: "stranger" }),
    ];
    expect(relatedContent(source, candidates)).toEqual([]);
  });

  it("breaks score ties by recency", () => {
    const older = candidate({
      _id: "older",
      tagIds: ["t1"],
      publishedAt: "2025-01-01T00:00:00Z",
    });
    const newer = candidate({
      _id: "newer",
      tagIds: ["t1"],
      publishedAt: "2026-01-01T00:00:00Z",
    });
    const result = relatedContent(source, [older, newer]);
    expect(result.map((r) => r._id)).toEqual(["newer", "older"]);
  });

  it("prefers the manual list when set, still excluding self", () => {
    const manual = [candidate({ _id: "source" }), candidate({ _id: "hand-picked" })];
    const algorithmic = [candidate({ _id: "two-tags", tagIds: ["t1", "t2"] })];
    const result = relatedContent(source, algorithmic, { manual });
    expect(result.map((r) => r._id)).toEqual(["hand-picked"]);
  });

  it("falls back to the algorithm when the manual list is empty", () => {
    const algorithmic = [candidate({ _id: "two-tags", tagIds: ["t1", "t2"] })];
    expect(relatedContent(source, algorithmic, { manual: [] })).toHaveLength(1);
  });
});
