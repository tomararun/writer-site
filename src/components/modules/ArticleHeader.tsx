import Link from "next/link";
import { formatDate, isoDate } from "@/lib/format";
import { ShareRow } from "./ShareRow";

/**
 * SPEC §6.4 section order, top slice: breadcrumb → mono meta line
 * (KIND · N MIN · DATE) → h1 → deck → byline + share.
 */

const KIND_LABEL: Record<string, string> = {
  essay: "Essay",
  tutorial: "Tutorial",
  reflection: "Reflection",
  opinion: "Opinion",
};

export function ArticleHeader({
  kind,
  readingTime,
  publishedAt,
  title,
  deck,
  authorName,
  url,
}: {
  kind?: string | null;
  readingTime?: number | null;
  publishedAt?: string | null;
  title: string;
  deck?: string | null;
  authorName?: string | null;
  url: string;
}) {
  const meta = [
    kind ? (KIND_LABEL[kind] ?? kind) : null,
    readingTime ? `${readingTime} min` : null,
  ].filter(Boolean);

  return (
    <header>
      <nav aria-label="Breadcrumb">
        <Link
          href="/writing"
          className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted no-underline transition-colors hover:text-ink"
        >
          ← Writing
        </Link>
      </nav>

      <p className="mt-6 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {meta.join(" · ")}
        {publishedAt ? (
          <>
            {meta.length > 0 ? " · " : null}
            <time dateTime={isoDate(publishedAt)}>{formatDate(publishedAt)}</time>
          </>
        ) : null}
      </p>

      <h1 className="mt-4 max-w-[28ch] font-display text-[var(--text-2xl)] font-semibold">
        {title}
      </h1>

      {deck ? (
        <p className="mt-5 max-w-[52ch] text-[var(--text-md)] leading-snug text-ink-muted">
          {deck}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-4">
        {authorName ? (
          <p className="font-display text-[var(--text-sm)] font-medium">{authorName}</p>
        ) : (
          <span />
        )}
        <ShareRow url={url} title={title} />
      </div>
    </header>
  );
}
