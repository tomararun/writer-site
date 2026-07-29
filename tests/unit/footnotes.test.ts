import { describe, expect, it } from "vitest";
import { extractFootnotes } from "@/lib/portable-text";
import { isPubliclyVisible } from "@/lib/visibility";
import { blogPostingJsonLd } from "@/lib/jsonld";
import { formatDate, formatDayMonth, isoDate } from "@/lib/format";

function paragraphWith(footnotes: { _key: string; id?: string }[], key: string) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    children: [
      { _type: "span", _key: `${key}s`, text: "Text " },
      ...footnotes.map((fn) => ({ _type: "footnote", ...fn, body: [] })),
    ],
  };
}

describe("extractFootnotes", () => {
  it("numbers footnotes in reading order across blocks", () => {
    const body = [
      paragraphWith([{ _key: "a" }], "b1"),
      paragraphWith([{ _key: "b" }, { _key: "c" }], "b2"),
    ];
    const notes = extractFootnotes(body);
    expect(notes.map((n) => [n._key, n.number])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("keeps the author-provided anchor id", () => {
    const body = [paragraphWith([{ _key: "a", id: "fn-caching" }], "b1")];
    expect(extractFootnotes(body)[0]?.id).toBe("fn-caching");
  });

  it("ignores non-block content and empty bodies", () => {
    expect(extractFootnotes([{ _type: "codeBlock", _key: "c" }])).toEqual([]);
    expect(extractFootnotes(undefined)).toEqual([]);
  });
});

describe("isPubliclyVisible", () => {
  it("shows published posts once the date has passed", () => {
    expect(isPubliclyVisible("published", "2020-01-01T00:00:00Z")).toBe(true);
  });

  it("hides scheduled, draft and in-review posts", () => {
    expect(isPubliclyVisible("published", "2999-01-01T00:00:00Z")).toBe(false);
    expect(isPubliclyVisible("published", null)).toBe(false);
    expect(isPubliclyVisible("draft", "2020-01-01T00:00:00Z")).toBe(false);
    expect(isPubliclyVisible("inReview", "2020-01-01T00:00:00Z")).toBe(false);
  });

  it("keeps archived posts online (§5.5 — better than a 404)", () => {
    expect(isPubliclyVisible("archived", null)).toBe(true);
  });
});

describe("blogPostingJsonLd", () => {
  it("builds a BlogPosting with only the provided fields", () => {
    const jsonLd = blogPostingJsonLd({
      url: "https://example.com/writing/a",
      headline: "A",
      datePublished: "2026-01-01T00:00:00Z",
      authorName: "Alex",
      wordCount: 900,
      keywords: ["typography", null],
    });
    expect(jsonLd["@type"]).toBe("BlogPosting");
    expect(jsonLd.author).toEqual({ "@type": "Person", name: "Alex" });
    expect(jsonLd.keywords).toBe("typography");
    expect(jsonLd).not.toHaveProperty("dateModified");
    expect(jsonLd).not.toHaveProperty("image");
  });
});

describe("format", () => {
  it("formats dates in the §6.4 meta-line style", () => {
    expect(formatDate("2026-03-04T09:00:00Z")).toBe("4 March 2026");
    expect(formatDayMonth("2026-03-11")).toBe("11 Mar");
    expect(isoDate("2026-03-04T09:00:00Z")).toBe("2026-03-04");
  });

  it("degrades to empty output on bad input", () => {
    expect(formatDate("not-a-date")).toBe("");
    expect(formatDate(null)).toBe("");
    expect(isoDate(null)).toBeUndefined();
  });
});
