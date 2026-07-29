import { PortableText } from "next-sanity";
import type { PortableTextBlock } from "next-sanity";
import type { FootnoteRef } from "@/lib/portable-text";

/**
 * SPEC §6.4 — footnotes have two presentations sharing one numbering
 * (`extractFootnotes`):
 *
 * - `FootnoteMarker` — the inline superscript reference, always rendered.
 * - `FootnoteDisclosure` — the below-lg presentation: a numbered <details>
 *   after the paragraph that contains the reference (never inside it —
 *   <details> is not phrasing content).
 * - The ≥lg margin note lives in `FootnoteMargin` (client), positioned at the
 *   reference's document offset.
 */

export function footnoteNoteId(note: FootnoteRef): string {
  return note.id ?? `fn-${note.number}`;
}

export function footnoteRefId(note: FootnoteRef): string {
  return `fnref-${note.number}`;
}

export function FootnoteMarker({ note }: { note: FootnoteRef }) {
  return (
    <sup id={footnoteRefId(note)}>
      <a
        href={`#${footnoteNoteId(note)}`}
        aria-label={`Footnote ${note.number}`}
        aria-describedby={footnoteNoteId(note)}
      >
        {note.number}
      </a>
    </sup>
  );
}

export function FootnoteDisclosure({ note }: { note: FootnoteRef }) {
  return (
    <details id={footnoteNoteId(note)} className="footnote-disclosure lg:hidden">
      <summary>
        <span aria-hidden="true">{note.number}. </span>
        <span>Footnote {note.number}</span>
      </summary>
      <div className="footnote-body">
        <PortableText value={(note.body ?? []) as PortableTextBlock[]} />{" "}
        <a href={`#${footnoteRefId(note)}`} aria-label="Return to text">
          ↩
        </a>
      </div>
    </details>
  );
}
