import Link from "next/link";
import { formatDayMonth, isoDate } from "@/lib/format";
import type { MonthGroup as MonthGroupData, YearStats } from "@/lib/journal-stats";
import type { JournalIndexRow } from "@/lib/journal-stats";

/**
 * SPEC §6.7 — the ledger. The densest page on the site, deliberately: rows
 * under sticky month headings, a year summary strip on top. An <ol> per
 * month — it's a list, not tabular data.
 */

/** §6.7 mood legend: "↗ breakthrough · ≡ grinding · ✕ stuck · ? curious". */
export const LEDGER_MOOD_GLYPH: Record<string, string> = {
  breakthrough: "↗",
  grinding: "≡",
  stuck: "✕",
  curious: "?",
};

export function YearStrip({ stats }: { stats: YearStats | null }) {
  if (!stats) return null;
  const parts = [
    `${stats.entryCount} ${stats.entryCount === 1 ? "entry" : "entries"}`,
    ...(stats.hours > 0 ? [`${stats.hours} hours`] : []),
    ...(stats.topTopics.length > 0 ? [stats.topTopics.join(", ")] : []),
  ];
  return (
    <p className="border-y border-rule py-3 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
      {stats.year} — {parts.join(" · ")}
    </p>
  );
}

export function MoodLegend() {
  return (
    <p className="font-mono text-[var(--text-2xs)] text-ink-muted">
      {Object.entries(LEDGER_MOOD_GLYPH).map(([mood, glyph], i) => (
        <span key={mood}>
          {i > 0 ? " · " : null}
          <span aria-hidden="true">{glyph} </span>
          {mood}
        </span>
      ))}
    </p>
  );
}

export function JournalLedgerRow({ entry, id }: { entry: JournalIndexRow; id?: string }) {
  if (!entry.slug) return null;
  const title = entry.title ?? formatDayMonth(entry.entryDate);
  const topics = (entry.topics ?? []).filter((topic) => topic.title).slice(0, 2);
  const extraTopics =
    (entry.topics ?? []).filter((topic) => topic.title).length - topics.length;

  return (
    <li id={id} className="group relative">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule py-3 md:flex-nowrap">
        <time
          dateTime={isoDate(entry.entryDate)}
          className="w-full shrink-0 font-mono text-[var(--text-xs)] text-ink-muted md:w-16"
        >
          {formatDayMonth(entry.entryDate)}
        </time>
        {entry.mood && LEDGER_MOOD_GLYPH[entry.mood] ? (
          <span
            aria-label={entry.mood}
            title={entry.mood}
            className="w-4 shrink-0 text-center font-mono text-[var(--text-xs)] text-ink-muted"
          >
            <span aria-hidden="true">{LEDGER_MOOD_GLYPH[entry.mood]}</span>
          </span>
        ) : (
          <span aria-hidden="true" className="w-4 shrink-0" />
        )}
        <h3 className="min-w-0 flex-1 font-display text-[var(--text-sm)] font-medium leading-snug">
          <Link
            href={`/journal/${entry.slug}`}
            className="no-underline after:absolute after:inset-0"
          >
            <span className="card-rule">{title}</span>
          </Link>
        </h3>
        {topics.length > 0 ? (
          <span className="shrink-0 font-mono text-[var(--text-2xs)] text-ink-muted">
            {topics.map((topic) => topic.title).join(", ")}
            {extraTopics > 0 ? ` +${extraTopics}` : null}
          </span>
        ) : null}
        {entry.timeSpent ? (
          <span className="hidden w-12 shrink-0 text-right font-mono text-[var(--text-2xs)] text-ink-muted md:inline">
            {entry.timeSpent}m
          </span>
        ) : null}
      </div>
    </li>
  );
}

export function MonthGroupSection<T extends JournalIndexRow>({
  group,
  startIndex,
}: {
  group: MonthGroupData<T>;
  startIndex: number;
}) {
  return (
    <section aria-labelledby={`month-${group.key}`}>
      <h2
        id={`month-${group.key}`}
        className="sticky top-14 z-10 border-b border-rule bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] py-2 font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted backdrop-blur-[8px]"
      >
        {group.label} — {group.entries.length}{" "}
        {group.entries.length === 1 ? "entry" : "entries"}
      </h2>
      <ol className="scroll-mt-24">
        {group.entries.map((entry, i) => (
          <JournalLedgerRow key={entry._id} entry={entry} id={`entry-${startIndex + i + 1}`} />
        ))}
      </ol>
    </section>
  );
}
