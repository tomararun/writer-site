"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDayMonth, isoDate } from "@/lib/format";
import {
  activeFilterCount,
  EMPTY_FILTERS,
  facetCounts,
  filterArchive,
  groupItemsByYear,
  parseArchiveFilters,
  serializeArchiveFilters,
  type ArchiveFilters,
  type ArchiveItem,
} from "@/lib/archive-filter";

/**
 * SPEC §6.10 — instant client-side filtering over the prefetched index, URL
 * synced so any view is shareable. Filters are real checkboxes inside
 * <fieldset>/<legend>; counts live in each label's accessible name; the
 * result count is aria-live. Below lg the filters move into a bottom sheet
 * with Apply/Clear in a fixed bar. "Clear all" is first in DOM order.
 */

const TYPE_LABEL: Record<string, string> = {
  post: "Writing",
  caseStudy: "Case studies",
  journalEntry: "Journal",
};

const TOP_TAGS = 20;

function FilterGroups({
  items,
  filters,
  onChange,
  idPrefix,
}: {
  items: ArchiveItem[];
  filters: ArchiveFilters;
  onChange: (next: ArchiveFilters) => void;
  idPrefix: string;
}) {
  const counts = useMemo(() => facetCounts(items, filters), [items, filters]);
  const [showAllTags, setShowAllTags] = useState(false);

  const allTags = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags) totals.set(tag, (totals.get(tag) ?? 0) + 1);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [items]);
  const visibleTags = showAllTags ? allTags : allTags.slice(0, TOP_TAGS);

  function toggle(group: "types" | "categories" | "tags" | "years", value: string) {
    const current = filters[group];
    onChange({
      ...filters,
      [group]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  }

  const groups: {
    key: "types" | "categories" | "tags" | "years";
    legend: string;
    options: string[];
    label?: (value: string) => string;
  }[] = [
    {
      key: "types",
      legend: "Type",
      options: [...new Set(items.map((item) => item.type))],
      label: (value) => TYPE_LABEL[value] ?? value,
    },
    {
      key: "categories",
      legend: "Category",
      options: [
        ...new Set(items.map((item) => item.category).filter((c): c is string => !!c)),
      ].sort(),
    },
    { key: "tags", legend: "Tag", options: visibleTags },
    {
      key: "years",
      legend: "Year",
      options: [
        ...new Set(items.map((item) => item.date?.slice(0, 4)).filter((y): y is string => !!y)),
      ]
        .sort()
        .reverse(),
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <fieldset key={group.key}>
          <legend className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
            {group.legend}
          </legend>
          <div className="mt-2 space-y-1.5">
            {group.options.map((option) => {
              const count = counts[group.key].get(option) ?? 0;
              const checked = filters[group.key].includes(option);
              const id = `${idPrefix}-${group.key}-${option}`;
              const label = group.label ? group.label(option) : option;
              return (
                <div key={option} className="flex items-center gap-2">
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(group.key, option)}
                    className="size-4 shrink-0 accent-[var(--accent)]"
                  />
                  <label
                    htmlFor={id}
                    aria-label={`${label}, ${count} ${count === 1 ? "item" : "items"}`}
                    className={cn(
                      "flex min-w-0 flex-1 items-baseline justify-between gap-2 text-[var(--text-xs)]",
                      count === 0 && !checked ? "text-ink-muted/60" : "text-ink",
                    )}
                  >
                    <span className="truncate">{label}</span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-[var(--text-2xs)] text-ink-muted"
                    >
                      {count}
                    </span>
                  </label>
                </div>
              );
            })}
            {group.key === "tags" && allTags.length > TOP_TAGS ? (
              <button
                type="button"
                onClick={() => setShowAllTags((value) => !value)}
                className="mt-1 font-mono text-[var(--text-2xs)] text-accent"
              >
                {showAllTags ? "Show fewer" : `Show all ${allTags.length}`}
              </button>
            ) : null}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export function ArchiveExplorer({ items }: { items: ArchiveItem[] }) {
  const [filters, setFilters] = useState<ArchiveFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<ArchiveFilters>(EMPTY_FILTERS);

  /* Restore any shared URL on mount; the page itself stays static. */
  useEffect(() => {
    setFilters(parseArchiveFilters(window.location.search));
  }, []);

  function apply(next: ArchiveFilters) {
    setFilters(next);
    const qs = serializeArchiveFilters(next);
    window.history.replaceState(null, "", qs ? `/archive?${qs}` : "/archive");
  }

  const filtered = useMemo(() => filterArchive(items, filters), [items, filters]);
  const groups = useMemo(() => groupItemsByYear(filtered), [filtered]);
  const active = activeFilterCount(filters);

  const summaryParts = [
    `${filtered.length} ${filtered.length === 1 ? "result" : "results"}`,
    ...filters.types.map((t) => TYPE_LABEL[t] ?? t),
    ...filters.categories,
    ...filters.tags.map((t) => `tagged “${t}”`),
    ...filters.years,
  ];

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr]">
      {/* ── Filters: sidebar ≥lg, bottom sheet below ────────────────────── */}
      <div>
        <div className="mb-4">
          <label htmlFor="archive-search" className="sr-only">
            Search the archive
          </label>
          <input
            id="archive-search"
            type="search"
            value={filters.q}
            onChange={(event) => apply({ ...filters, q: event.target.value })}
            placeholder="Search titles and text…"
            className="w-full min-h-11 rounded-[var(--radius-xs)] border border-rule bg-paper px-3 text-[var(--text-sm)] text-ink"
          />
        </div>

        {/* Clear all: first in DOM order (§6.10 a11y). */}
        {active > 0 ? (
          <button
            type="button"
            onClick={() => apply(EMPTY_FILTERS)}
            className="mb-4 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-accent"
          >
            Clear all
          </button>
        ) : null}

        <div className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
          <FilterGroups items={items} filters={filters} onChange={apply} idPrefix="sidebar" />
        </div>

        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => {
              setDraft(filters);
              setSheetOpen(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 border border-rule bg-surface px-4 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink"
          >
            Filters{active > 0 ? ` (${active})` : ""}
          </button>

          <Dialog.Root open={sheetOpen} onOpenChange={setSheetOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
              <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto border-t border-rule bg-paper p-5 pb-24 focus:outline-none">
                <Dialog.Title className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                  Filters
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Choose filters, then apply them.
                </Dialog.Description>
                <div className="mt-4">
                  <FilterGroups
                    items={items}
                    filters={draft}
                    onChange={setDraft}
                    idPrefix="sheet"
                  />
                </div>
                <div className="fixed inset-x-0 bottom-0 flex gap-3 border-t border-rule bg-paper p-4">
                  <button
                    type="button"
                    onClick={() => setDraft(EMPTY_FILTERS)}
                    className="min-h-11 flex-1 border border-ink px-4 font-display text-[var(--text-sm)] font-semibold text-ink"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      apply(draft);
                      setSheetOpen(false);
                    }}
                    className="min-h-11 flex-1 bg-ink px-4 font-display text-[var(--text-sm)] font-semibold text-paper"
                  >
                    Apply
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* ── The list ─────────────────────────────────────────────────────── */}
      <div className="min-w-0">
        <p
          aria-live="polite"
          className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
        >
          {summaryParts.join(" · ")}
        </p>

        {filtered.length === 0 ? (
          <p className="mt-6 border border-rule bg-surface p-5 text-[var(--text-md)] text-ink-muted">
            No matches. Try removing a filter, or{" "}
            <Link href="/search" className="text-accent">
              search everything
            </Link>{" "}
            instead.
          </p>
        ) : (
          <div className="mt-4 space-y-10">
            {groups.map((group) => (
              <section key={group.year} aria-labelledby={`archive-${group.year}`}>
                <h2
                  id={`archive-${group.year}`}
                  className="border-b border-rule pb-2 font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
                >
                  <Link href={`/archive/${group.year}`} className="no-underline hover:text-ink">
                    {group.year}
                  </Link>{" "}
                  — {group.items.length}
                </h2>
                <ol>
                  {group.items.map((item) => (
                    <li key={item.id} className="group relative">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule py-2.5 first:border-t-0">
                        <time
                          dateTime={isoDate(item.date)}
                          className="w-14 shrink-0 font-mono text-[var(--text-2xs)] text-ink-muted"
                        >
                          {formatDayMonth(item.date)}
                        </time>
                        <span className="w-20 shrink-0 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                          {TYPE_LABEL[item.type] ?? item.type}
                        </span>
                        <span className="min-w-0 flex-1 font-display text-[var(--text-sm)] font-medium">
                          <Link
                            href={item.path}
                            className="no-underline after:absolute after:inset-0"
                          >
                            <span className="card-rule">{item.title}</span>
                          </Link>
                        </span>
                        {item.tags.length > 0 ? (
                          <span className="hidden shrink-0 font-mono text-[var(--text-2xs)] text-ink-muted md:inline">
                            {item.tags.slice(0, 3).join(", ")}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}

        <p className="mt-10">
          <a
            href="#top"
            className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted no-underline hover:text-ink"
          >
            ↑ Back to top
          </a>
        </p>
      </div>
    </div>
  );
}
