# Phase 8 — build notes

Exit criterion from the spec: _"the §9 checklist is fully green."_ The §9
checklist has three kinds of items: tooling (built and gated in CI here),
service checks (built, waiting on your credentials) and content (yours by
definition — "content is a launch requirement, not a follow-up"). The live
state of all of it is tracked in **docs/LAUNCH-RUNBOOK.md**.

## What was built

| Area          | Files                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 404 / 500     | `not-found.tsx` (§6.14 verbatim: search, three recent posts, index links, report link; real HTTP 404; h1 takes focus, number aria-hidden) and `error.tsx`                                                                                                                                                   |
| Crons         | `/api/cron/publish-scheduled` (hourly: revalidates paths/tags + search rows of documents whose publishedAt just crossed) and `/api/cron/nightly` (content_popularity CONCURRENTLY refresh, stale opt-in token expiry, the §5.4 full-revalidate safety net); `vercel.json` schedules both; CRON_SECRET-gated |
| Content lint  | `scripts/content-lint.ts` (`npm run lint:content`): missing alt (body/cover/gallery), broken/unpublished internal-link targets, tag-less posts, <2 internal links, missing excerpts, search-index presence                                                                                                  |
| Backup        | `.github/workflows/backup.yml` — weekly `sanity dataset export`, 90-day artifacts, manual trigger for the restore test                                                                                                                                                                                      |
| E2E           | Playwright (chromium/webkit/mobile projects): theme persistence, skip link, 404 status contract, no-JS contact submission, palette focus restore — plus content-gated specs (article rail + margin footnote, archive filter round-trip) that skip without the seeded dataset                                |
| Accessibility | `@axe-core/playwright` across every reachable template × both themes; zero serious/critical is an assertion, not a report                                                                                                                                                                                   |
| Visual        | `@visual`-tagged screenshot spec (6 templates × 3 widths × 2 themes), excluded from default runs; `VISUAL=1` writes/diffs baselines                                                                                                                                                                         |
| Component     | SubscribeForm state matrix (idle/loading/success/rate-limited/field-error with aria wiring) through a mocked server action                                                                                                                                                                                  |
| Coverage      | `npm run test:coverage` gates ≥80% lines+functions on the pure `src/lib` modules (currently 91%/88%); service-bound modules are excluded per §5.9's own layering (they're integration-layer, needing live services)                                                                                         |
| CI            | Coverage gate replaces the plain test step; new `e2e` job (chromium + axe, artifacts on failure); `lighthouse` job with the §5.9 budgets, `continue-on-error` until real content lands                                                                                                                      |

## Decisions that deviate from the spec, with reasons

### 1. Contract/integration test layers are scaffolded, not automated

§5.9's contract tests (GROQ against a seeded dataset) and integration tests
(Neon branch: subscribe→confirm→unsubscribe, webhook idempotency) require
live Sanity and Neon credentials that don't exist on this machine or in CI
secrets yet. The equivalent behaviours are covered at unit level (validators,
token expiry, idempotency key construction, search-row mapping), and the e2e
suite exercises the full flows the moment a seeded environment exists — the
specs are written and self-gating. Wiring the Neon-branch job belongs to the
first week of real operations, once secrets are in the repo.

### 2. Lighthouse blocks nothing yet

Perf/SEO scores measured against empty-state pages would be theatre. The job
runs and reports on every push; flipping `continue-on-error` off is an
explicit line in the launch runbook.

### 3. axe runs on "reachable templates", not a hardcoded 14

The template count depends on content existing; the suite enumerates every
route that responds and scans it in both themes, adding the content
templates automatically once seeded. Nothing is skipped silently — skips are
named in the report.

### 4. Coverage scope excludes service-bound lib modules

`search.ts`, `mailer.ts`, `rate-limit.ts`, `turnstile.ts`, `feed-data.ts`,
`shiki.ts`, `analytics.ts` are thin adapters over external services — unit
"coverage" of them would be mock-assertion theatre. The spec's own table
assigns them to the integration layer. The pure modules carry the ≥80% gate
and sit at 91% lines.

## Running the gates locally

```bash
npm run verify           # typegen → typecheck → lint → coverage-less tests → build
npm run test:coverage    # the ≥80% src/lib gate
npm run e2e:chromium     # after npm run build; webkit+mobile: npm run e2e
npm run lint:content     # against your seeded/production dataset
VISUAL=1 npm run e2e:chromium   # write/diff visual baselines
npx lhci autorun         # Lighthouse budgets, after a build
```
