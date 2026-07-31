"use client";

import { useRef } from "react";
import { useMarginPositions } from "@/components/modules/useMarginPositions";

/**
 * SPEC §6.4 — the ≥lg footnote presentation: each note sits in the margin
 * track at the vertical offset of its reference in the text, "not pinned to
 * a guessed padding" (Phase 0's placeholder promise).
 *
 * The note content arrives as server-rendered children; this component only
 * measures and positions (via the shared useMarginPositions hook).
 */

export type MarginNote = {
  number: number;
  refId: string;
  noteId: string;
};

export function FootnoteMargin({
  notes,
  children,
}: {
  notes: MarginNote[];
  children: React.ReactNode[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tops = useMarginPositions(
    containerRef,
    notes.map((note) => note.refId),
  );

  if (notes.length === 0) return null;

  return (
    <div ref={containerRef} className="relative h-full" data-footnote-margin>
      {notes.map((note, i) => (
        <aside
          key={note.refId}
          id={`${note.noteId}-margin`}
          aria-label={`Footnote ${note.number}`}
          className="left-0 right-0 border-t border-rule pt-2 font-mono text-[var(--text-2xs)] leading-relaxed text-ink-muted [&_p]:inline"
          style={
            tops
              ? { position: "absolute", top: tops[i] }
              : { position: "relative", marginTop: i === 0 ? 0 : 16 }
          }
        >
          <span aria-hidden="true">{note.number}. </span>
          {children[i]}{" "}
          <a href={`#${note.refId}`} aria-label="Return to text" className="no-underline">
            ↩
          </a>
        </aside>
      ))}
    </div>
  );
}
