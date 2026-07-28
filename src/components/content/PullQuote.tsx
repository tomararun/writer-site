import { cn } from "@/lib/cn";

export type PullQuoteValue = {
  text?: string | null;
  attribution?: string | null;
  emphasis?: boolean | null;
};

/**
 * SPEC §3.2 — a sentence set large between paragraphs. With `emphasis`, it
 * carries the highlighter wash — one of the five allowed appearances.
 */
export function PullQuote({ value }: { value: PullQuoteValue }) {
  if (!value.text) return null;

  return (
    <aside className="my-10">
      <p
        className={cn(
          "font-display text-[var(--text-lg)] font-semibold leading-snug tracking-[var(--tracking-display)]",
          value.emphasis && "inline bg-highlight-wash box-decoration-clone px-1",
        )}
      >
        {value.text}
      </p>
      {value.attribution ? (
        <p className="mt-3 font-mono text-[var(--text-xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
          — {value.attribution}
        </p>
      ) : null}
    </aside>
  );
}
