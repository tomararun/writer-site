import { slugify } from "./slugify";

/**
 * SPEC §3.5 — the derived fields computed on publish by the Studio action:
 * `plainText`, `wordCount`, `headings[]`. Pure functions over raw Portable
 * Text values so they can be unit tested without a Sanity runtime, and reused
 * by the seed script and the search indexer (Phase 6).
 *
 * The types here are deliberately structural: the action receives whatever the
 * document holds, which may predate the current schema.
 */

type PortableTextSpan = {
  _type: "span";
  text?: string;
};

export type PortableTextBlock = {
  _type: string;
  _key?: string;
  style?: string;
  children?: unknown[];
  /** Objects like pullQuote / calloutBox carry their own text fields. */
  text?: string;
  title?: string;
  caption?: string;
};

export type Heading = {
  _key: string;
  level: 2 | 3;
  text: string;
  anchor: string;
};

function isSpan(child: unknown): child is PortableTextSpan {
  return (
    typeof child === "object" &&
    child !== null &&
    (child as { _type?: unknown })._type === "span"
  );
}

/** The visible text of one block's children, ignoring inline objects. */
function spanText(block: PortableTextBlock): string {
  if (!Array.isArray(block.children)) return "";
  return block.children
    .filter(isSpan)
    .map((span) => span.text ?? "")
    .join("");
}

/**
 * Flattened text of a Portable Text body. Includes regular blocks and the
 * reader-visible text of custom objects (quotes, callouts, captions) because
 * the search index should match what a reader can see on the page.
 */
export function toPlainText(body: unknown): string {
  if (!Array.isArray(body)) return "";
  const parts: string[] = [];
  for (const raw of body) {
    if (typeof raw !== "object" || raw === null) continue;
    const block = raw as PortableTextBlock;
    if (block._type === "block") {
      const text = spanText(block);
      if (text.trim()) parts.push(text.trim());
      continue;
    }
    // Custom objects: collect their human-readable fields.
    for (const field of [block.text, block.title, block.caption]) {
      if (typeof field === "string" && field.trim()) parts.push(field.trim());
    }
  }
  return parts.join("\n\n");
}

export function countWordsInPortableText(body: unknown): number {
  const text = toPlainText(body);
  if (text.length === 0) return 0;
  return text.split(/\s+/u).filter(Boolean).length;
}

export type FootnoteRef = {
  /** The inline object's _key — stable across server and client renders. */
  _key: string;
  /** Author-provided anchor id, if any. */
  id: string | null;
  /** 1-based number in reading order. */
  number: number;
  /** The note's Portable Text body. */
  body: unknown;
};

/**
 * SPEC §6.4 — footnotes in reading order. The single source of numbering:
 * the inline reference, the mobile disclosure, the margin note and the rail
 * tick all consume this list, so they can never disagree about which note
 * is "3".
 */
export function extractFootnotes(body: unknown): FootnoteRef[] {
  if (!Array.isArray(body)) return [];
  const notes: FootnoteRef[] = [];
  for (const raw of body) {
    if (typeof raw !== "object" || raw === null) continue;
    const block = raw as PortableTextBlock;
    if (block._type !== "block" || !Array.isArray(block.children)) continue;
    for (const child of block.children) {
      if (typeof child !== "object" || child === null) continue;
      const node = child as { _type?: string; _key?: string; id?: string; body?: unknown };
      if (node._type !== "footnote") continue;
      notes.push({
        _key: node._key ?? `fn-${notes.length + 1}`,
        id: typeof node.id === "string" && node.id ? node.id : null,
        number: notes.length + 1,
        body: node.body,
      });
    }
  }
  return notes;
}

/**
 * SPEC §3.5 — `headings[]`: h2/h3 with slugified anchors, consumed by the
 * margin rail and the table of contents. Anchors are de-duplicated with a
 * numeric suffix so two sections named "Setup" don't collide.
 */
export function extractHeadings(body: unknown): Heading[] {
  if (!Array.isArray(body)) return [];
  const headings: Heading[] = [];
  const seen = new Map<string, number>();

  for (const raw of body) {
    if (typeof raw !== "object" || raw === null) continue;
    const block = raw as PortableTextBlock;
    if (block._type !== "block" || (block.style !== "h2" && block.style !== "h3")) continue;

    const text = spanText(block).trim();
    if (!text) continue;

    const base = slugify(text) || "section";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const anchor = count === 0 ? base : `${base}-${count + 1}`;

    headings.push({
      _key: block._key ?? anchor,
      level: block.style === "h2" ? 2 : 3,
      text,
      anchor,
    });
  }
  return headings;
}
