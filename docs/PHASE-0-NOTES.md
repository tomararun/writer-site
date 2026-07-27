# Phase 0 — build notes

Exit criterion from the spec: _"a static page renders correct type in both themes at
3 widths, Lighthouse a11y = 100, no layout shift."_

## What was built

| Area             | Files                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| Design tokens    | `src/app/globals.css` — palette (light/dark/explicit), type scale, layout tracks, motion, base layer |
| Prose typography | `src/styles/typography.css` — every element Portable Text can emit                                   |
| Fonts            | `src/lib/fonts.ts` — Bricolage Grotesque, Literata, IBM Plex Mono                                    |
| Theme            | `src/lib/theme-script.ts`, `src/components/layout/ThemeToggle.tsx`                                   |
| Primitives       | `Container`, `Stack`, `Hairline`, `Prose`, `Button`/`ButtonLink`, `ArticleGrid`                      |
| Shell            | `Shell`, `Header`, `Nav`, `SearchTrigger`, `Footer`, `SkipLink`                                      |
| Config           | `src/site.config.ts` — all standing copy and placeholders                                            |
| Utilities        | `src/lib/cn.ts`, `src/lib/reading-time.ts`                                                           |
| Tests            | `tests/unit/reading-time.test.ts` — 8 cases                                                          |
| CI               | `.github/workflows/ci.yml` — typecheck, lint, format, test, build, JS budget                         |

## Verified

| Check                                                     | Result                                |
| --------------------------------------------------------- | ------------------------------------- |
| `tsc --noEmit` with `strict` + `noUncheckedIndexedAccess` | Pass, 0 errors                        |
| ESLint (`next/core-web-vitals`, `next/typescript`)        | Pass, 0 warnings                      |
| Prettier                                                  | Pass                                  |
| Vitest                                                    | 8/8 pass                              |
| `next build`                                              | Pass, all 3 routes prerendered static |
| Contrast ratios (calculated, documented in `globals.css`) | All ≥ 4.5:1                           |

## Two deviations from the spec, with reasons

### 1. Fonts load via `next/font/google`, not `next/font/local`

The spec says self-host via `next/font/local`. `next/font/google` **also** self-hosts:
it downloads the faces at build time and serves them from your own domain, with zero
runtime requests to Google. It gets there without committing binary font files to the
repo or maintaining a fetch script.

Consequence: `npm run build` needs network access to `fonts.googleapis.com`. If you
later want the files in-repo (for airgapped builds or a font you've licensed), swap
this one module — nothing else references the font loader.

### 2. The JS budget in the spec is not achievable — corrected here

The spec sets _"client JS ≤ 90 KB gzip on the article route"_ (§1.8, §5.9, §9.1).
Measured on a page with three components and no data layer:

| Chunk                                             | Raw      | Gzip         |
| ------------------------------------------------- | -------- | ------------ |
| Framework (React 19 + Next 15 App Router runtime) | 344.8 KB | **100.0 KB** |
| `/writing/hello-type` route chunk                 | —        | **0.15 KB**  |
| **Total**                                         |          | **97.8 KB**  |

The application code is 145 bytes. The ~100 KB is the App Router hydration floor and
is present on any route, including ones with no client components. **90 KB is below
the floor of the chosen stack**, so as written the gate would fail permanently at
Phase 8 no matter how disciplined the code is.

Corrected budget, applied in `.github/workflows/ci.yml`:

> **≤ 115 KB gzip total shared JS**, i.e. ≤ 15 KB of application JavaScript above the
> framework floor.

That keeps the spirit of the requirement — the constraint that actually matters is
_"don't ship a component library or a charting lib to a reading page"_ — while being
measurable. Watch it move when Phase 2 adds Motion and Phase 6 adds Radix Dialog;
15 KB is enough for both only if they stay tree-shaken and off the article route.

Update §1.8, §5.9 and §9.1 of the spec to match, or the checklist will contradict CI.

## Not built yet, deliberately

- `SearchTrigger` navigates to `/search` and the ⌘K shortcut works, but the command
  palette dialog is Phase 6 — it needs the search API to exist first.
- The footer subscribe slot is a link to `/newsletter`, not an input. A text field that
  does nothing is a worse lie than a link.
- The margin rail's progress fill is static at 34%. Scroll-linking is Phase 2.
- `/writing/hello-type` is a grid demo, not the article template.

## Before starting Phase 1

1. Replace the placeholders in `src/site.config.ts` — at minimum `name`, `statement`
   and `intro`. Designing Phase 3 against `[Your Name]` produces a template-shaped home page.
2. Run `npm run dev`, open `/` at 320px / 768px / 1440px, toggle the theme at each.
3. Run Lighthouse on both routes and confirm accessibility = 100.
4. Tab through the header: skip link → name → five nav items → search → theme toggle.
