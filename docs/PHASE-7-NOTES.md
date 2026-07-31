# Phase 7 — build notes

Exit criteria from the spec: _"Rich Results Test passes for a post, a case
study and the home page; all four feeds validate; OG images render correctly
in the X, LinkedIn, Slack and iMessage previewers; CSP has no violations in
the console."_ All four need a deployed site (below); everything they test
is built and unit-verified.

## What was built

| Area            | Files                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEO helper      | `src/lib/seo.ts` — buildMetadata for content routes: description precedence (seo → excerpt → 155 chars of plainText), canonicalUrl override, long-title absolute rule, versioned OG image URLs                                                          |
| Structured data | `breadcrumbJsonLd` added; posts/case studies/journal now emit BreadcrumbList alongside their BlogPosting / Article+CreativeWork (indexes, home, contact had theirs since Phases 3–4)                                                                    |
| OG images       | `/api/og?slug&type&v=updatedAt` — Satori via next/og: Bricolage title, mono kind·date, paper ground, the highlighter swipe; fonts fetched once per instance from Google (graceful fallback); `Cache-Control: immutable`                                 |
| Feeds           | `/rss.xml` (everything), `/feed/writing.xml` (posts, FULL content), `/feed/journal.xml`, `/feed.json` (JSON Feed 1.1) — one item shape, RSS/JSON serialisers with CDATA-safe full HTML from Portable Text (absolute internal links)                     |
| Discovery       | `sitemap.ts` from Sanity with lastModified (excludes /search, /studio, result pages), `robots.ts`, hand-written `public/llms.txt`                                                                                                                       |
| Redirects       | `redirect` documents → real next.config redirects at build + a middleware fallback (60s in-memory cache over the Sanity CDN) for ones added between deploys                                                                                             |
| CSP             | Nonce-based CSP in middleware — no `unsafe-inline` for scripts; theme bootstrap allowed by hash; Plausible/Turnstile/Vercel allow-listed; Studio excluded; HSTS + X-Robots-Tag on /studio in next.config                                                |
| Analytics       | Plausible script (domain-gated) + `track()` wrapper; §5.7 events: scroll_depth (25/50/75/100), newsletter_subscribe (with source), contact_submitted, search_performed, case_study_section_view (Outcomes), outbound_click; Vercel Web Analytics beacon |
| View counting   | `POST /api/views/[...path]` behind NEXT_PUBLIC_ENABLE_VIEW_COUNTS: 1/30min per (IP-hash, path), path must exist in search_documents, aggregate-only upsert; fire-and-forget ViewPing                                                                    |
| Errors          | `instrumentation.ts` — onRequestError → Sentry envelope API, sampled 50%, DSN-gated, hand-rolled                                                                                                                                                        |
| Tests           | 89 unit tests (9 new: description precedence, metadata rules, breadcrumbs, XML escaping + CDATA splitting, feed HTML)                                                                                                                                   |

## Decisions that deviate from the spec, with reasons

### 1. The CSP is env-gated (`ENABLE_CSP=true`), default off

The honest conflict: Next.js applies a per-request nonce by forcing dynamic
rendering, and §4.3 mandates "everything a reader can find via a link is
static HTML". Both cannot hold at once — cached static HTML cannot carry
per-request nonces. The spec's own priority list puts the CSP in §5.8, so
it's fully implemented (nonce script-src, hash for the one deliberate inline
script, no unsafe-inline for scripts); flipping `ENABLE_CSP=true` in Vercel
enables it and accepts request-time rendering (data stays ISR-cached, so the
cost is render CPU, not Sanity round-trips). Until flipped, the static-first
default stands. This is the one deviation worth revisiting when Next ships
static-friendly CSP.

### 2. Vercel Analytics is a script tag, not the npm package

`@vercel/analytics` currently drags a vite-8 peer conflict into the tree
(vitest pins vite 7). The component's entire job is injecting
`/_vercel/insights/script.js`; the layout injects it directly when running
on Vercel. Zero dependency, same data.

### 3. Sentry is server-only and hand-rolled

The browser SDK costs ~25 KB gzip — the article route budget (115 KB, at
113.5) has no room for it. `instrumentation.ts` reports server/route errors
to Sentry's envelope API with no dependency and zero client bytes. If client
error tracking becomes worth the budget, swap in @sentry/nextjs deliberately.

### 4. `style-src` keeps `unsafe-inline`

Next injects inline styles; hashing them all is not practical. The spec's
"no unsafe-inline" targets scripts (the XSS vector), which is what the
policy enforces.

## Deployed-site checklist (the exit criteria)

1. Deploy, set `ENABLE_CSP=true`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`,
   `SENTRY_DSN` (optional), `NEXT_PUBLIC_ENABLE_VIEW_COUNTS` (optional).
2. Rich Results Test: `/`, a post, a case study — expect Person+WebSite,
   BlogPosting+Breadcrumb, Article+CreativeWork+Breadcrumb.
3. W3C feed validator on all four feeds.
4. Paste a post URL into X/LinkedIn/Slack/iMessage preview — the OG card
   should show the title with the highlighter swipe.
5. Open the console on `/`, an article and `/contact` (Turnstile) — zero CSP
   violations.
