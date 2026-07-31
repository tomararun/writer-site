import { cn } from "@/lib/cn";

/**
 * SPEC §4.5 — the named three-track grid that every long-form page uses:
 *
 *   [rail 6rem] [prose 66ch] [margin 16rem]
 *
 * Below 1024px both side tracks collapse and the prose becomes the only column.
 * That collapse is why the MarginRail and Footnote components (Phase 2) each need
 * two presentations rather than one that shrinks — see §6.4 responsive notes.
 *
 * The grid is defined with named areas rather than column counts so Phase 2 can
 * place the rail, prose and margin children in any DOM order. That matters for
 * accessibility: the rail is navigation and belongs AFTER the article in the DOM,
 * even though it sits to the left visually.
 */
export function ArticleGrid({
  rail,
  children,
  margin,
  className,
  measure = "default",
}: {
  /** Reading progress + section markers. Optional: journal entries have no rail (§6.8). */
  rail?: React.ReactNode;
  /** The prose column. */
  children: React.ReactNode;
  /** Footnotes and `layout: side` figures. Empty on most pages. */
  margin?: React.ReactNode;
  className?: string;
  /** §6.6 — case studies run a 72ch prose track; essays stay at 66ch. */
  measure?: "default" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        "max-w-[var(--width-container)]",
        "grid gap-y-0 justify-center",
        // Mobile and tablet: one column, capped at the measure.
        measure === "wide"
          ? "grid-cols-[minmax(0,var(--measure-wide))]"
          : "grid-cols-[minmax(0,var(--measure-prose))]",
        // Desktop: the real three-track grid.
        measure === "wide"
          ? "lg:grid-cols-[var(--track-rail)_minmax(0,var(--measure-wide))_var(--track-margin)]"
          : "lg:grid-cols-[var(--track-rail)_minmax(0,var(--measure-prose))_var(--track-margin)]",
        "lg:justify-start lg:gap-x-8 xl:gap-x-12",
        className,
      )}
    >
      {/* Rail: hidden below lg, where a fixed top progress bar replaces it (§6.4). */}
      {rail ? (
        <div className="hidden lg:col-start-1 lg:row-start-1 lg:block" aria-hidden={false}>
          <div className="sticky top-24">{rail}</div>
        </div>
      ) : null}

      <div className="col-start-1 row-start-1 min-w-0 lg:col-start-2">{children}</div>

      {/* Margin track: exists only at lg and up. Below that, footnotes render
          inline as <details> from within the prose column instead. */}
      {margin ? (
        <div className="hidden lg:col-start-3 lg:row-start-1 lg:block">{margin}</div>
      ) : null}
    </div>
  );
}
