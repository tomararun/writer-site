"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { SearchResponse } from "@/lib/search";
import { site } from "@/site.config";

/**
 * SPEC §6.13 — the search page client: debounced (200ms) URL-synced input,
 * facet chips with counts, results with <mark> highlights (the one place the
 * highlighter runs at full strength), timing in mono, the exact no-results
 * copy with three escape routes, and an error state that points at the
 * archive. ↑/↓ move through results, Enter opens, Esc clears; focus is never
 * moved into the list automatically.
 */

const TYPE_LABEL: Record<string, string> = {
  post: "Writing",
  caseStudy: "Case studies",
  journalEntry: "Journal",
  project: "Projects",
  page: "Pages",
};

type Status = "idle" | "loading" | "done" | "error";

export function SearchClient({
  initialQuery,
  initialType,
  initialYear,
}: {
  initialQuery: string;
  initialType: string | null;
  initialYear: number | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<string | null>(initialType);
  const [year, setYear] = useState<number | null>(initialYear);
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string, t: string | null, y: number | null) => {
    abortRef.current?.abort();
    if (!q.trim()) {
      setResponse(null);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    try {
      const params = new URLSearchParams({ q });
      if (t) params.set("type", t);
      if (y) params.set("year", String(y));
      const res = await fetch(`/api/search?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResponse((await res.json()) as SearchResponse);
      setStatus("done");
      setActiveIndex(-1);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setStatus("error");
    }
  }, []);

  /* Debounce 200ms; keep the URL shareable without server roundtrips. */
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (type) params.set("type", type);
      if (year) params.set("year", String(year));
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
      void search(query, type, year);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, type, year, search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = response?.results ?? [];

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      router.push(results[activeIndex].path);
    } else if (event.key === "Escape") {
      setQuery("");
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
  }

  const chipClass = (pressed: boolean) =>
    cn(
      "min-h-8 shrink-0 rounded-[var(--radius-xs)] border px-3 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] transition-colors",
      pressed
        ? "border-ink bg-ink text-paper"
        : "border-rule text-ink-muted hover:border-ink hover:text-ink",
    );

  return (
    <div onKeyDown={onKeyDown}>
      <form role="search" action="/search" method="get" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="site-search" className="sr-only">
          Search
        </label>
        <input
          ref={inputRef}
          id="site-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search essays, case studies and journal entries…"
          autoComplete="off"
          className="w-full min-h-12 rounded-[var(--radius-xs)] border border-rule bg-paper px-4 text-[var(--text-md)] text-ink"
        />
      </form>

      {response && response.facets.types.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto">
          <button
            type="button"
            aria-pressed={type === null}
            onClick={() => setType(null)}
            className={chipClass(type === null)}
          >
            All types
          </button>
          {response.facets.types.map((facet) => (
            <button
              key={facet.value}
              type="button"
              aria-pressed={type === facet.value}
              onClick={() => setType(type === facet.value ? null : facet.value)}
              className={chipClass(type === facet.value)}
            >
              {TYPE_LABEL[facet.value] ?? facet.value} · {facet.count}
            </button>
          ))}
          {response.facets.years.slice(0, 6).map((facet) => (
            <button
              key={facet.value}
              type="button"
              aria-pressed={year === facet.value}
              onClick={() => setYear(year === facet.value ? null : facet.value)}
              className={chipClass(year === facet.value)}
            >
              {facet.value} · {facet.count}
            </button>
          ))}
        </div>
      ) : null}

      <div
        aria-live="polite"
        className="mt-5 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted"
      >
        {status === "loading" ? "Searching…" : null}
        {status === "done" && response
          ? `${response.total} ${response.total === 1 ? "result" : "results"} for "${response.query}" · ${response.tookMs}ms`
          : null}
      </div>

      {status === "done" && response?.fallback ? (
        <p className="mt-2 text-[var(--text-sm)] text-ink-muted">
          No exact matches for &ldquo;{response.query}&rdquo;. Showing the closest titles.
        </p>
      ) : null}

      {status === "error" ? (
        <p className="mt-6 border border-rule bg-surface p-5 text-[var(--text-md)] text-ink-muted">
          Search is unavailable right now.{" "}
          <Link href="/archive" className="text-accent">
            Browse the archive
          </Link>{" "}
          instead — it has everything.
        </p>
      ) : null}

      {status === "done" && results.length === 0 ? (
        <p className="mt-6 border border-rule bg-surface p-5 text-[var(--text-md)] leading-relaxed text-ink-muted">
          Nothing matched &ldquo;{response?.query}&rdquo;. Three things you could try: check the{" "}
          <Link href="/archive" className="text-accent">
            archive
          </Link>
          , browse{" "}
          <Link href="/writing" className="text-accent">
            all writing
          </Link>
          , or{" "}
          <a href={`mailto:${site.email}`} className="text-accent">
            email me
          </a>{" "}
          and ask — I might have written it and forgotten.
        </p>
      ) : null}

      <ol className="mt-4">
        {results.map((result, index) => (
          <li
            key={result.id}
            className={cn("border-t border-rule", index === activeIndex && "bg-surface")}
          >
            <Link href={result.path} className="group block py-5 no-underline">
              <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                {[
                  TYPE_LABEL[result.type] ?? result.type,
                  result.publishedAt ? formatDate(result.publishedAt) : null,
                  result.readingTime ? `${result.readingTime} min` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <h2
                className="card-rule mt-1 font-display text-[var(--text-md)] font-semibold [&_mark]:bg-highlight-wash"
                dangerouslySetInnerHTML={{ __html: result.titleHtml }}
              />
              {result.snippetHtml ? (
                <p
                  className="mt-2 line-clamp-2 max-w-[70ch] text-[var(--text-sm)] leading-relaxed text-ink-muted sm:line-clamp-3 [&_mark]:bg-highlight-wash [&_mark]:text-ink"
                  dangerouslySetInnerHTML={{ __html: result.snippetHtml }}
                />
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
