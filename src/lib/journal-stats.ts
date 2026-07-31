/**
 * SPEC §6.7 — the ledger's derived views: rows grouped under month headings,
 * and the year summary strip ("2026 — 84 entries · 61 hours · React Native,
 * Postgres, writing"). Pure functions over the lean index projection.
 */

export type JournalIndexRow = {
  _id: string;
  title: string | null;
  slug: string | null;
  entryDate: string | null;
  mood?: string | null;
  timeSpent?: number | null;
  topics?: { title: string | null; slug: string | null }[] | null;
};

export type MonthGroup<T extends JournalIndexRow> = {
  /** "2026-03" */
  key: string;
  /** "March 2026" */
  label: string;
  entries: T[];
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const index = Number(month) - 1;
  return `${MONTHS[index] ?? month} ${year}`;
}

/** Rows must already be sorted newest-first; groups preserve that order. */
export function groupByMonth<T extends JournalIndexRow>(entries: T[]): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = [];
  for (const entry of entries) {
    const key = entry.entryDate?.slice(0, 7);
    if (!key) continue;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({ key, label: monthLabel(key), entries: [entry] });
    }
  }
  return groups;
}

export type YearStats = {
  year: string;
  entryCount: number;
  hours: number;
  topTopics: string[];
};

/** Stats for the most recent year that has entries. */
export function yearStats(entries: JournalIndexRow[], topicLimit = 3): YearStats | null {
  const dated = entries.filter((entry) => entry.entryDate);
  if (dated.length === 0) return null;

  const year = dated
    .map((entry) => entry.entryDate!.slice(0, 4))
    .sort()
    .reverse()[0]!;
  const inYear = dated.filter((entry) => entry.entryDate!.startsWith(year));

  const minutes = inYear.reduce((sum, entry) => sum + (entry.timeSpent ?? 0), 0);

  const topicCounts = new Map<string, number>();
  for (const entry of inYear) {
    for (const topic of entry.topics ?? []) {
      if (!topic.title) continue;
      topicCounts.set(topic.title, (topicCounts.get(topic.title) ?? 0) + 1);
    }
  }
  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topicLimit)
    .map(([title]) => title);

  return {
    year,
    entryCount: inYear.length,
    hours: Math.round(minutes / 60),
    topTopics,
  };
}
