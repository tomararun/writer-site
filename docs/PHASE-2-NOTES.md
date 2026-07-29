# Phase 2 — build notes

Exit criteria from the spec: _"an article reads well on a phone and a 27"
display; axe clean; JS on the page ≤ 90 KB; a draft is previewable and its
public URL 404s."_ (The JS number was corrected to ≤ 115 KB in Phase 0 —
90 KB is below the framework floor.)

## What was built

| Area              | Files                                                                                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Article template  | `src/app/writing/[slug]/page.tsx` — §6.4 section order end to end, `generateStaticParams`, `generateMetadata`, BlogPosting JSON-LD                                                                                                           |
| Journal template  | `src/app/journal/[slug]/page.tsx` — §6.8: narrow measure, date-first header, reflection block, resources, prev/next by entry date                                                                                                            |
| Margin rail       | `src/components/modules/MarginRail.tsx` — scroll-linked highlighter fill (transform-only, rAF), ¶ marker per h2 with scrollspy + `aria-current`, footnote ticks at real document offsets                                                     |
| Mobile nav        | `MobileArticleNav.tsx` — 2px top progress line + "¶ Sections" bottom sheet on a native `<dialog>`                                                                                                                                            |
| Footnotes         | Two presentations, one numbering: inline sup marker → margin note at its reference's offset (≥lg, `FootnoteMargin`) / disclosure after the paragraph (<lg). Bidirectional links + return-to-text                                             |
| Code blocks       | shiki at build time (css-variables theme → palette tokens), filename tab, copy button with `aria-live`, focusable/labelled `<pre>`, highlighted lines                                                                                        |
| Article furniture | `ArticleHeader` (breadcrumb, mono meta, deck, byline), `ShareRow` (copy + X/Bluesky/LinkedIn/email, zero third-party JS), `UpdateNote`, `TagList`, `AuthorStrip`, `SeriesNav`, `RelatedGrid`, `SubscribeBlock`, `PrevNext`, `ArchivedNotice` |
| Preview           | `/api/preview/enable` (`defineEnableDraftMode`) + `/api/preview/disable`, `PreviewBanner` in the root layout, Studio action mints a short-lived dataset secret                                                                               |
| Motion            | All three §4.5 animations: rail draw + staggered content rise on article load, scroll-linked fill, card hairline extend — each inert under `prefers-reduced-motion`                                                                          |
| Queries           | `prevNextJournalQuery`, `journalRelatedCandidatesQuery`; posts/journal project raw `tagIds`/`topicIds` for the related scorer                                                                                                                |
| Tests             | 39 unit tests — footnote numbering, visibility gating, JSON-LD, date formats, renderer structure (no `<details>` inside `<p>`, bidirectional links)                                                                                          |

The Phase 0 `/writing/hello-type` demo is deleted — `[slug]` owns the route
space now.

## Lifecycle gating (the 404 half of the exit criterion)

`isPubliclyVisible` in `src/lib/visibility.ts`: drafts and in-review 404,
scheduled (future `publishedAt`) 404, archived renders with the §5.5 notice
banner. With draft mode on, everything renders under the "Preview — not
published" banner. `postBySlugQuery` deliberately doesn't filter status — the
same query serves preview; the page enforces visibility.

## Decisions that deviate from the spec, with reasons

### 1. Mobile footnotes are disclosures after the paragraph, not inside it

§6.4 says "inline `<details>`", but `<details>` is not phrasing content —
inside `<p>` it's invalid HTML and React 19 rejects it (a render test caught
this in Phase 1). The renderer hoists each disclosure to directly after the
paragraph containing its reference; the sup marker links down to it.

### 2. Preview authorisation uses dataset secrets, not an env secret

`SANITY_PREVIEW_SECRET` (env) would have to be embedded in the public Studio
bundle to be usable from the action. Instead the action writes a short-lived
secret into the dataset (`@sanity/preview-url-secret`) with the editor's own
session, and `/api/preview/enable` verifies it server-side with
`SANITY_API_READ_TOKEN`. Only people who can write to the dataset can mint a
preview link.

### 3. Syntax colours are palette-derived, not a stock theme

shiki's css-variables theme maps every token to `--shiki-*` custom properties
defined next to the palette in `globals.css` — keywords in accent, comments
muted, strings mixed between the two. Code recolours with the theme switch
and the "no hex outside globals.css" rule holds. Zero highlighting JS ships
to the client (shiki runs in server components only).

### 4. The mobile top progress line is decorative

§6.4 asks for `role="progressbar"` on the rail, which the ≥lg rail has. The
2px mobile line reports the same value; giving both a progressbar role would
announce reading progress twice, so the mobile line is `aria-hidden`.

### 5. Images render as a server-built `<img srcset>`, not `next/image`

§5.6 asks for a custom next/image loader. Implemented and measured: the
next/image client runtime added ~8 KB gzip to the article route, pushing it
to 116.4 KB — over the 115 KB gate. Since the loader only rewrites Sanity CDN
params we already control, `SanityImage` now builds the srcset server-side:
same CDN transforms, same `sizes` per layout, same LQIP placeholder and
width/height (zero CLS), zero client JavaScript. If Vercel's optimiser is
ever wanted, swap this one component.

### 6. Heading-hierarchy build validation is deferred

"No h4 after an h2" (§6.4) belongs to the Phase 8 content lint alongside
orphans/alt/broken links — a build-time gate against live CMS data would make
builds fail on content, which is a workflow decision to take deliberately.

## Verified here / needs your browser

Verified in this environment: typegen, strict typecheck, ESLint, 39/39 unit
tests, production build with all routes, JS budget gate.

The remaining exit criteria need a browser and the seeded dataset (no Sanity
credentials on this machine):

1. Connect the project + `npm run seed` (see PHASE-1-NOTES), `npm run dev`.
2. Open `/writing/the-66-character-rule` at 320 / 768 / 1440 px, both themes.
   Check: rail fill tracks scroll, ¶ markers light up, footnote 1 sits in the
   margin at its reference, code block copies, share row copies.
3. Run axe on the article and journal templates — expect zero violations.
4. Preview flow: open a draft in the Studio → "Open preview" → banner shows,
   draft renders; open the same URL in a private window → 404.
5. 200% browser zoom: no horizontal scroll.
