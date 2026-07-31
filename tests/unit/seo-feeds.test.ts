import { describe, expect, it } from "vitest";
import { buildMetadata, descriptionFor, ogImageUrl } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildJsonFeed, buildRss, escapeXml, portableTextToFeedHtml } from "@/lib/feeds";

describe("descriptionFor (§4.7 precedence)", () => {
  it("prefers seo.description, then excerpt, then truncated plainText", () => {
    expect(descriptionFor({ seoDescription: "SEO", excerpt: "EX", plainText: "PLAIN" })).toBe(
      "SEO",
    );
    expect(descriptionFor({ excerpt: "EX", plainText: "PLAIN" })).toBe("EX");
    const long = "word ".repeat(60).trim();
    const fromPlain = descriptionFor({ plainText: long })!;
    expect(fromPlain.length).toBeLessThanOrEqual(155);
    expect(fromPlain.endsWith("…")).toBe(true);
    expect(descriptionFor({})).toBeUndefined();
  });
});

describe("buildMetadata", () => {
  it("goes absolute for long titles and keeps canonicalUrl overrides", () => {
    const short = buildMetadata({ title: "Short", path: "/writing/short" });
    expect(short.title).toBe("Short");
    const long = buildMetadata({
      title: "A deliberately long title that certainly exceeds fifty-five characters",
      path: "/writing/long",
      canonicalUrl: "https://elsewhere.com/original",
    });
    expect(long.title).toEqual({
      absolute: "A deliberately long title that certainly exceeds fifty-five characters",
    });
    expect(long.alternates?.canonical).toBe("https://elsewhere.com/original");
  });

  it("carries noIndex through to robots", () => {
    const meta = buildMetadata({ title: "T", path: "/x", noIndex: true });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("builds versioned OG image URLs", () => {
    const url = ogImageUrl({ slug: "a", type: "post", updatedAt: "2026-01-01T00:00:00Z" });
    expect(url).toContain("/api/og?");
    expect(url).toContain("slug=a");
    expect(url).toContain("v=2026-01-01");
  });
});

describe("breadcrumbJsonLd", () => {
  it("positions crumbs from 1", () => {
    const jsonLd = breadcrumbJsonLd([
      { name: "Home", url: "https://x.com" },
      { name: "Writing", url: "https://x.com/writing" },
    ]);
    const items = jsonLd.itemListElement as { position: number; name: string }[];
    expect(items.map((item) => [item.position, item.name])).toEqual([
      [1, "Home"],
      [2, "Writing"],
    ]);
  });
});

describe("feeds", () => {
  const items = [
    {
      id: "1",
      title: `Ampers& <and> "quotes"`,
      url: "https://x.com/writing/a?b=1&c=2",
      date: "2026-06-14T09:00:00Z",
      summary: "A & B",
      contentHtml: "<p>Full content with ]]> inside</p>",
      tags: ["ty&po"],
    },
  ];

  it("escapes XML entities everywhere and survives ]]> in CDATA", () => {
    const xml = buildRss({
      title: "T & T",
      description: "D",
      feedPath: "/rss.xml",
      items,
    });
    expect(xml).toContain("<title>T &amp; T</title>");
    expect(xml).toContain("Ampers&amp; &lt;and&gt;");
    expect(xml).toContain("b=1&amp;c=2");
    expect(xml).toContain("<category>ty&amp;po</category>");
    expect(xml).not.toContain("with ]]> inside"); // split across CDATA sections
    expect(xml).toContain("<pubDate>Sun, 14 Jun 2026 09:00:00 GMT</pubDate>");
  });

  it("builds a valid JSON Feed 1.1 shape", () => {
    const feed = JSON.parse(
      buildJsonFeed({ title: "T", description: "D", feedPath: "/feed.json", items }),
    ) as { version: string; items: { id: string; content_html: string }[] };
    expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
    expect(feed.items[0]?.content_html).toContain("Full content");
  });

  it("renders portable text to feed HTML with absolute internal links", () => {
    const html = portableTextToFeedHtml([
      {
        _type: "block",
        _key: "b1",
        style: "normal",
        markDefs: [
          { _type: "internalLink", _key: "m1", reference: { _type: "post", slug: "other" } },
        ],
        children: [
          { _type: "span", _key: "s1", text: "See ", marks: [] },
          { _type: "span", _key: "s2", text: "this post", marks: ["m1"] },
        ],
      },
      { _type: "codeBlock", _key: "c1", code: "const a = 1 < 2;" },
    ]);
    expect(html).toContain(`href="`);
    expect(html).toContain("/writing/other");
    expect(html).toContain("&lt; 2;");
  });

  it("escapeXml covers the five entities", () => {
    expect(escapeXml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&apos;");
  });
});
