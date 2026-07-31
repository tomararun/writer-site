import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { publishedClient } from "@/sanity/lib/client";
import { formatDate } from "@/lib/format";
import { site } from "@/site.config";

/**
 * SPEC §4.7 — /api/og?slug=…&type=…&v=…
 * Satori (via next/og): title in Bricolage, kind + date in Plex Mono, on the
 * paper colour, with a highlighter swipe under the title. Cached immutably —
 * the `v` param carries updatedAt, so a revision mints a new URL.
 *
 * Colours are duplicated from globals.css by necessity: Satori renders off
 * the DOM, exactly like the email templates.
 */

const PAPER = "#e6e8ea";
const INK = "#0f1620";
const INK_MUTED = "#4c5764";
const HIGHLIGHT = "#ede05f";

const TYPE_LABEL: Record<string, string> = {
  post: "",
  caseStudy: "Case study",
  journalEntry: "Journal",
};

const OG_DOC_QUERY = `*[_type == $type && slug.current == $slug][0]{
  title, kind, publishedAt, entryDate,
  "date": coalesce(entryDate, publishedAt)
}`;

/** Fetch a Google-hosted TTF once per lambda instance. */
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

function loadFont(css2Family: string): Promise<ArrayBuffer | null> {
  const existing = fontCache.get(css2Family);
  if (existing) return existing;
  const loading: Promise<ArrayBuffer | null> = (async () => {
    try {
      const css = await fetch(
        `https://fonts.googleapis.com/css2?family=${css2Family}&display=swap`,
        // An old UA makes Google serve plain TTF, which Satori can read.
        { headers: { "user-agent": "Mozilla/5.0 (Windows NT 6.1; rv:10.0)" } },
      ).then((res) => res.text());
      const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
      if (!url) return null;
      return await fetch(url).then((res) => res.arrayBuffer());
    } catch {
      return null;
    }
  })();
  fontCache.set(css2Family, loading);
  return loading;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slug = params.get("slug") ?? "";
  const type = params.get("type") ?? "post";

  let title: string = site.statement;
  let meta: string = site.name;

  if (slug && /^[a-z0-9-]{1,96}$/.test(slug) && type in TYPE_LABEL) {
    try {
      const doc = await publishedClient.fetch<{
        title: string | null;
        kind: string | null;
        date: string | null;
      } | null>(OG_DOC_QUERY, { slug, type });
      if (doc) {
        title = doc.title ?? title;
        const kindLabel =
          TYPE_LABEL[type] ||
          (doc.kind ? doc.kind.charAt(0).toUpperCase() + doc.kind.slice(1) : "Essay");
        meta = [kindLabel, doc.date ? formatDate(doc.date) : null, site.name]
          .filter(Boolean)
          .join(" · ");
      }
    } catch {
      // Fall through to the site-level card.
    }
  }

  const [display, mono] = await Promise.all([
    loadFont("Bricolage+Grotesque:wght@600"),
    loadFont("IBM+Plex+Mono:wght@500"),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: PAPER,
        padding: "72px 80px",
      }}
    >
      <div
        style={{
          fontFamily: mono ? "Plex Mono" : "monospace",
          fontSize: 26,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: INK_MUTED,
        }}
      >
        {meta}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: display ? "Bricolage" : "sans-serif",
            fontSize: title.length > 70 ? 56 : 68,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.022em",
            color: INK,
            maxWidth: 980,
          }}
        >
          {title}
        </div>
        {/* The highlighter swipe — the one loud element. */}
        <div
          style={{
            marginTop: 28,
            width: 280,
            height: 18,
            backgroundColor: HIGHLIGHT,
            transform: "rotate(-1deg)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: mono ? "Plex Mono" : "monospace",
          fontSize: 24,
          color: INK_MUTED,
        }}
      >
        <span>{new URL(site.url).hostname}</span>
        <span>{site.name}</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(display ? [{ name: "Bricolage", data: display, weight: 600 as const }] : []),
        ...(mono ? [{ name: "Plex Mono", data: mono, weight: 500 as const }] : []),
      ],
      headers: {
        "cache-control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
