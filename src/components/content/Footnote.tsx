import { PortableText } from "next-sanity";
import type { PortableTextBlock } from "next-sanity";

export type FootnoteValue = {
  _key?: string;
  id?: string | null;
  body?: PortableTextBlock[] | null;
};

/**
 * SPEC §3.2 — the footnote's Phase 1 presentation: a numbered superscript
 * marker followed by the note inline, set small and muted. Everything here is
 * phrasing content — a footnote lives INSIDE a paragraph, so block elements
 * (and <details>) are not allowed.
 *
 * Phase 2 replaces the inline note with the two real presentations: a margin
 * note at the reference's offset on wide screens, a tap-to-open disclosure
 * below 1024px.
 */
export function Footnote({ value, index }: { value: FootnoteValue; index: number }) {
  const anchor = value.id || `fn-${value._key ?? index}`;

  return (
    <span id={anchor}>
      <sup>
        <a href={`#${anchor}`} aria-label={`Footnote ${index}`}>
          {index}
        </a>
      </sup>
      <span className="mx-1 font-mono text-[0.72em] text-ink-muted [&_p]:inline">
        (<PortableText value={value.body ?? []} />)
      </span>
    </span>
  );
}
