"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { SearchResponse, SearchResult } from "@/lib/search";

/**
 * SPEC §6.13 / P7 — the ⌘K command palette on a Radix Dialog: recent posts
 * by default, live search while typing (200ms debounce), type chips,
 * arrow-key navigation, Enter opens, Esc closes and Radix restores focus to
 * the trigger. Loaded lazily by SearchTrigger, so none of this JavaScript
 * touches the reading page until asked for.
 */

const TYPE_LABEL: Record<string, string> = {
  post: "Writing",
  caseStudy: "Case study",
  journalEntry: "Journal",
  project: "Project",
  page: "Page",
};

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [activeIndex, setActiveIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(
      async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setStatus("loading");
        try {
          const params = new URLSearchParams({ q: query.trim() });
          const res = await fetch(`/api/search?${params}`, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as SearchResponse;
          setResults(data.results);
          setStatus("done");
          setActiveIndex(0);
        } catch (error) {
          if ((error as Error).name === "AbortError") return;
          setStatus("error");
          setResults([]);
        }
      },
      query ? 200 : 0,
    );
    return () => clearTimeout(timer);
  }, [query, open]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const target = results[activeIndex];
      if (target) {
        event.preventDefault();
        onOpenChange(false);
        router.push(target.path);
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 border border-rule bg-paper shadow-none focus:outline-none"
        >
          <Dialog.Title className="sr-only">Search the site</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to search. Use the arrow keys to choose a result and Enter to open it.
          </Dialog.Description>

          <div className="border-b border-rule p-3">
            <label htmlFor="palette-input" className="sr-only">
              Search
            </label>
            <input
              id="palette-input"
              type="search"
              autoFocus
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search essays, case studies and journal entries…"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="palette-results"
              aria-activedescendant={
                results[activeIndex] ? `palette-option-${results[activeIndex].id}` : undefined
              }
              className="w-full min-h-11 border-0 bg-transparent px-1 text-[var(--text-md)] text-ink focus:outline-none"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2">
            {!query && status === "done" && results.length > 0 ? (
              <p className="px-3 pb-1 pt-2 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                Recent
              </p>
            ) : null}

            {status === "error" ? (
              <p className="p-4 text-[var(--text-sm)] text-ink-muted">
                Search is unavailable right now.{" "}
                <Link
                  href="/archive"
                  onClick={() => onOpenChange(false)}
                  className="text-accent"
                >
                  Browse the archive
                </Link>{" "}
                instead.
              </p>
            ) : null}

            {status === "done" && query && results.length === 0 ? (
              <p className="p-4 text-[var(--text-sm)] text-ink-muted">
                Nothing matched &ldquo;{query}&rdquo;.
              </p>
            ) : null}

            <ul id="palette-results" role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <li key={result.id} role="presentation">
                  <Link
                    id={`palette-option-${result.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    href={result.path}
                    onClick={() => onOpenChange(false)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex items-baseline gap-3 rounded-[var(--radius-xs)] px-3 py-2.5 no-underline",
                      index === activeIndex ? "bg-surface text-ink" : "text-ink",
                    )}
                  >
                    <span className="w-20 shrink-0 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                      {TYPE_LABEL[result.type] ?? result.type}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-[var(--text-sm)] font-medium">
                      {result.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-rule px-4 py-2">
            <p className="font-mono text-[var(--text-2xs)] text-ink-muted">
              ↑↓ choose · Enter open · Esc close
            </p>
            <Link
              href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
              onClick={() => onOpenChange(false)}
              className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-accent no-underline"
            >
              Full search →
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
