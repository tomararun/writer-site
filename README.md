# writer-site

Personal writing portfolio, blog, case study hub and learning journal.
Built to the specification in [`docs/SPEC.md`](docs/SPEC.md).

## Status

**Phase 0 complete and verified.** See [`docs/PHASE-0-NOTES.md`](docs/PHASE-0-NOTES.md)
for what was built, what was verified, and two decisions that deviate from the spec.

| Phase | Scope                                                       | Status  |
| ----- | ----------------------------------------------------------- | ------- |
| 0     | Foundations: tokens, fonts, type, primitives, shell, CI     | ✅ Done |
| 1     | Sanity schemas, Studio, typed GROQ, Portable Text renderers | ⬜ Next |
| 2     | Article template, margin rail, footnotes, preview           | ⬜      |
| 3     | Home + four index pages + facet pages                       | ⬜      |
| 4     | Case study template                                         | ⬜      |
| 5     | Postgres, newsletter double opt-in, contact form            | ⬜      |
| 6     | Search, command palette, archive                            | ⬜      |
| 7     | SEO, feeds, OG images, structured data, analytics           | ⬜      |
| 8     | Hardening, e2e, a11y, Lighthouse, content, launch           | ⬜      |

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Two routes exist:

- `/` — type specimen. Verifies the scale and palette in both themes. Replaced in Phase 3.
- `/writing/hello-type` — article grid. Verifies the rail/prose/margin structure. Replaced in Phase 2.

Both are `noindex` and both are labelled in the UI as verification pages.

## Scripts

| Command             | Does                                                      |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Dev server                                                |
| `npm run build`     | Production build                                          |
| `npm run typecheck` | `tsc --noEmit`, strict                                    |
| `npm run lint`      | ESLint                                                    |
| `npm run test`      | Vitest                                                    |
| `npm run format`    | Prettier write                                            |
| `npm run verify`    | typecheck → lint → test → build. Run before every commit. |

## Architecture notes

**Design tokens live in exactly one place.** `src/app/globals.css` holds every colour,
size and layout value as a CSS custom property, bridged into Tailwind via `@theme inline`.
Nothing in the codebase may hardcode a hex value or a pixel font size. If you find one,
it is a bug.

**Standing copy lives in exactly one place.** `src/site.config.ts` holds every
`[bracketed]` placeholder from the spec's copy tables. The copy pass (spec P11)
should touch that file and the page components, nothing else.

**Themes switch without a flash.** `src/lib/theme-script.ts` is inlined into `<head>`
and sets `data-theme` before first paint. `suppressHydrationWarning` on `<html>` is
required and intentional — that one attribute legitimately differs between server
and client.

**The article grid places children by named position, not DOM order.** The rail is
navigation and sits after the article in the DOM while appearing to its left. This
matters for screen readers and is why `ArticleGrid` takes `rail` and `margin` as
props rather than reading `children`.

## Verify before you commit

```bash
npm run verify
```

`npm run build` requires network access to `fonts.googleapis.com` — `next/font/google`
downloads the three faces at build time and self-hosts them. There is no runtime
request to Google.
