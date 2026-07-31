# Phase 3 — build notes

Exit criteria from the spec: _"every published document is reachable in ≤ 2
clicks from the home page; all filter states are URL-shareable and restore
correctly on reload."_

## What was built

| Area          | Files                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home          | `src/app/page.tsx` — §6.1 composition: statement → currently → selected writing (1 lead + 2) → case studies → journal (5 rows) → subscribe; Person + WebSite JSON-LD                            |
| Writing index | `src/app/writing/page.tsx` — list not grid, lead item, kind/category/tag filters + 3 sorts as URL state, cumulative pagination, CollectionPage JSON-LD                                          |
| Journal       | `src/app/journal/page.tsx` — the ledger: year strip (entries · hours · top topics), sticky month headings, mood legend, topic filter, Blog JSON-LD                                              |
| Case studies  | `src/app/case-studies/page.tsx` — featured full width + 2-col grid, §6.5 copy verbatim                                                                                                          |
| Projects      | `src/app/projects/page.tsx` — 3-col grid, status filter, two explicit links per card (§6.9: no whole-card target)                                                                               |
| Facets        | `/writing/tag/[tag]`, `/writing/category/[category]`, `/writing/series/[series]`, `/journal/topic/[topic]` — SSG, own titles + intro copy                                                       |
| Filter bar    | `FilterBar` (client) — aria-pressed chips, sort select, aria-live result count, Clear; the only state is the query string                                                                       |
| Load more     | `LoadMore` (client) — a real `?page=n` anchor; pages are cumulative server-side so it appends for readers and paginates for crawlers; moves focus to the first new item and announces the count |
| Cards         | `Cards.tsx` — PostRow/LeadPostCard/PostCard/CaseStudyCardWide/ProjectCard, one stretched link per card named by the title alone                                                                 |
| Helpers       | `src/lib/index-params.ts` (URL param parsing, filter summaries), `src/lib/journal-stats.ts` (month grouping, year strip) — pure, tested                                                         |
| Tests         | 51 unit tests (12 new: param round-trips, junk degradation, month grouping, year stats, index JSON-LD)                                                                                          |

The Phase 0 type specimen at `/` is replaced by the real home page.

## The two exit criteria, mapped

**≤ 2 clicks:** header/footer → the four indexes (1 click) → every published
post, case study, entry and project (2). Facets are reachable from tag chips
and the filter bar.

**URL-shareable filters:** the only filter state is `searchParams`
(`?kind=essay&tag=typography&sort=oldest&page=2`); `parseWritingParams` &
co. restore any shared URL and degrade junk values to defaults. Changing a
filter resets `page`.

## Decisions that deviate from the spec, with reasons

### 1. Filtered index views render dynamically, not SSG

§4.3 lists `/writing` as SSG, but §6.3/P4 demand searchParams-driven
filters — reading `searchParams` makes the route request-rendered in Next.
The data underneath still comes through `sanityFetch`'s tagged ISR cache, so
requests are cache-hits, and the bare route stays cheap. The alternative
(shipping the whole corpus to the client and filtering there) is the §6.10
archive pattern, deliberately reserved for Phase 6.

### 2. "Load more" is cumulative pages, not client-side fetch-append

`?page=2` renders items 1–24 server-side. Following the link therefore
_appends_ (React reconciles the existing rows, keeps scroll, and the client
component moves focus to the first new row) while crawlers still see plain
paginated anchors. No fetch layer, no duplicated list state — the URL stays
the single source of truth.

### 3. Home sections hide rather than show empty marketing

P4's designed empty states apply to the indexes (all four have them, with
two escape routes each, §6 copy verbatim). On the home page an empty "Case
studies" heading would be self-defeating — sections render only when content
exists; the writing section carries the one empty state a fresh site needs.

### 4. Sort variants are three queries

GROQ cannot parameterise `order()`, and sanity-typegen cannot evaluate
interpolated queries, so newest/oldest/longest are three near-identical
`defineQuery` literals. Verbosity bought type-safety; drift is caught by the
typegen step in `verify`.

### 5. Mood glyphs aligned to the §6.7 legend

Phase 2's entry page used placeholder glyphs; both the ledger and the entry
page now use the legend set (↗ ≡ ✕ ?), with text labels for screen readers.

## Verified here / needs your browser

Verified: typegen, strict typecheck, ESLint, 51/51 tests, production build,
article-route JS budget unchanged (the new client components — FilterBar,
LoadMore — ship only on index routes).

With the seeded dataset (`npm run seed`, see PHASE-1-NOTES):

1. `/` — statement, currently strip, 1 lead + 2 posts, case study card,
   5 journal rows.
2. `/writing?kind=tutorial&sort=oldest` — share the URL into a new tab: the
   same view restores. Toggle chips; watch the result count line update.
3. `/journal` — year strip totals, sticky month headings, topic filter,
   mood legend.
4. `/projects?status=live`, `/case-studies`, and the facets:
   `/writing/tag/typography`, `/writing/series/typography-for-developers`,
   `/journal/topic/tooling`.
5. Keyboard: tab through a card list — one stop per card, named by the title.
