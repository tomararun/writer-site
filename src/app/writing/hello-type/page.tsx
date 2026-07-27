import type { Metadata } from "next";
import { ArticleGrid } from "@/components/primitives/ArticleGrid";
import { Prose } from "@/components/primitives/Prose";

/**
 * PHASE 0 PLACEHOLDER — this validates the three-track ArticleGrid only.
 *
 * Phase 2 (P3) replaces this route with the real /writing/[slug] template:
 * live scroll-linked progress, scrollspy on the ¶ markers, footnotes positioned
 * at their real document offsets, figures in four layouts, code blocks with copy.
 *
 * What is real here: the grid collapse at 1024px, the DOM order (the rail is
 * navigation and comes AFTER the article), and the mono/display/body split.
 */

export const metadata: Metadata = {
  title: "Article grid",
  description: "Phase 0 verification of the three-track article layout.",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "measure", label: "The measure" },
  { id: "margin", label: "What the margin is for" },
  { id: "collapse", label: "Where it collapses" },
] as const;

function RailPlaceholder() {
  return (
    <nav aria-label="Sections in this article">
      {/* Phase 2: this static bar becomes a scroll-linked highlighter fill.
          Rendered here at a fixed 34% so the visual weight can be judged. */}
      <div className="relative mb-6 h-24 w-0.5 bg-rule" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[34%] bg-highlight" />
      </div>
      <ul className="space-y-3">
        {SECTIONS.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={index === 0 ? "location" : undefined}
              className="group flex items-baseline gap-2 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted no-underline transition-colors hover:text-ink"
            >
              <span aria-hidden="true" className={index === 0 ? "text-ink" : ""}>
                ¶
              </span>
              <span className={index === 0 ? "text-ink" : ""}>{section.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MarginPlaceholder() {
  return (
    <aside className="sticky top-24 pt-[19rem]">
      <p className="border-t border-rule pt-3 font-mono text-[var(--text-2xs)] leading-relaxed text-ink-muted">
        <span aria-hidden="true">1. </span>
        In Phase 2 this note is positioned at the vertical offset of its reference in the text,
        not pinned to a guessed padding.
      </p>
    </aside>
  );
}

export default function ArticleGridDemoPage() {
  return (
    <ArticleGrid rail={<RailPlaceholder />} margin={<MarginPlaceholder />} className="py-16">
      <article>
        <header>
          <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
            Essay · 3 min · Phase 0
          </p>
          <h1 className="mt-4 font-display text-[var(--text-2xl)] font-semibold">
            Three tracks, one column of prose
          </h1>
          <p className="mt-5 text-[var(--text-md)] leading-snug text-ink-muted">
            The reading page is a grid of a rail, a prose column and a margin. Only the middle
            one is allowed to carry the argument.
          </p>
        </header>

        <Prose className="mt-12">
          <h2 id="measure">The measure</h2>
          <p>
            The prose column is fixed at 66 characters. On a 27-inch display it does not widen;
            the gutters grow instead. This is the single most consequential decision in the
            layout, because line length governs reading comfort more than font size does.
          </p>
          <p>
            Resize this window slowly. The heading sizes interpolate — they are set in{" "}
            <code>clamp()</code> — but the paragraph width does not move until the grid
            collapses.
          </p>

          <h2 id="margin">What the margin is for</h2>
          <p>
            Footnotes, side figures and cross-references. Nothing that the argument depends on,
            because at narrow widths the margin does not exist. If a reader on a phone would
            miss something by not seeing it, it belongs in the prose column.
          </p>

          <h2 id="collapse">Where it collapses</h2>
          <p>
            At 1024 pixels both side tracks disappear. The rail becomes a two-pixel progress
            line at the top of the viewport plus a sections sheet; margin notes become inline
            disclosures. Two presentations of the same content, which is why each of those
            components is built twice rather than scaled down.
          </p>
        </Prose>
      </article>
    </ArticleGrid>
  );
}
