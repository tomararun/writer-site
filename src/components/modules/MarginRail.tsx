"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * SPEC §4.5 / §6.4 — the margin rail, the site's signature element. Top to
 * bottom: the reading-progress fill in highlighter yellow (appearance #4 of
 * 5), one ¶ marker per h2 that scroll-links and lights when active, and a
 * tick per footnote at its real document offset.
 *
 * It encodes actual document structure — every marker corresponds to
 * something in the text, nothing decorative.
 *
 * Accessibility per §6.4: <nav aria-label="Sections in this article">,
 * aria-current="location" on the active marker, role="progressbar" with
 * aria-valuenow updated in 10% steps only (not per frame). The fill is
 * transform-only.
 */

export type RailSection = { text: string; anchor: string };
export type RailTick = { number: number; refId: string };

const TRACK_HEIGHT = 160; // px — the drawn line; matches the Phase 0 sketch.

export function MarginRail({
  sections,
  ticks,
}: {
  sections: RailSection[];
  ticks: RailTick[];
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const [ariaProgress, setAriaProgress] = useState(0);
  const [active, setActive] = useState<string | null>(sections[0]?.anchor ?? null);
  const [tickOffsets, setTickOffsets] = useState<number[]>([]);

  /* Progress fill — rAF-throttled, transform only. */
  useEffect(() => {
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const article = document.querySelector("article");
        if (!article || !fillRef.current) return;
        const rect = article.getBoundingClientRect();
        const viewport = window.innerHeight;
        const total = rect.height - viewport;
        const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
        fillRef.current.style.transform = `scaleY(${progress})`;
        setAriaProgress(Math.round(progress * 10) * 10);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  /* Footnote ticks at their document offsets, projected onto the track. */
  useEffect(() => {
    function measure() {
      const article = document.querySelector("article");
      if (!article) return;
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const height = (article as HTMLElement).offsetHeight;
      setTickOffsets(
        ticks.map((tick) => {
          const ref = document.getElementById(tick.refId);
          if (!ref || height === 0) return 0;
          const offset = ref.getBoundingClientRect().top + window.scrollY - articleTop;
          return Math.min(1, Math.max(0, offset / height)) * TRACK_HEIGHT;
        }),
      );
    }
    measure();
    const article = document.querySelector("article");
    const observer = new ResizeObserver(measure);
    if (article) observer.observe(article);
    return () => observer.disconnect();
  }, [ticks]);

  /* Scrollspy on the h2 anchors. */
  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.anchor))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "0% 0% -70% 0%" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Sections in this article">
      <div className="relative mb-6" style={{ height: TRACK_HEIGHT }}>
        <div className="absolute inset-y-0 left-0 w-0.5 bg-rule" aria-hidden="true" />
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={ariaProgress}
          className="absolute inset-y-0 left-0 w-0.5 origin-top bg-highlight motion-safe:animate-[rail-draw_240ms_ease-out]"
          ref={fillRef}
          style={{ transform: "scaleY(0)" }}
        />
        {ticks.map((tick, i) => (
          <a
            key={tick.refId}
            href={`#${tick.refId}`}
            aria-label={`Footnote ${tick.number}`}
            className="absolute left-1 block h-px w-2 bg-ink-muted transition-colors hover:bg-ink"
            style={{ top: tickOffsets[i] ?? 0 }}
          />
        ))}
      </div>

      <ul className="space-y-3">
        {sections.map((section) => {
          const isActive = active === section.anchor;
          return (
            <li key={section.anchor}>
              <a
                href={`#${section.anchor}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "group flex items-baseline gap-2 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] no-underline transition-colors",
                  isActive ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                <span aria-hidden="true">¶</span>
                <span>{section.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
