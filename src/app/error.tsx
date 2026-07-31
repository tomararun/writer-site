"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * SPEC §6.14 — the 500. Honest, logged, and pointing at the archive. This
 * is a client component by Next's contract; it renders inside the layout.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side reporting happens in instrumentation.ts; this line makes
    // the digest findable in the browser console for bug reports.
    console.error("Page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[var(--width-container)] px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[52ch]">
        <p
          aria-hidden="true"
          className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
        >
          500
        </p>
        <h1 className="mt-3 font-display text-[var(--text-2xl)] font-semibold">
          Something broke on my end.
        </h1>
        <p className="mt-4 text-[var(--text-md)] leading-snug text-ink-muted">
          It&rsquo;s been logged and I&rsquo;ll look at it. Try again in a moment, or browse the
          archive.
        </p>
        <p className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center bg-ink px-5 font-display text-[var(--text-sm)] font-semibold text-paper transition-colors hover:bg-accent"
          >
            Try again
          </button>
          <Link
            href="/archive"
            className="inline-flex min-h-11 items-center border border-ink px-5 font-display text-[var(--text-sm)] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
          >
            Browse the archive
          </Link>
        </p>
      </div>
    </div>
  );
}
