import { describe, expect, it } from "vitest";
import { countWordsInPortableText, extractHeadings, toPlainText } from "@/lib/portable-text";
import { slugify } from "@/lib/slugify";

function block(style: string, text: string, key = text.slice(0, 8)) {
  return {
    _type: "block",
    _key: key,
    style,
    children: [{ _type: "span", text }],
  };
}

describe("slugify", () => {
  it("lowercases, strips diacritics and punctuation, hyphenates", () => {
    expect(slugify("Où est l'Été? Ich weiß!")).toBe("ou-est-lete-ich-weiss");
    expect(slugify("  Spaces   & symbols!! ")).toBe("spaces-symbols");
  });

  it("never starts or ends with a hyphen", () => {
    expect(slugify("— dashed —")).toBe("dashed");
  });
});

describe("toPlainText", () => {
  it("joins block text with blank lines", () => {
    const body = [block("normal", "First paragraph."), block("normal", "Second.")];
    expect(toPlainText(body)).toBe("First paragraph.\n\nSecond.");
  });

  it("includes reader-visible text of custom objects", () => {
    const body = [
      block("normal", "Prose."),
      { _type: "pullQuote", _key: "pq", text: "The lifted sentence." },
      { _type: "calloutBox", _key: "cb", title: "Heads up", variant: "note" },
    ];
    const text = toPlainText(body);
    expect(text).toContain("The lifted sentence.");
    expect(text).toContain("Heads up");
  });

  it("returns empty string for non-array input", () => {
    expect(toPlainText(undefined)).toBe("");
    expect(toPlainText(null)).toBe("");
  });
});

describe("countWordsInPortableText", () => {
  it("counts words across blocks", () => {
    const body = [block("normal", "one two three"), block("normal", "four five")];
    expect(countWordsInPortableText(body)).toBe(5);
  });

  it("returns 0 for an empty body", () => {
    expect(countWordsInPortableText([])).toBe(0);
  });
});

describe("extractHeadings", () => {
  it("extracts h2/h3 with levels and anchors, skipping other styles", () => {
    const body = [
      block("h2", "The Measure"),
      block("normal", "prose"),
      block("h3", "Line length"),
      block("h4", "Ignored"),
    ];
    expect(extractHeadings(body)).toEqual([
      { _key: "The Meas", level: 2, text: "The Measure", anchor: "the-measure" },
      { _key: "Line len", level: 3, text: "Line length", anchor: "line-length" },
    ]);
  });

  it("de-duplicates repeated anchors with a numeric suffix", () => {
    const body = [block("h2", "Setup", "a"), block("h2", "Setup", "b")];
    const anchors = extractHeadings(body).map((h) => h.anchor);
    expect(anchors).toEqual(["setup", "setup-2"]);
  });

  it("ignores empty headings", () => {
    expect(extractHeadings([block("h2", "   ")])).toEqual([]);
  });
});
