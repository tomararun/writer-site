export type EmbedValue = {
  url?: string | null;
  title?: string | null;
  caption?: string | null;
};

/**
 * SPEC §3.3 — the `embed` object, rendered as a link card rather than an
 * iframe: no third-party JavaScript on a reading page (§1.8).
 */
export function Embed({ value }: { value: EmbedValue }) {
  if (!value.url) return null;
  let host = "";
  try {
    host = new URL(value.url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  return (
    <a
      href={value.url}
      rel="noopener"
      target="_blank"
      className="my-8 block border border-rule bg-surface p-5 !no-underline transition-colors hover:border-accent"
    >
      <span className="block font-display text-[var(--text-sm)] font-semibold text-ink">
        {value.title ?? value.url}
      </span>
      {value.caption ? (
        <span className="mt-1 block text-[var(--text-sm)] text-ink-muted">{value.caption}</span>
      ) : null}
      <span className="mt-2 block font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {host} ↗
      </span>
    </a>
  );
}
