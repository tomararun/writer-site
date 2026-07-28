import Link from "next/link";
import { PortableText, type PortableTextComponents } from "next-sanity";
import type { PortableTextBlock } from "next-sanity";
import { slugify } from "@/lib/slugify";
import { CalloutBox, type CalloutBoxValue } from "./CalloutBox";
import { CodeBlock, type CodeBlockValue } from "./CodeBlock";
import { Embed, type EmbedValue } from "./Embed";
import { Figure, type FigureValue } from "./Figure";
import { Footnote, type FootnoteValue } from "./Footnote";
import { PullQuote, type PullQuoteValue } from "./PullQuote";

/**
 * SPEC Phase 1 — the renderer for `bodyText`: every §3.2 object that can
 * appear in a body, plus heading anchors and both link marks.
 *
 * Wrap the output in <Prose> (Phase 0) — this component renders content, the
 * typography layer styles it.
 *
 * Components are built PER RENDER because two pieces of document-level state
 * exist: heading anchors are de-duplicated with the same counting rule as
 * `extractHeadings` (so the §3.5 `headings[]` field always points at real
 * ids), and footnotes are numbered in reading order.
 */

type InternalLinkMark = {
  reference?: { _type?: string; slug?: string | null } | null;
};

const PATH_BY_TYPE: Record<string, string> = {
  post: "/writing",
  caseStudy: "/case-studies",
  journalEntry: "/journal",
  project: "/projects",
  page: "",
};

export function internalHref(reference: InternalLinkMark["reference"]): string | null {
  const slug = reference?.slug;
  const type = reference?._type;
  if (!slug || !type || !(type in PATH_BY_TYPE)) return null;
  return `${PATH_BY_TYPE[type]}/${slug}`;
}

function spanTextOf(children: unknown): string {
  if (!Array.isArray(children)) return "";
  return children
    .map((child) =>
      typeof child === "object" && child !== null && "text" in child
        ? String((child as { text?: unknown }).text ?? "")
        : typeof child === "string"
          ? child
          : "",
    )
    .join("");
}

function buildComponents(): PortableTextComponents {
  const seenAnchors = new Map<string, number>();
  let footnoteNumber = 0;

  function anchorFor(children: React.ReactNode, value?: PortableTextBlock): string {
    // Anchor from the raw block text (matches extractHeadings), not the
    // rendered children, so marks inside a heading don't change the id.
    const raw = value ? spanTextOf(value.children) : "";
    const base = slugify(raw || String(children ?? "")) || "section";
    const count = seenAnchors.get(base) ?? 0;
    seenAnchors.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  return {
    block: {
      h2: ({ children, value }) => <h2 id={anchorFor(children, value)}>{children}</h2>,
      h3: ({ children, value }) => <h3 id={anchorFor(children, value)}>{children}</h3>,
      h4: ({ children }) => <h4>{children}</h4>,
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    },
    types: {
      figure: ({ value }: { value: FigureValue }) => <Figure value={value} />,
      codeBlock: ({ value }: { value: CodeBlockValue }) => <CodeBlock value={value} />,
      pullQuote: ({ value }: { value: PullQuoteValue }) => <PullQuote value={value} />,
      calloutBox: ({ value }: { value: CalloutBoxValue }) => <CalloutBox value={value} />,
      embed: ({ value }: { value: EmbedValue }) => <Embed value={value} />,
      footnote: ({ value }: { value: FootnoteValue }) => {
        footnoteNumber += 1;
        return <Footnote value={value} index={footnoteNumber} />;
      },
    },
    marks: {
      externalLink: ({ children, value }) => {
        const href = (value as { href?: string } | undefined)?.href ?? "";
        const rel = (value as { rel?: string } | undefined)?.rel;
        const isExternal = href.startsWith("http");
        return (
          <a
            href={href}
            rel={
              [rel, isExternal ? "noopener" : undefined].filter(Boolean).join(" ") || undefined
            }
          >
            {children}
          </a>
        );
      },
      internalLink: ({ children, value }) => {
        const href = internalHref((value as InternalLinkMark | undefined)?.reference);
        // A draft-only or deleted target degrades to plain text, never a dead link.
        if (!href) return <>{children}</>;
        return <Link href={href}>{children}</Link>;
      },
    },
  };
}

export function PortableTextRenderer({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={buildComponents()} />;
}
