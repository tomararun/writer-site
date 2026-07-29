"use client";

import { useEffect, useRef } from "react";
import type { RailSection } from "./MarginRail";

/**
 * SPEC §6.4 responsive — below lg the rail becomes: a 2px reading-progress
 * line fixed to the top of the viewport, plus a floating "¶ Sections" button
 * opening a bottom sheet. Native <dialog> carries the focus trap and Escape
 * handling; no dialog library on a reading page.
 */
export function MobileArticleNav({ sections }: { sections: RailSection[] }) {
  const barRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const article = document.querySelector("article");
        if (!article || !barRef.current) return;
        const rect = article.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
        barRef.current.style.transform = `scaleX(${progress})`;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  function show() {
    dialogRef.current?.showModal();
  }
  function hide() {
    dialogRef.current?.close();
  }

  return (
    <div className="lg:hidden">
      {/* The 2px top progress line. Decorative here — the sheet carries the
          navigation semantics, and duplicate progressbars would be noise. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-highlight"
        ref={barRef}
        style={{ transform: "scaleX(0)" }}
      />

      {sections.length > 0 ? (
        <>
          <button
            type="button"
            onClick={show}
            className="fixed bottom-5 right-5 z-40 inline-flex min-h-11 items-center gap-2 border border-rule bg-surface px-4 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink shadow-none"
          >
            <span aria-hidden="true">¶</span> Sections
          </button>

          <dialog
            ref={dialogRef}
            onClick={(event) => {
              // Click on the backdrop (the dialog element itself) closes.
              if (event.target === dialogRef.current) hide();
            }}
            className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none border-t border-rule bg-paper p-0 text-ink backdrop:bg-ink/40"
          >
            <nav aria-label="Sections in this article" className="p-5 pb-8">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                  Sections
                </p>
                <button
                  type="button"
                  onClick={hide}
                  className="min-h-11 px-2 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
                >
                  Close
                </button>
              </div>
              <ul className="mt-3 space-y-1">
                {sections.map((section) => (
                  <li key={section.anchor}>
                    <a
                      href={`#${section.anchor}`}
                      onClick={hide}
                      className="flex min-h-11 items-baseline gap-3 border-t border-rule py-2 font-display text-[var(--text-sm)] font-medium no-underline"
                    >
                      <span aria-hidden="true" className="font-mono text-ink-muted">
                        ¶
                      </span>
                      {section.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </dialog>
        </>
      ) : null}
    </div>
  );
}
