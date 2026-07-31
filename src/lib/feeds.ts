import { toHTML, type PortableTextHtmlComponents } from "@portabletext/to-html";
import { site } from "@/site.config";

/**
 * SPEC §4.7 — the four feeds share one item shape and two serialisers
 * (RSS 2.0 and JSON Feed 1.1). Writing feeds carry FULL content — "it
 * builds trust and readers come back anyway" — rendered to plain HTML with
 * absolute URLs.
 */

export type FeedItem = {
  id: string;
  title: string;
  url: string;
  date: string;
  updated?: string | null;
  summary?: string | null;
  contentHtml?: string | null;
  author?: string | null;
  tags?: (string | null)[] | null;
};

export function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** CDATA-safe: a literal "]]>" in content would end the section early. */
function cdata(html: string): string {
  return `<![CDATA[${html.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
}

const PATH_BY_TYPE: Record<string, string> = {
  post: "/writing",
  caseStudy: "/case-studies",
  journalEntry: "/journal",
  project: "/projects",
  page: "",
};

/** Feed-grade HTML from a Portable Text body: simple tags, absolute URLs. */
const components: Partial<PortableTextHtmlComponents> = {
  types: {
    figure: ({ value }) => {
      const v = value as { asset?: { url?: string }; alt?: string; caption?: string };
      if (!v.asset?.url) return "";
      const img = `<img src="${escapeXml(v.asset.url)}" alt="${escapeXml(v.alt ?? "")}" />`;
      return v.caption
        ? `<figure>${img}<figcaption>${escapeXml(v.caption)}</figcaption></figure>`
        : `<figure>${img}</figure>`;
    },
    codeBlock: ({ value }) => {
      const v = value as { code?: string };
      return v.code ? `<pre><code>${escapeXml(v.code)}</code></pre>` : "";
    },
    pullQuote: ({ value }) => {
      const v = value as { text?: string; attribution?: string };
      if (!v.text) return "";
      return `<blockquote><p>${escapeXml(v.text)}</p>${
        v.attribution ? `<cite>${escapeXml(v.attribution)}</cite>` : ""
      }</blockquote>`;
    },
    calloutBox: ({ value }) => {
      const v = value as { title?: string; body?: unknown };
      const inner = Array.isArray(v.body) ? toHTML(v.body, { components }) : "";
      return `<blockquote>${v.title ? `<p><strong>${escapeXml(v.title)}</strong></p>` : ""}${inner}</blockquote>`;
    },
    embed: ({ value }) => {
      const v = value as { url?: string; title?: string };
      if (!v.url) return "";
      return `<p><a href="${escapeXml(v.url)}">${escapeXml(v.title ?? v.url)}</a></p>`;
    },
    footnote: ({ value }) => {
      const v = value as { body?: unknown };
      const inner = Array.isArray(v.body) ? toHTML(v.body, { components }) : "";
      // Inline parenthetical — footnote layout has no meaning in a reader.
      return inner ? ` (${inner.replace(/<\/?p>/g, "")})` : "";
    },
  },
  marks: {
    externalLink: ({ children, value }) => {
      const href = (value as { href?: string } | undefined)?.href ?? "";
      return `<a href="${escapeXml(href)}">${children}</a>`;
    },
    internalLink: ({ children, value }) => {
      const ref = (value as { reference?: { _type?: string; slug?: string } } | undefined)
        ?.reference;
      if (!ref?.slug || !(ref._type && ref._type in PATH_BY_TYPE)) return String(children);
      return `<a href="${site.url}${PATH_BY_TYPE[ref._type!]}/${ref.slug}">${children}</a>`;
    },
  },
  unknownType: () => "",
  unknownMark: ({ children }) => String(children),
};

export function portableTextToFeedHtml(body: unknown): string {
  if (!Array.isArray(body)) return "";
  try {
    return toHTML(body, { components });
  } catch {
    return "";
  }
}

export function buildRss(options: {
  title: string;
  description: string;
  feedPath: string;
  items: FeedItem[];
}): string {
  const items = options.items
    .map((item) => {
      const categories = (item.tags ?? [])
        .filter(Boolean)
        .map((tag) => `      <category>${escapeXml(tag!)}</category>`)
        .join("\n");
      return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
${item.summary ? `      <description>${escapeXml(item.summary)}</description>\n` : ""}${
        item.contentHtml
          ? `      <content:encoded>${cdata(item.contentHtml)}</content:encoded>\n`
          : ""
      }${categories ? `${categories}\n` : ""}    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(options.title)}</title>
    <link>${escapeXml(site.url)}</link>
    <description>${escapeXml(options.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${site.url}${options.feedPath}`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

export function buildJsonFeed(options: {
  title: string;
  description: string;
  feedPath: string;
  items: FeedItem[];
}): string {
  return JSON.stringify(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: options.title,
      home_page_url: site.url,
      feed_url: `${site.url}${options.feedPath}`,
      description: options.description,
      language: "en",
      items: options.items.map((item) => ({
        id: item.url,
        url: item.url,
        title: item.title,
        date_published: new Date(item.date).toISOString(),
        ...(item.updated ? { date_modified: new Date(item.updated).toISOString() } : {}),
        ...(item.contentHtml
          ? { content_html: item.contentHtml }
          : { content_text: item.summary ?? item.title }),
        ...(item.summary ? { summary: item.summary } : {}),
        ...(item.author ? { authors: [{ name: item.author }] } : {}),
        ...(item.tags?.length ? { tags: item.tags.filter(Boolean) } : {}),
      })),
    },
    null,
    2,
  );
}
