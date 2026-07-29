import Link from "next/link";
import { formatDayMonth, isoDate } from "@/lib/format";

/**
 * SPEC §6.8 — the journal entry's supporting components. The page feels like
 * a page torn from a notebook; these stay quiet accordingly.
 */

/** §3.3 — "drives a small glyph, no emoji". */
const MOOD_GLYPH: Record<string, string> = {
  breakthrough: "◆",
  grinding: "▲",
  stuck: "■",
  curious: "●",
};

export function MoodGlyph({ mood }: { mood?: string | null }) {
  if (!mood || !MOOD_GLYPH[mood]) return null;
  return (
    <span className="font-mono text-[var(--text-xs)] text-ink-muted">
      <span aria-hidden="true">{MOOD_GLYPH[mood]} </span>
      {mood}
    </span>
  );
}

export function TopicChips({
  topics,
}: {
  topics: { title: string | null; slug: string | null }[] | null | undefined;
}) {
  const usable = (topics ?? []).filter((topic) => topic.title && topic.slug);
  if (usable.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {usable.map((topic) => (
        <li key={topic.slug}>
          <Link
            href={`/journal/topic/${topic.slug}`}
            className="rounded-[var(--radius-xs)] border border-rule px-2 py-0.5 font-mono text-[var(--text-2xs)] text-ink-muted no-underline transition-colors hover:border-accent hover:text-accent"
          >
            {topic.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** §6.8 — visually distinct: surface ground, accent hairline on the left. */
export function ReflectionBlock({ reflection }: { reflection?: string | null }) {
  if (!reflection) return null;
  return (
    <section
      aria-labelledby="reflection-label"
      className="mt-12 border-l-2 border-accent bg-surface p-5"
    >
      <h2
        id="reflection-label"
        className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
      >
        What changed in how I think
      </h2>
      <p className="mt-3 text-[var(--text-base)] leading-relaxed">{reflection}</p>
    </section>
  );
}

export type ResourceEntry = {
  _id: string;
  title: string | null;
  kind: string | null;
  url: string | null;
  author: string | null;
  note: string | null;
};

export function ResourceList({ resources }: { resources: ResourceEntry[] | null | undefined }) {
  const usable = (resources ?? []).filter((resource) => resource.title);
  if (usable.length === 0) return null;
  return (
    <section aria-labelledby="resources-label" className="mt-12 border border-rule p-5">
      <h2
        id="resources-label"
        className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
      >
        What I read / watched
      </h2>
      <ul className="mt-4 space-y-4">
        {usable.map((resource) => (
          <li
            key={resource._id}
            className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3"
          >
            <span className="shrink-0 rounded-[var(--radius-xs)] border border-rule px-1.5 py-0.5 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
              {resource.kind}
            </span>
            <span className="text-[var(--text-sm)]">
              {resource.url ? (
                <a href={resource.url} rel="noopener" target="_blank" className="font-medium">
                  {resource.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className="font-medium">{resource.title}</span>
              )}
              {resource.author ? (
                <span className="text-ink-muted"> — {resource.author}</span>
              ) : null}
              {resource.note ? (
                <span className="block text-[var(--text-xs)] text-ink-muted">
                  {resource.note}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TimeSpent({ minutes }: { minutes?: number | null }) {
  if (!minutes) return null;
  return (
    <p className="mt-8 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
      Time spent: {minutes} minutes
    </p>
  );
}

export type JournalTeaser = {
  _id: string;
  title: string | null;
  slug: string | null;
  entryDate: string | null;
  mood?: string | null;
};

export function RelatedEntries({ entries }: { entries: JournalTeaser[] }) {
  const usable = entries.filter((entry) => entry.slug);
  if (usable.length === 0) return null;
  return (
    <aside className="mt-12">
      <h2 className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        Nearby entries
      </h2>
      <ul className="mt-3 space-y-2">
        {usable.map((entry) => (
          <li key={entry._id}>
            <Link
              href={`/journal/${entry.slug}`}
              className="group flex items-baseline gap-3 no-underline"
            >
              <time
                dateTime={isoDate(entry.entryDate)}
                className="shrink-0 font-mono text-[var(--text-2xs)] uppercase text-ink-muted"
              >
                {formatDayMonth(entry.entryDate)}
              </time>
              <span className="card-rule font-display text-[var(--text-sm)] font-medium">
                {entry.title ?? formatDayMonth(entry.entryDate)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
