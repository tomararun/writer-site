# Phase 4 — build notes

Exit criterion from the spec: _"one real case study published end-to-end,
with sourced metrics."_ The template is complete; the seeded case study
("Rebuilding the reading page", four metrics, each with a source) exercises
every section once the dataset is connected.

## What was built

| Area            | Files                                                                                                                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template        | `src/app/case-studies/[slug]/page.tsx` — all 14 §6.6 sections in order, 72ch measure, status gating + preview, archived notice                                                                                  |
| Section model   | `src/lib/case-study-sections.ts` — presence, contiguous numbering, anchors; one model drives the nav, the select and the eyebrows                                                                               |
| Section nav     | `SectionNav` — sticky under the header at ≥lg with scrollspy + `aria-current`; a labelled "Jump to" `<select>` below lg                                                                                         |
| Hero + glance   | `CaseStudyHero` (title, client, year, role, stack, one-line outcome, hero media), `AtAGlance` as a real `<dl>`                                                                                                  |
| Process         | `ProcessStep` in a real `<ol>` (numbers decorative); artefacts inline below lg, positioned in the margin track at ≥lg via the shared `useMarginPositions` hook (`ArtifactsMargin`)                              |
| Metrics band    | `MetricsBand` — surface band breaking out of the prose column, `<dt>`/`<dd>` pairs, values in real text at display size, per-metric source footnote                                                             |
| Learnings       | `LearningsGroups` — worked / didn't / would change, heading + shape glyph (● ✕ ◆), never colour alone                                                                                                           |
| Gallery         | `Gallery` — masonry (lg) / 2-col (md) / swipeable strip (sm), always captioned; Radix Dialog lightbox: focus trap + restore + Esc from Radix, arrow keys + swipe here, "Image N of M" aria-live, ≥44px controls |
| Structured data | `caseStudyJsonLd` — Article + CreativeWork with `about` and gallery `ImageObject`s                                                                                                                              |
| Layout          | `ArticleGrid` gained `measure="wide"` (72ch track); Phase 2's footnote margin refactored onto the shared positioning hook                                                                                       |
| Tests           | 56 unit tests (5 new: section numbering/renumbering, timeframe formatting, case-study JSON-LD)                                                                                                                  |

## Decisions that deviate from the spec, with reasons

### 1. "At a glance" has no Team row

§6.6 lists `Role · Timeframe · Team · Stack · Links`, but §3.3's caseStudy
schema has no team field — the spec's own copy table outruns its own schema.
Rather than invent a field mid-phase, the `<dl>` renders the four rows the
model supports. If team matters, add a `team: array[string]` field and one
row here.

### 2. The metrics band breaks out of the prose column, not the viewport

"Full-bleed band on --surface" — inside the three-track grid a true
viewport-bleed would overlap the margin track's artefacts. The band breaks
out of the 72ch column (same treatment as wide figures), which reads as a
band at every width without colliding with the margin.

### 3. Page title is "[Project] — Case study"

§6.6's title pattern `[Project] — [one-line outcome] — Case study` regularly
lands over 100 characters with a real outcome sentence; the outcome line is
the meta description instead, where it can actually be read in a snippet.
`seo.title` still overrides per document.

### 4. Section nav lists only sections that exist

The "nine canonical sections" appear in the nav only when the document has
content for them, and the numbered eyebrows renumber contiguously —
`caseStudySections` is unit-tested for exactly this, so a case study without
a gallery never shows a dead anchor.

## Verified here / needs your browser

Verified: typegen, strict typecheck, ESLint, 56/56 tests, production build
(`/case-studies/[slug]` prerenders via generateStaticParams), article-route
budget untouched.

With the seeded dataset:

1. `/case-studies/rebuilding-the-reading-page` — all sections render; the
   metrics band shows four sourced numbers.
2. ≥1024px: the section nav sticks under the header and follows the scroll;
   process artefacts sit in the right margin beside their steps.
3. <1024px: the nav becomes a "Jump to" select; artefacts render inline
   under their steps.
4. Gallery: click an image → lightbox traps focus; arrows and Esc work;
   position announces "Image N of M"; closing restores focus to the opener.
5. Deep links: `/case-studies/…#process`, `#outcomes`, `#metrics`.
