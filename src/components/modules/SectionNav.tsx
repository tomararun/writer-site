"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { CaseStudySection } from "@/lib/case-study-sections";

/**
 * SPEC §6.6 — the case study's sticky secondary nav: the canonical sections,
 * scrollspy with aria-current, sitting under the header at ≥lg. Below lg it
 * degrades to a labelled "Jump to" <select>.
 */
export function SectionNav({ sections }: { sections: CaseStudySection[] }) {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);
  const selectId = useId();

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-10% 0% -70% 0%" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView();
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav
      aria-label="Case study sections"
      className="sticky top-14 z-30 border-b border-rule bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] backdrop-blur-[8px]"
    >
      <div className="mx-auto w-full max-w-[var(--width-container)] px-5 sm:px-8 lg:px-12">
        {/* ≥lg: the horizontal section list with scrollspy */}
        <ul className="hidden items-center gap-5 overflow-x-auto py-2.5 lg:flex">
          {sections.map((section) => (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "location" : undefined}
                className={cn(
                  "font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] no-underline transition-colors",
                  active === section.id ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {section.number ? <span aria-hidden="true">{section.number} </span> : null}
                {section.label}
              </a>
            </li>
          ))}
        </ul>

        {/* <lg: the Jump-to select */}
        <div className="flex items-center gap-3 py-2 lg:hidden">
          <label
            htmlFor={selectId}
            className="shrink-0 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
          >
            Jump to
          </label>
          <select
            id={selectId}
            value={active ?? sections[0]?.id}
            onChange={(event) => jumpTo(event.target.value)}
            className="min-h-8 w-full rounded-[var(--radius-xs)] border border-rule bg-paper px-2 font-mono text-[var(--text-2xs)] text-ink"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
