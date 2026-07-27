/**
 * SPEC §6.0 — "SkipLink (first focusable, 'Skip to content')".
 *
 * Visually hidden until focused, then it appears in the top-left. It must be the
 * first focusable element in the DOM, so it lives before <Header /> in Shell.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:inline-flex focus-visible:min-h-11 focus-visible:items-center focus-visible:bg-ink focus-visible:px-4 focus-visible:font-display focus-visible:text-[var(--text-sm)] focus-visible:font-semibold focus-visible:text-paper"
    >
      Skip to content
    </a>
  );
}
