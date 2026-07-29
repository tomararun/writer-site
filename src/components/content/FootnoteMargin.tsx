"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SPEC §6.4 — the ≥lg footnote presentation: each note sits in the margin
 * track at the vertical offset of its reference in the text, "not pinned to
 * a guessed padding" (Phase 0's placeholder promise).
 *
 * The note content arrives as server-rendered children; this component only
 * measures and positions. Notes that would overlap are pushed down so they
 * stack with a gap. Re-measures on resize (fonts, viewport) via
 * ResizeObserver on the article.
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
  const [tops, setTops] = useState<number[] | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || notes.length === 0) return;

    function measure() {
      if (!container) return;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const items = Array.from(container.children) as HTMLElement[];
      const next: number[] = [];
      let floor = 0;
      notes.forEach((note, i) => {
        const ref = document.getElementById(note.refId);
        const item = items[i];
        if (!ref || !item) {
          next.push(floor);
          return;
        }
        const wanted = ref.getBoundingClientRect().top + window.scrollY - containerTop;
        const top = Math.max(wanted, floor);
        next.push(top);
        floor = top + item.offsetHeight + 16;
      });
      setTops(next);
    }

    measure();
    const article = document.querySelector("article");
    const observer = new ResizeObserver(measure);
    if (article) observer.observe(article);
    return () => observer.disconnect();
  }, [notes]);

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
