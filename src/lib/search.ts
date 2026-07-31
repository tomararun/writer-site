import { sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";

/**
 * SPEC §4.6 / P7 — Postgres full-text search:
 * - `websearch_to_tsquery` + `ts_rank_cd` over the weighted tsv column
 * - `ts_headline` snippets emitting real <mark> elements
 * - facet counts for type and year in ONE grouped query (GROUPING SETS)
 * - trigram similarity fallback on `title` when fewer than 3 rows match,
 *   so typos still find things
 * - every query logged to search_queries (the editorial calendar)
 *
 * An empty `q` returns the most recent documents — that powers the command
 * palette's default view.
 */

export type SearchResult = {
  id: string;
  type: string;
  kind: string | null;
  path: string;
  title: string;
  titleHtml: string;
  snippetHtml: string;
  publishedAt: string | null;
  year: number | null;
  readingTime: number | null;
};

export type SearchFacets = {
  types: { value: string; count: number }[];
  years: { value: number; count: number }[];
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  facets: SearchFacets;
  total: number;
  tookMs: number;
  /** True when the trigram fallback supplied the results (typo rescue). */
  fallback: boolean;
};

export type SearchParamsInput = {
  q: string;
  type?: string | null;
  year?: number | null;
  page?: number;
  pageSize?: number;
};

const HEADLINE_OPTS = "StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=12";

function escapeHtml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

type Row = Record<string, unknown>;

function mapRow(row: Row): SearchResult {
  return {
    id: String(row.id),
    type: String(row.type),
    kind: (row.kind as string | null) ?? null,
    path: String(row.path),
    title: String(row.title),
    titleHtml: String(row.title_html ?? escapeHtml(String(row.title))),
    snippetHtml: String(row.snippet_html ?? ""),
    publishedAt: row.published_at ? new Date(row.published_at as string).toISOString() : null,
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    readingTime:
      row.reading_time === null || row.reading_time === undefined
        ? null
        : Number(row.reading_time),
  };
}

export async function runSearch(input: SearchParamsInput): Promise<SearchResponse> {
  if (!isDbConfigured()) {
    throw new Error("Search requires DATABASE_URL (see docs/PHASE-5-NOTES.md).");
  }

  const db = getDb();
  const started = Date.now();
  const q = input.q.trim().slice(0, 120);
  const type = input.type ?? null;
  const year = input.year ?? null;
  const pageSize = Math.min(Math.max(input.pageSize ?? 10, 1), 25);
  const offset = (Math.max(input.page ?? 1, 1) - 1) * pageSize;

  /* Empty query — recent documents (the palette's default view). */
  if (!q) {
    const recent = await db.execute(sql`
      SELECT id, type, kind, path, title, published_at, year, reading_time
      FROM ${schema.searchDocuments}
      WHERE (${type}::text IS NULL OR type = ${type})
      ORDER BY published_at DESC NULLS LAST
      LIMIT ${pageSize}
    `);
    return {
      query: "",
      results: recent.rows.map((row) => mapRow(row as Row)),
      facets: { types: [], years: [] },
      total: recent.rows.length,
      tookMs: Date.now() - started,
      fallback: false,
    };
  }

  const [matches, totalResult, facetResult] = await Promise.all([
    db.execute(sql`
      SELECT d.id, d.type, d.kind, d.path, d.title, d.published_at, d.year, d.reading_time,
        ts_rank_cd(d.tsv, query) AS rank,
        ts_headline('english', d.title, query,
          'StartSel=<mark>, StopSel=</mark>, HighlightAll=true') AS title_html,
        ts_headline('english', coalesce(d.excerpt, left(d.body_text, 800), d.title), query,
          ${HEADLINE_OPTS}) AS snippet_html
      FROM ${schema.searchDocuments} d, websearch_to_tsquery('english', ${q}) query
      WHERE d.tsv @@ query
        AND (${type}::text IS NULL OR d.type = ${type})
        AND (${year}::int IS NULL OR d.year = ${year})
      ORDER BY rank DESC, d.published_at DESC NULLS LAST
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT count(*)::int AS total
      FROM ${schema.searchDocuments} d, websearch_to_tsquery('english', ${q}) query
      WHERE d.tsv @@ query
        AND (${type}::text IS NULL OR d.type = ${type})
        AND (${year}::int IS NULL OR d.year = ${year})
    `),
    // §5.4 — facet counts from a single grouped query, unfiltered so the
    // chips show what ELSE the query could narrow to.
    db.execute(sql`
      SELECT d.type, d.year, count(*)::int AS count
      FROM ${schema.searchDocuments} d, websearch_to_tsquery('english', ${q}) query
      WHERE d.tsv @@ query
      GROUP BY GROUPING SETS ((d.type), (d.year))
    `),
  ]);

  let results = matches.rows.map((row) => mapRow(row as Row));
  let total = Number((totalResult.rows[0] as Row | undefined)?.total ?? 0);
  let fallback = false;

  /* §4.6 — trigram fallback: typos still find things. */
  if (total < 3) {
    const fuzzy = await db.execute(sql`
      SELECT id, type, kind, path, title, published_at, year, reading_time,
        left(coalesce(excerpt, body_text, ''), 240) AS snippet_plain,
        similarity(title, ${q}) AS sim
      FROM ${schema.searchDocuments}
      WHERE similarity(title, ${q}) > 0.18
        AND (${type}::text IS NULL OR type = ${type})
        AND (${year}::int IS NULL OR year = ${year})
      ORDER BY sim DESC
      LIMIT ${pageSize}
    `);
    const seen = new Set(results.map((result) => result.id));
    const extra = fuzzy.rows
      .filter((row) => !seen.has(String((row as Row).id)))
      .map((row) => {
        const mapped = mapRow(row as Row);
        mapped.snippetHtml = escapeHtml(String((row as Row).snippet_plain ?? ""));
        return mapped;
      });
    if (extra.length > 0) {
      fallback = results.length === 0;
      results = [...results, ...extra].slice(0, pageSize);
      total = Math.max(total, results.length);
    }
  }

  const facets: SearchFacets = { types: [], years: [] };
  for (const raw of facetResult.rows) {
    const row = raw as Row;
    if (row.type != null) {
      facets.types.push({ value: String(row.type), count: Number(row.count) });
    } else if (row.year != null) {
      facets.years.push({ value: Number(row.year), count: Number(row.count) });
    }
  }
  facets.types.sort((a, b) => b.count - a.count);
  facets.years.sort((a, b) => b.value - a.value);

  const tookMs = Date.now() - started;

  // The query log is the editorial calendar (§5.2); never let it fail a search.
  db.insert(schema.searchQueries)
    .values({ q, resultsCount: total })
    .catch((error: unknown) => console.error("search_queries insert failed:", error));

  return { query: q, results, facets, total, tookMs, fallback };
}
