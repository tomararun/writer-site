// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PortableTextBlock } from "next-sanity";
import { internalHref, PortableTextRenderer } from "@/components/content/PortableTextRenderer";

/**
 * Renders a body containing every §3.2 object the bodyText type allows, and
 * asserts each one lands in the DOM — the component half of the Phase 1 exit
 * criterion ("typed query → rendered component").
 */

function block(style: string, text: string, key: string) {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

const body = [
  block("h2", "The Measure", "b1"),
  block("h2", "The Measure", "b2"), // duplicate heading → suffixed anchor
  {
    _type: "block",
    _key: "b3",
    style: "normal",
    markDefs: [
      { _type: "externalLink", _key: "m1", href: "https://example.com", rel: "nofollow" },
      { _type: "internalLink", _key: "m2", reference: { _type: "post", slug: "other-post" } },
      { _type: "internalLink", _key: "m3", reference: null }, // deleted target
    ],
    children: [
      { _type: "span", _key: "s1", text: "Prose with ", marks: [] },
      { _type: "span", _key: "s2", text: "an external link", marks: ["m1"] },
      { _type: "span", _key: "s3", text: " and ", marks: [] },
      { _type: "span", _key: "s4", text: "an internal one", marks: ["m2"] },
      { _type: "span", _key: "s5", text: " and ", marks: [] },
      { _type: "span", _key: "s6", text: "a dead one", marks: ["m3"] },
      { _type: "footnote", _key: "f1", body: [block("normal", "The footnote text.", "fb1")] },
    ],
  },
  {
    _type: "codeBlock",
    _key: "c1",
    language: "typescript",
    filename: "a.ts",
    code: "const x = 1;",
  },
  { _type: "pullQuote", _key: "p1", text: "The lifted sentence.", emphasis: true },
  {
    _type: "calloutBox",
    _key: "cb1",
    variant: "warning",
    title: "Careful",
    body: [block("normal", "Callout body.", "cbb")],
  },
  { _type: "embed", _key: "e1", url: "https://www.youtube.com/watch?v=x", title: "A talk" },
  {
    _type: "figure",
    _key: "fig1",
    alt: "A diagram of the grid",
    caption: "The three tracks.",
    layout: "inline",
    asset: {
      url: "https://cdn.sanity.io/images/x/y/z-1200x630.svg",
      dimensions: { width: 1200, height: 630 },
    },
  },
] as unknown as PortableTextBlock[];

describe("PortableTextRenderer", () => {
  it("renders every §3.2 body object", () => {
    render(<PortableTextRenderer value={body} />);

    // Headings with de-duplicated anchors (same rule as extractHeadings).
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.id)).toEqual(["the-measure", "the-measure-2"]);

    // Marks: external link with merged rel, internal link resolved to a path,
    // dead internal link degrades to plain text.
    const external = screen.getByRole("link", { name: "an external link" });
    expect(external).toHaveProperty("href", "https://example.com/");
    expect(external.getAttribute("rel")).toContain("nofollow");
    const internal = screen.getByRole("link", { name: "an internal one" });
    expect(internal.getAttribute("href")).toBe("/writing/other-post");
    expect(screen.queryByRole("link", { name: "a dead one" })).toBeNull();
    expect(document.body.textContent).toContain("a dead one");

    // Footnote: numbered marker + body.
    expect(screen.getByText("1")).not.toBeNull();
    expect(screen.getByText("The footnote text.")).not.toBeNull();

    // Code block with filename.
    expect(screen.getByText("const x = 1;")).not.toBeNull();
    expect(screen.getByText("a.ts")).not.toBeNull();

    // Pull quote, callout (variant label + title + body), embed link card.
    expect(screen.getByText("The lifted sentence.")).not.toBeNull();
    expect(screen.getByText("Warning")).not.toBeNull();
    expect(screen.getByText("Callout body.")).not.toBeNull();
    expect(screen.getByRole("link", { name: /A talk/ })).not.toBeNull();

    // Figure: image with alt + caption.
    expect(screen.getByRole("img", { name: "A diagram of the grid" })).not.toBeNull();
    expect(screen.getByText("The three tracks.")).not.toBeNull();
  });
});

describe("internalHref", () => {
  it("maps document types to their route prefixes", () => {
    expect(internalHref({ _type: "post", slug: "a" })).toBe("/writing/a");
    expect(internalHref({ _type: "caseStudy", slug: "b" })).toBe("/case-studies/b");
    expect(internalHref({ _type: "journalEntry", slug: "c" })).toBe("/journal/c");
    expect(internalHref({ _type: "page", slug: "about" })).toBe("/about");
  });

  it("returns null for unknown types or missing slugs", () => {
    expect(internalHref({ _type: "tag", slug: "x" })).toBeNull();
    expect(internalHref({ _type: "post", slug: null })).toBeNull();
    expect(internalHref(null)).toBeNull();
  });
});
