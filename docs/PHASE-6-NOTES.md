# Phase 6 — build notes

Exit criteria from the spec: _"searching a deliberately misspelled term from
a real post returns it in the top 3; archive filters combine correctly; the
archive JSON index is < 60 KB gzipped."_ The archive criteria are verifiable
now; the search ones need `DATABASE_URL` + an indexed dataset (below).

## What was built

| Area           | Files                                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Webhook        | `/api/revalidate` — HMAC via `parseBody` (next-sanity/webhook), idempotency through `webhook_deliveries.event_id` (`_id@_rev`), revalidates every affected path + tag (`pathsFor`/`tagsFor`, pure and tested), and mirrors publication state into `search_documents`                                                      |
| Index plumbing | `src/lib/search-index.ts` — ONE payload→row mapping shared by webhook and rebuild script; `scripts/reindex-search.ts` full rebuild with stale-row removal; `searchIndexQuery` (typed)                                                                                                                                     |
| Search API     | `/api/search` — `websearch_to_tsquery` + `ts_rank_cd`, `ts_headline` emitting real `<mark>`, type/year facet counts in ONE grouped query (GROUPING SETS), trigram fallback under 3 hits, `search_queries` log, 30/min rate limit                                                                                          |
| Search page    | `/search` — noindex, URL-synced 200ms-debounced input, facet chips with counts, `<mark>` highlights as highlighter swipes, mono timing (`23 results · 41ms`), §6.13 no-results copy with three escape routes, error state pointing at the archive, ↑/↓/Enter/Esc keys                                                     |
| Palette        | `⌘K` and `/` open a Radix Dialog palette: recent documents by default (empty-q search), live results with type chips, arrow keys, Esc restores focus. **Dynamically imported on first open** — zero bytes on the reading page                                                                                             |
| Archive        | `/archive` — static page + client filtering over the lean index: four `<fieldset>` groups (type/category/tag top-20+show-all/year) with counts in each label's accessible name, AND-across/OR-within combination, URL round-trip, aria-live count, mobile bottom sheet with Apply/Clear fixed bar, Clear-all first in DOM |
| Year pages     | `/archive/[year]` — server-rendered, indexable, own titles                                                                                                                                                                                                                                                                |
| Tests          | 80 unit tests (13 new: revalidation paths, search-row mapping, filter combination, facet honesty, URL round-trip, junk rejection)                                                                                                                                                                                         |

Two of the new tests caught real bugs before they shipped: year grouping
silently depended on pre-sorted input, and year params accepted slug-shaped
junk.

## Decisions that deviate from the spec, with reasons

### 1. The archive index travels with the page, not as a separate JSON fetch

§6.10 says "prefetched JSON index". The server component passes the lean
rows straight into the client explorer — same payload, one request fewer,
and it shares the tagged ISR cache with everything else. Measure it with:
`curl -s $URL/archive | gzip | wc -c` (the whole page, index included, must
sit under the 60 KB criterion at ~300 docs; the index itself is ~9 fields ×
docs).

### 2. Search facets are type + year; tag facets wait for a relational shape

§5.4 lists type/tag/year facets, but §5.2 stores tags as `tags_text` (one
text column for full-text matching) — honest tag _counts_ need an array
column or a join table. Type and year ship now from one GROUPING SETS query;
the archive page provides full tag filtering meanwhile. If tag facets are
wanted in /search, add `tags text[]` in a migration and extend the grouped
query.

### 3. The webhook trusts its projection, and the nightly sweep is the net

`pathsFor` revalidates current taxonomy facets. If an editor MOVES a post
between tags, the old tag page revalidates only if the webhook payload
carries previous values — the spec itself prescribes the Phase 7 nightly
full revalidate as the safety net for exactly this, so that's where it lands.

### 4. `ts_headline` output is trusted HTML from our own CMS

Snippets go through `dangerouslySetInnerHTML` because `ts_headline` produces
the `<mark>`s. The indexed text is `plainText` derived from our own Portable
Text — author-controlled, not user-controlled. Trigram-fallback snippets are
escaped in code (they bypass ts_headline).

## Connect it (after the Phase 5 services)

1. Sanity webhook: **sanity.io/manage → API → Webhooks** → URL
   `https://<site>/api/revalidate`, trigger on create/update/delete, secret →
   `SANITY_WEBHOOK_SECRET`, projection:

   ```groq
   {
     _id, _rev, _type, kind, "slug": slug.current, status, title, excerpt,
     reflection, summary, plainText, publishedAt, entryDate, readingTime,
     "tags": coalesce(tags, topics)[]->slug.current,
     "tagTitles": coalesce(tags, topics)[]->title,
     "category": category->slug.current,
     "series": series.series->slug.current,
     "coverUrl": coverImage.asset->url
   }
   ```

2. First index fill: `npx tsx --env-file-if-exists=.env.local scripts/reindex-search.ts`.
3. The exit-criterion run: search a misspelled seeded title on `/search`
   (e.g. "atention budget") — the trigram fallback should put the post in
   the top 3; check the mono timing stays double-digit.
