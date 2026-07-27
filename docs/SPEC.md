# Personal Writer Website — Product, Design & Engineering Specification

**Version** 1.0 · **Status** Ready for build · **Owner** [Your Name] · **Audience** Developer or AI coding agent

This document is the single source of truth for building the site. It is ordered so you can read top-to-bottom once, then work from §7 (roadmap) and §9 (checklist) day-to-day.

---

## 0. Assumptions

These are stated so you can correct them rather than discover them.

| #   | Assumption                                                                                                                                                               | Impact if wrong                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| A1  | Single author. No multi-author bylines at launch, but the schema supports them.                                                                                          | Low — `author` is already a referenced document.                                  |
| A2  | Content volume at launch: ~15 essays, 3 case studies, ~20 journal entries, 6 projects. Growing to ~300 documents in 3 years.                                             | Low — this rules out needing a dedicated search vendor on day one.                |
| A3  | You want to write in a real editor with drafts, previews and image handling — not commit MDX files to git.                                                               | High — this is the reason for a headless CMS over a git-based pipeline. See §4.2. |
| A4  | No paywall, no accounts for readers, no comments at launch. Newsletter is the only reader-side data capture.                                                             | High — removes reader auth entirely from v1.                                      |
| A5  | You are the only editor. Role-based access exists but starts as a single-role config.                                                                                    | Low.                                                                              |
| A6  | English only at launch, but URLs and schema stay i18n-ready (no locale prefix in v1).                                                                                    | Medium — retrofitting locales later costs a redirect map.                         |
| A7  | You are based in the EU (Netherlands), so GDPR applies: cookieless analytics, double opt-in newsletter, explicit consent copy, DPA-covered vendors.                      | High — drives analytics and newsletter choices.                                   |
| A8  | Target running cost: €0–25/month at launch.                                                                                                                              | Medium — rules out Algolia/Contentful paid tiers.                                 |
| A9  | You write about software, craft, and non-technical subjects (culture, philosophy, sport). The design must not look like a dev blog _or_ a literary magazine exclusively. | Medium — drives the type pairing in §4.5.                                         |
| A10 | Copy in this document is real, usable placeholder copy. Replace the bracketed `[…]` tokens; the rest can ship.                                                           | —                                                                                 |

---

## 1. Product Requirements Document

### 1.1 Problem statement

A writer who also builds things has work scattered across platforms — essays on Medium or Substack, projects on GitHub, notes in Notion, nothing that connects them. A visitor who reads one good essay has no path to "what else has this person made, and how do they think?" The site's job is to make that path obvious in one click, and to make the writing itself the most attractive thing on the page.

### 1.2 Vision

> A writer's notebook that happens to be a website. Prose set like a book, chrome set like software, and a visible trail of how the thinking developed.

### 1.3 Goals & success metrics

| #   | Goal                             | Metric                                                 | Target at 6 months           |
| --- | -------------------------------- | ------------------------------------------------------ | ---------------------------- |
| G1  | Showcase best writing            | Median scroll depth on `/writing/[slug]`               | ≥ 65%                        |
| G2  | Convert readers into subscribers | Newsletter signup rate per unique reader               | ≥ 3.5%                       |
| G3  | Present projects credibly        | % of case-study sessions reaching the Outcomes section | ≥ 50%                        |
| G4  | Show growth over time            | Journal entries published per month                    | ≥ 4                          |
| G5  | Be discoverable                  | Non-brand organic sessions / month                     | ≥ 1,200                      |
| G6  | Feel fast                        | p75 LCP mobile, INP, CLS                               | < 2.0s / < 200ms / < 0.05    |
| G7  | Be accessible                    | axe-core violations on every template; WCAG level      | 0 / 2.1 AA                   |
| G8  | Be maintainable by you alone     | Time from "idea" to "published post"                   | < 20 min for a journal entry |

### 1.4 Non-goals (v1)

Comments · reader accounts · paid membership · a full-text book reader · AI chat over the archive · multi-language · e-commerce · a public API.

Each is deliberately deferred, not rejected. §7.9 lists the ones worth doing in v2.

### 1.5 Personas

| Persona                     | Arrives from                     | Wants in 20 seconds                       | Their success                               |
| --------------------------- | -------------------------------- | ----------------------------------------- | ------------------------------------------- |
| **The Skimming Recruiter**  | LinkedIn, a referral             | Proof of depth and range                  | Reads one case study end to end             |
| **The Deep Reader**         | Search, a newsletter link        | More of the same thinking                 | Subscribes, or opens 3+ posts               |
| **The Peer / Collaborator** | Twitter/X, Bluesky, a Slack link | Whether you're worth writing to           | Uses the contact form                       |
| **Future You**              | Direct, bookmark                 | To find that thing you wrote 8 months ago | Finds it via archive or search in under 30s |

### 1.6 Content pillars & information architecture

Four content types, deliberately distinct in shape and promise to the reader:

| Type                                                  | Route                                 | Promise                                       | Typical length              | Cadence            |
| ----------------------------------------------------- | ------------------------------------- | --------------------------------------------- | --------------------------- | ------------------ |
| **Writing** (essay / tutorial / reflection / opinion) | `/writing/[slug]`                     | A finished argument                           | 1,200–3,000 words           | Weekly–fortnightly |
| **Case study**                                        | `/case-studies/[slug]`                | How something real got built and what it cost | 1,500–4,000 words + gallery | Quarterly          |
| **Journal entry**                                     | `/journal/[slug]`                     | An unfinished thought, dated                  | 200–800 words               | 2–4× / week        |
| **Project**                                           | `/projects/[slug]` (or external link) | What it is, in one screen                     | 150–400 words               | As shipped         |

The distinction between Writing and Journal is the spine of the whole site: **Writing is claimed, Journal is provisional.** State that in the UI, not just in your head — the journal index carries the line _"Thinking out loud. Unedited on purpose."_

### 1.7 Functional requirements

| ID  | Requirement                                                                      | Priority   |
| --- | -------------------------------------------------------------------------------- | ---------- |
| F1  | Browse and filter content by type, category, tag, series, and year               | Must       |
| F2  | Full-text search across all four content types with highlighted matches          | Must       |
| F3  | Reading time, publish date, and updated date on every long-form page             | Must       |
| F4  | Related content (algorithmic: shared tags → same series → same category)         | Must       |
| F5  | Share links (copy link, X, LinkedIn, Bluesky, email) with no third-party scripts | Must       |
| F6  | Newsletter signup with double opt-in, confirmation email, one-click unsubscribe  | Must       |
| F7  | Contact form with spam protection and email delivery                             | Must       |
| F8  | Draft → in review → published workflow with authenticated live preview           | Must       |
| F9  | Scheduled publishing                                                             | Should     |
| F10 | Per-post series/collection grouping with prev/next navigation                    | Should     |
| F11 | Footnotes and margin notes in long-form content                                  | Should     |
| F12 | Dynamic Open Graph images per document                                           | Should     |
| F13 | RSS/Atom + JSON Feed, per-type and combined                                      | Must       |
| F14 | Sitemap, robots, canonical URLs, structured data                                 | Must       |
| F15 | View counts, used for a "most read" module                                       | Could      |
| F16 | Highlight/quote collection surfaced on the archive page                          | Could      |
| F17 | Reading progress indicator on long-form pages                                    | Should     |
| F18 | Dark mode, respecting `prefers-color-scheme`, with a manual override             | Must       |
| F19 | Redirect management for renamed slugs, editable in the CMS                       | Should     |
| F20 | Optional gated "notebook" area behind auth                                       | Won't (v1) |

### 1.8 Non-functional requirements

| Area          | Requirement                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance   | JS shipped to a reading page ≤ 90 KB gzip. No blocking third-party requests. Self-hosted fonts, subset, `font-display: swap`, preloaded body face only. |
| Rendering     | Static by default (SSG), on-demand revalidation from CMS webhooks, streaming SSR only for `/search`.                                                    |
| Accessibility | WCAG 2.1 AA. Keyboard-complete. Visible focus. Respects `prefers-reduced-motion`. Body text ≥ 18px, measure 60–75 characters.                           |
| SEO           | Server-rendered content, one `h1` per page, semantic landmarks, unique title/description, JSON-LD per type.                                             |
| Security      | CSP with nonces, no `unsafe-inline`. HMAC-verified webhooks. Rate-limited mutations. Server-side validation with Zod on every input.                    |
| Privacy       | Cookieless analytics. No cookie banner needed if you keep it that way — protect this. IP addresses hashed, never stored raw.                            |
| Reliability   | Content survives a CMS outage (static pages already built). p99 uptime via Vercel + static output.                                                      |
| Cost          | ≤ €25/month at launch (see §4.8).                                                                                                                       |

### 1.9 Editorial workflow requirements

1. Draft is created in the CMS; it is invisible to the public and to search engines.
2. A preview link renders the draft inside the real template, behind Next.js `draftMode`.
3. Setting status to `published` with a past `publishedAt` triggers a webhook that revalidates exactly the affected paths.
4. A future `publishedAt` queues the document; a scheduled job publishes it.
5. Editing a published document updates `updatedAt` and optionally records a `revisionNote` shown to readers as _"Updated [date] — [note]"_. This is a trust feature; use it.

---

## 2. Sitemap

```
/                               Home
├── /about                      About
├── /now                        What I'm doing now  (optional, cheap, high-signal)
│
├── /writing                    Writing index — filter, sort, search-in-place
│   ├── /writing/[slug]         Single post
│   ├── /writing/category/[c]   Category archive  (essays, tutorials, reflections, opinions)
│   ├── /writing/tag/[t]        Tag archive
│   └── /writing/series/[s]     Series archive
│
├── /case-studies               Case studies index
│   └── /case-studies/[slug]    Single case study
│
├── /journal                    Learning journal index (reverse-chron, grouped by month)
│   ├── /journal/[slug]         Single entry
│   └── /journal/topic/[t]      Topic archive
│
├── /projects                   Projects index (grid; some link out)
│   └── /projects/[slug]        Project detail (only for projects without a case study)
│
├── /archive                    Everything, filterable by type / category / tag / year
│   └── /archive/[year]         Year view (crawlable, linked from archive)
│
├── /newsletter                 Newsletter landing + past issues
│   ├── /newsletter/[issue]     Archived issue
│   ├── /newsletter/confirm     Double opt-in confirmation result
│   └── /newsletter/unsubscribe One-click unsubscribe result
│
├── /search                     Search results  (?q=&type=&tag=&year=)
├── /contact                    Contact
│
├── /studio                     CMS (auth-gated, noindex)
│
├── /rss.xml  /feed/writing.xml  /feed/journal.xml  /feed.json
├── /sitemap.xml  /robots.txt  /llms.txt
├── /privacy  /colophon         Legal + how the site is made (colophon is on-brand, not filler)
└── /404  /500
```

**URL rules**

| Rule                                                                                      | Reason                                                                          |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| No dates in post URLs                                                                     | Evergreen essays shouldn't look stale.                                          |
| Slugs are immutable once published; renames create a CMS-managed 301                      | Protects links and rankings.                                                    |
| Filters are query params (`?tag=`), facet _pages_ exist only for tag/category/series/year | Avoids infinite crawlable permutations while keeping the useful ones indexable. |
| `/writing/[slug]` not `/blog/[slug]`                                                      | "Blog" undersells the work.                                                     |
| Trailing slashes off, lowercase, hyphenated                                               | One canonical form only.                                                        |

---

## 3. Content Model & Schema

Content lives in **Sanity** (document store, Portable Text body). Application data lives in **Postgres**. The two never overlap: Sanity owns what you write, Postgres owns what readers do.

### 3.1 Document overview

| Document          | Purpose                                                            | Count (est.) |
| ----------------- | ------------------------------------------------------------------ | ------------ |
| `siteSettings`    | Singleton: nav, footer, default SEO, social links, feature flags   | 1            |
| `author`          | You (and future guests)                                            | 1–3          |
| `post`            | Writing: essay / tutorial / reflection / opinion                   | 100+         |
| `caseStudy`       | Deep project breakdown                                             | 5–15         |
| `journalEntry`    | Dated learning note                                                | 300+         |
| `project`         | Compact project record                                             | 10–30        |
| `category`        | Fixed taxonomy, one per post                                       | 4–6          |
| `tag`             | Open taxonomy, many per document                                   | 60+          |
| `series`          | Ordered multi-part group                                           | 5–15         |
| `resource`        | A book/course/talk/repo referenced by journal entries              | 100+         |
| `newsletterIssue` | Archived issue                                                     | 50+          |
| `page`            | About, Contact, Now, Privacy, Colophon — structured, not free HTML | 5            |
| `redirect`        | Old path → new path, editable                                      | as needed    |

### 3.2 Shared objects

| Object        | Fields                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `seo`         | `title` (≤60), `description` (≤155), `ogImage`, `noIndex` (bool), `canonicalOverride`                 |
| `figure`      | `asset`, `alt` (**required**), `caption`, `credit`, `layout` (`inline` \| `wide` \| `full` \| `side`) |
| `metric`      | `label`, `value`, `delta`, `unit`, `note`, `source`                                                   |
| `processStep` | `phase`, `title`, `body` (Portable Text), `artifacts[]` (figure), `duration`                          |
| `link`        | `label`, `href`, `kind` (`internal` \| `external`), `rel`                                             |
| `pullQuote`   | `text`, `attribution`, `emphasis` (bool → renders as a highlight)                                     |
| `codeBlock`   | `language`, `filename`, `code`, `highlightLines`, `caption`                                           |
| `footnote`    | `id`, `body` — rendered as a margin note on wide screens                                              |
| `calloutBox`  | `variant` (`note` \| `warning` \| `aside` \| `update`), `title`, `body`                               |

### 3.3 Field-level schema

#### `post`

| Field           | Type                                     | Rules                                                                                      |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `title`         | string                                   | required, ≤ 90 chars                                                                       |
| `slug`          | slug                                     | required, unique, immutable after publish (warn on change)                                 |
| `kind`          | string                                   | enum: `essay` \| `tutorial` \| `reflection` \| `opinion` — drives label + template accents |
| `excerpt`       | text                                     | required, ≤ 200 chars — used in cards, feeds, meta description fallback                    |
| `body`          | Portable Text                            | blocks + `figure`, `codeBlock`, `pullQuote`, `footnote`, `calloutBox`, `embed`             |
| `coverImage`    | figure                                   | optional; required if `featured` is true                                                   |
| `author`        | ref → author                             | required, default = you                                                                    |
| `category`      | ref → category                           | required, exactly one                                                                      |
| `tags`          | array[ref → tag]                         | 1–6, validated                                                                             |
| `series`        | object `{ ref → series, order: number }` | optional                                                                                   |
| `status`        | string                                   | `draft` \| `inReview` \| `published` \| `archived`                                         |
| `publishedAt`   | datetime                                 | required to publish; future date = scheduled                                               |
| `updatedAt`     | datetime                                 | set by CMS on change                                                                       |
| `revisionNote`  | string                                   | optional, shown to readers                                                                 |
| `readingTime`   | number                                   | **derived** — computed on write, stored for feeds/cards                                    |
| `featured`      | boolean                                  | max 3 enforced by a Studio validation query                                                |
| `relatedManual` | array[ref]                               | overrides the algorithm when set                                                           |
| `canonicalUrl`  | url                                      | if first published elsewhere                                                               |
| `seo`           | seo                                      | optional overrides                                                                         |

#### `caseStudy`

Everything in `post` except `kind`/`category`, plus:

| Field            | Type                                   | Notes                                                 |
| ---------------- | -------------------------------------- | ----------------------------------------------------- |
| `client`         | string                                 | or `"Personal project"`                               |
| `role`           | array[string]                          | e.g. `["Design", "Frontend", "Writing"]`              |
| `timeframe`      | object `{ start, end, ongoing }`       | rendered as `Mar 2025 – Aug 2025`                     |
| `stack`          | array[string]                          | chips                                                 |
| `heroMedia`      | figure \| video                        | above-the-fold                                        |
| `background`     | Portable Text                          | the world before the project                          |
| `problem`        | Portable Text                          | required — the sharpest section, keep it short        |
| `constraints`    | array[string]                          | budget, time, team, tech                              |
| `process`        | array[processStep]                     | ordered; numbering is meaningful here                 |
| `implementation` | Portable Text                          | technical detail, code blocks welcome                 |
| `outcomes`       | Portable Text                          |                                                       |
| `metrics`        | array[metric]                          | 3–6; each needs a `source`                            |
| `learnings`      | array[{ title, body, sentiment }]      | `sentiment`: `worked` \| `didntWork` \| `wouldChange` |
| `gallery`        | array[figure]                          | 4–12, `layout` respected                              |
| `links`          | array[link]                            | live site, repo, writeup                              |
| `testimonial`    | object `{ quote, name, role, avatar }` | optional                                              |
| `relatedPosts`   | array[ref → post]                      |                                                       |

#### `journalEntry`

| Field                   | Type                      | Notes                                                                                       |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `title`                 | string                    | short; if empty, UI falls back to the date                                                  |
| `slug`                  | slug                      | pattern: `YYYY-MM-DD-topic` for natural sorting                                             |
| `entryDate`             | date                      | required — the day the learning happened, not the publish day                               |
| `topics`                | array[ref → tag]          | 1–4                                                                                         |
| `body`                  | Portable Text             | usually short                                                                               |
| `reflection`            | text                      | one paragraph answering _"what changed in how I think?"_ — the point of the whole type      |
| `resources`             | array[ref → resource]     |                                                                                             |
| `codeSnippets`          | array[codeBlock]          |                                                                                             |
| `mood`                  | string                    | enum: `breakthrough` \| `grinding` \| `stuck` \| `curious` — drives a small glyph, no emoji |
| `timeSpent`             | number                    | minutes, optional; enables a yearly total                                                   |
| `relatedEntries`        | array[ref → journalEntry] | plus algorithmic                                                                            |
| `status`, `publishedAt` |                           | as `post`                                                                                   |

#### `project`

`title`, `slug`, `summary`, `year`, `status` (`live` \| `archived` \| `wip`), `stack[]`, `thumbnail` (figure), `links[]`, `caseStudy` (ref, optional), `body` (optional Portable Text), `featured`.

#### `resource`

`title`, `kind` (`book` \| `article` \| `course` \| `video` \| `repo` \| `paper` \| `person`), `url`, `author`, `note` (why it mattered), `rating` (1–5, optional).

#### `newsletterIssue`

`number`, `title`, `sentAt`, `intro`, `body` (Portable Text), `linkedPosts[]`, `subscriberCountAtSend`, `providerId`.

#### `page`

`title`, `slug`, `sections[]` — a constrained union of `richText`, `timeline`, `valuesGrid`, `toolsList`, `contactBlock`, `faq`, `figure`. No arbitrary page builder; five section types is enough and keeps the design coherent.

### 3.4 Validation rules worth enforcing in the Studio

| Rule                                                                 | Why                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| `alt` required on every image except those marked `decorative: true` | Accessibility, enforced at the source not the template |
| `excerpt` required, hard-capped                                      | Prevents ugly card overflow and bad meta descriptions  |
| Max 3 `featured` posts, max 2 `featured` case studies                | Protects the home page composition                     |
| Slug uniqueness across `post` + `caseStudy` + `journalEntry`         | Avoids ambiguity in search results and OG routes       |
| `metrics[].source` required                                          | Keeps case studies honest                              |
| Publish blocked if `seo.description` and `excerpt` are both empty    | SEO floor                                              |
| Warn if `body` word count < 300 on a `post`                          | It's probably a journal entry                          |

### 3.5 Derived / computed fields

Computed on write via a Sanity document action, not at render time:

- `readingTime` — words ÷ 220, rounded up, minimum 1.
- `wordCount` — used in the archive stats and your own yearly review.
- `plainText` — a flattened text version of `body`, used for the search index and OG images.
- `headings[]` — extracted `h2`/`h3` with anchors, used by the margin rail and table of contents.

---

## 4. Recommended Tech Stack

### 4.1 Summary

| Layer           | Choice                                                       | Version                     | Why this one                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js (App Router)**                                     | 15.x                        | Static-first with per-path revalidation, server actions, first-class metadata and OG image generation. React means your existing React Native experience transfers directly.          |
| Language        | **TypeScript**                                               | 5.x, `strict: true`         |                                                                                                                                                                                       |
| UI              | **React**                                                    | 19                          |                                                                                                                                                                                       |
| Styling         | **Tailwind CSS v4** + CSS custom properties for tokens       | 4.x                         | v4's CSS-first config means the design tokens in §4.5 live in one CSS file and are readable by both humans and agents.                                                                |
| Primitives      | **Radix UI** (unstyled)                                      | latest                      | Dialog, Popover, Tabs, Select — accessible behaviour without inheriting someone else's visual identity. Do **not** install a full component kit; this site's value is its typography. |
| Motion          | **Motion** (`motion/react`)                                  | latest                      | Only three animations exist (§4.5); tree-shaken, ~12 KB.                                                                                                                              |
| Content         | **Sanity** (Content Lake + embedded Studio)                  | v4 Studio, API `2024-10-01` | Real-time editing, structured Portable Text, generous free tier, image CDN with transforms, drafts + preview built in.                                                                |
| Content queries | **GROQ** via `next-sanity` + `@sanity/client`                |                             | Typed with `sanity-typegen` → generated TS types from your GROQ strings.                                                                                                              |
| Database        | **Postgres on Neon**                                         | 16                          | Serverless, branching (a DB branch per PR), free tier fits this workload.                                                                                                             |
| ORM             | **Drizzle ORM** + `drizzle-kit`                              | latest                      | SQL-transparent, migrations as files, no runtime cost.                                                                                                                                |
| Search          | **Postgres full-text search** (`tsvector` + GIN + `pg_trgm`) |                             | Zero extra vendors, sub-30ms at this scale, fuzzy fallback for typos. Upgrade path in §4.6.                                                                                           |
| Auth (CMS)      | **Sanity SSO** (GitHub/Google) with project roles            |                             | No auth code to write or secure.                                                                                                                                                      |
| Auth (app)      | **Auth.js v5** — _deferred_                                  |                             | Only if a gated area appears. Do not install it in v1.                                                                                                                                |
| Email           | **Resend** + React Email                                     |                             | Transactional (contact, opt-in) and broadcasts (newsletter) in one vendor with an EU DPA.                                                                                             |
| Newsletter      | **Resend Audiences**                                         |                             | Or Buttondown if you want a hosted archive and web-based composer instead.                                                                                                            |
| Spam            | **Cloudflare Turnstile**                                     |                             | Privacy-preserving, no puzzle, no cookies.                                                                                                                                            |
| Rate limiting   | **Upstash Redis** + `@upstash/ratelimit`                     |                             | Sliding window on contact and subscribe.                                                                                                                                              |
| Media           | **Sanity CDN** + `next/image` custom loader                  |                             | Auto AVIF/WebP, LQIP + palette metadata from Sanity for blur placeholders.                                                                                                            |
| Analytics       | **Vercel Web Analytics** + **Plausible**                     |                             | Both cookieless. Plausible gives referrers/goals; Vercel gives Core Web Vitals from real users.                                                                                       |
| Monitoring      | **Sentry** (browser + server, sampled)                       |                             |                                                                                                                                                                                       |
| Hosting         | **Vercel** (Frankfurt / `fra1`)                              |                             | EU region keeps data local.                                                                                                                                                           |
| CI              | **GitHub Actions**                                           |                             | Typecheck, lint, unit, e2e, Lighthouse CI, axe.                                                                                                                                       |
| Package manager | **pnpm**                                                     |                             |                                                                                                                                                                                       |

### 4.2 Why a headless CMS instead of MDX-in-git

| Criterion                                        | MDX in repo                  | Sanity                                                                  |
| ------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| Write from a phone                               | ✗                            | ✓                                                                       |
| Draft preview in the real template               | Awkward                      | ✓ built in                                                              |
| Image handling                                   | Manual, you optimise by hand | ✓ CDN + transforms + LQIP                                               |
| Scheduled publishing                             | Needs a cron + commit        | ✓                                                                       |
| Structured case studies (metrics, process steps) | Frontmatter spaghetti        | ✓ real objects                                                          |
| Version history                                  | Git (excellent)              | Document history (good)                                                 |
| Cost                                             | €0                           | €0 at this scale                                                        |
| Lock-in                                          | None                         | Moderate — mitigated by `sanity dataset export` in CI weekly (see §7.8) |

The case-study content model is the deciding factor: `metrics[]`, `process[]` and `learnings[]` are structured data, and structured data in frontmatter rots.

### 4.3 Rendering strategy per route

| Route                                                     | Strategy                                            | Revalidation                                      |
| --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| `/`, `/about`, `/now`                                     | SSG                                                 | On-demand webhook + `revalidate: 3600` safety net |
| `/writing`, `/case-studies`, `/journal`, `/projects`      | SSG                                                 | On-demand webhook                                 |
| `/writing/[slug]` etc.                                    | SSG via `generateStaticParams`                      | On-demand webhook for the exact path              |
| `/writing/tag/[t]`, `/category/[c]`, `/journal/topic/[t]` | SSG                                                 | On-demand                                         |
| `/archive`, `/archive/[year]`                             | SSG + client-side filtering over a prefetched index | On-demand                                         |
| `/search`                                                 | Dynamic, streaming, `noindex`                       | —                                                 |
| `/newsletter/[issue]`                                     | SSG                                                 | On-demand                                         |
| `/api/*`                                                  | Node runtime                                        | —                                                 |
| `/studio`                                                 | Client-only, `noindex`                              | —                                                 |

Everything a reader can find via a link is static HTML. The only dynamic page is search.

### 4.4 Repository structure

```
.
├── src/
│   ├── app/
│   │   ├── (site)/                 # public layout: header, footer, skip link
│   │   │   ├── page.tsx            # home
│   │   │   ├── about/page.tsx
│   │   │   ├── writing/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [slug]/page.tsx
│   │   │   │   ├── category/[category]/page.tsx
│   │   │   │   ├── tag/[tag]/page.tsx
│   │   │   │   └── series/[series]/page.tsx
│   │   │   ├── case-studies/…  journal/…  projects/…
│   │   │   ├── archive/page.tsx  archive/[year]/page.tsx
│   │   │   ├── newsletter/…  contact/page.tsx  search/page.tsx
│   │   │   ├── not-found.tsx  error.tsx
│   │   ├── studio/[[...tool]]/page.tsx
│   │   ├── api/
│   │   │   ├── revalidate/route.ts       # Sanity webhook, HMAC verified
│   │   │   ├── search/route.ts
│   │   │   ├── newsletter/{subscribe,confirm,unsubscribe}/route.ts
│   │   │   ├── contact/route.ts
│   │   │   ├── views/[slug]/route.ts
│   │   │   ├── og/route.tsx              # Satori
│   │   │   └── preview/{enable,disable}/route.ts
│   │   ├── rss.xml/route.ts  feed/[type]/route.ts  feed.json/route.ts
│   │   ├── sitemap.ts  robots.ts  manifest.ts
│   │   └── globals.css                   # design tokens live here
│   ├── components/
│   │   ├── primitives/     # Button, Link, Tag, Field, Dialog wrappers
│   │   ├── content/        # PortableText renderers: Figure, CodeBlock, PullQuote, Footnote
│   │   ├── modules/        # PostCard, CaseStudyCard, JournalRow, MarginRail, Filters…
│   │   └── layout/         # Header, Footer, SkipLink, ThemeToggle, Breadcrumbs
│   ├── sanity/
│   │   ├── schemas/{documents,objects}/  ├── lib/{client,image,queries,fetch}.ts
│   │   ├── actions/        # computeDerivedFields, publish guards
│   │   └── structure.ts    # Studio desk layout
│   ├── db/{schema.ts,index.ts,queries/}  ├── drizzle/  # migrations
│   ├── lib/
│   │   ├── seo.ts  jsonld.ts  reading-time.ts  related.ts
│   │   ├── search.ts  rate-limit.ts  validators.ts  analytics.ts
│   ├── emails/             # React Email templates
│   └── styles/typography.css
├── tests/{unit,e2e,a11y}/
├── scripts/{backup-dataset.ts,reindex-search.ts,publish-scheduled.ts}
└── .github/workflows/{ci.yml,backup.yml,scheduled-publish.yml}
```

### 4.5 Design system

The brief asks for minimal, editorial, calm, premium. The trap is that this description produces the same page every time: cream background, big serif display face, warm-clay accent. This direction deliberately goes elsewhere while staying calm and premium.

**Thesis: chrome is software, prose is print.** The interface speaks in a grotesque with mono metadata; the writing itself is set in a book face. The visual world is a marked-up manuscript — blue-black ink on cool exam paper, with a highlighter as the single loud element.

**Colour** — 6 tokens, light mode. Note the paper is _cool_ (blue-grey), not cream.

| Token         | Light           | Dark            | Role                     |
| ------------- | --------------- | --------------- | ------------------------ |
| `--paper`     | `#E6E8EA`       | `#0F1418`       | Page ground              |
| `--surface`   | `#F4F5F6`       | `#171D23`       | Cards, raised blocks     |
| `--ink`       | `#0F1620`       | `#DEE4E9`       | Body text, headings      |
| `--ink-muted` | `#4C5764`       | `#8D9AA8`       | Metadata, captions       |
| `--rule`      | `#C6CCD1`       | `#2A333C`       | Hairlines, borders       |
| `--accent`    | `#1D3FA8`       | `#93AAFF`       | Links, active state      |
| `--highlight` | `#EDE05F` @ 45% | `#EDE05F` @ 22% | **The one loud element** |

`--highlight` appears in exactly five places and nowhere else: search-result matches, `::selection`, the reading-progress fill in the margin rail, the active filter chip, and `pullQuote` with `emphasis: true`. That restraint is what makes it read as a highlighter pen rather than a brand colour.

**Type** — an inversion of the expected pairing:

| Role             | Face                               | Usage                                                                                          |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Display / chrome | **Bricolage Grotesque** (variable) | Page titles, nav, buttons, card titles. Tight tracking at large sizes, optical-size axis used. |
| Body / prose     | **Literata** (variable)            | Article body only. 19px / 1.62, measure 66ch.                                                  |
| Utility / data   | **IBM Plex Mono**                  | Dates, reading time, tags, metrics, footnote markers, code.                                    |

Scale (fluid, `clamp()`): `12 / 14 / 16 / 19 / 22 / 27 / 34 / 44 / 58 / 76`. Prose uses 19 and 22 only. Display uses 34+ and never appears inside body copy.

**Layout** — a 12-column grid at ≥1024px, but article pages use a named 3-track grid: `[rail 6rem] [prose 66ch] [margin 16rem]`. The margin track holds footnotes and figures with `layout: side`; below 1024px both side tracks collapse and footnotes become inline disclosures.

**Signature element — the Margin Rail.** A persistent hairline on the left of every long-form page carrying, top to bottom: the reading-progress fill in highlighter yellow; a `¶` marker per `h2` that scroll-links to the section and lights up when active; footnote and margin-note tick marks positioned at their real document offsets. It encodes actual document structure — do not add markers that don't correspond to something in the text. On mobile it becomes a 2px top progress line plus a `¶ Sections` bottom sheet.

**Motion** — three, total:

1. Article load: rail draws down (240ms), then content fades up staggered 40ms per block. Once, on first paint only.
2. Reading progress: scroll-linked highlighter fill, `transform` only.
3. Hover on cards: the hairline rule beneath the title extends left-to-right over 180ms. No lift, no shadow, no scale.

All three are wrapped in `@media (prefers-reduced-motion: reduce)` and reduced to instant state changes.

**What this direction refuses:** drop shadows, glassmorphism, gradients, rounded cards (radius is `0` on cards, `2px` on inputs and chips), emoji, icon-heavy UI, and hero images of laptops.

### 4.6 Search design

Phase 1, Postgres:

```sql
-- search_documents is populated by the Sanity webhook (see §5.4)
ALTER TABLE search_documents ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')),      'A') ||
    setweight(to_tsvector('english', coalesce(excerpt,'')),    'B') ||
    setweight(to_tsvector('english', coalesce(tags_text,'')),  'B') ||
    setweight(to_tsvector('english', coalesce(body_text,'')),  'C')
  ) STORED;

CREATE INDEX search_documents_tsv_idx   ON search_documents USING GIN (tsv);
CREATE INDEX search_documents_trgm_idx  ON search_documents USING GIN (title gin_trgm_ops);
```

Query: `websearch_to_tsquery` for the main ranking (`ts_rank_cd`), with `ts_headline` producing the excerpt that the UI renders as highlighter marks. If the tsquery returns fewer than 3 rows, fall back to a trigram similarity query on `title` so typos still find things. Facets (`type`, `tag`, `year`) are plain `WHERE` clauses with counts from a single grouped query.

Upgrade trigger: > 2,000 documents, or you want typo tolerance and instant-as-you-type across the body. Then move to **Typesense Cloud**, keeping the same `search_documents` table as the source of truth for reindexing. Do not start there.

### 4.7 SEO, feeds & structured data

| Item             | Implementation                                                                                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titles           | `generateMetadata` per route. Pattern: `{title} — [Your Name]`; home is `[Your Name] — Writer on [themes]`.                                                                                                                                              |
| Descriptions     | `seo.description` → `excerpt` → first 155 chars of `plainText`.                                                                                                                                                                                          |
| Canonical        | Absolute, self-referencing; `canonicalUrl` field wins when the piece was published elsewhere first.                                                                                                                                                      |
| Open Graph       | `/api/og?slug=…&type=…` renders with Satori: title in Bricolage, kind + date in Plex Mono, on `--paper`, with a highlighter swipe under the title. Cached immutably by slug + `updatedAt`.                                                               |
| JSON-LD          | `Person` + `WebSite` (+ `SearchAction`) on home; `BlogPosting` on posts; `Article` + `CreativeWork` on case studies; `BlogPosting` on journal; `BreadcrumbList` on all nested pages; `CollectionPage` + `ItemList` on indexes; `ContactPage` on contact. |
| Feeds            | `/rss.xml` (everything), `/feed/writing.xml`, `/feed/journal.xml`, `/feed.json`. Full content in Writing feeds — it builds trust and readers come back anyway.                                                                                           |
| Sitemap          | `app/sitemap.ts`, generated from Sanity, with `lastModified` from `updatedAt`. Excludes `/search`, `/studio`, thank-you pages.                                                                                                                           |
| robots.txt       | Allows all; disallows `/studio`, `/api`, `/search`. Links the sitemap.                                                                                                                                                                                   |
| `llms.txt`       | A plain-text map of the site plus your themes. Cheap, increasingly useful.                                                                                                                                                                               |
| Internal linking | Every post ends with 3 related items; every tag/category page links up to its index. Orphan pages are a build-time lint error.                                                                                                                           |
| Redirects        | `redirect` documents → generated `next.config.ts` redirects at build, plus a middleware fallback for post-build additions.                                                                                                                               |

### 4.8 Cost model

| Service   | Tier                                      | Monthly       |
| --------- | ----------------------------------------- | ------------- |
| Vercel    | Hobby (or Pro if you need EU-only + team) | €0 (€20)      |
| Sanity    | Free (2 users, 10k docs, 100k API req)    | €0            |
| Neon      | Free (0.5 GB)                             | €0            |
| Upstash   | Free (10k cmd/day)                        | €0            |
| Resend    | Free (3k emails/mo, 1 domain)             | €0            |
| Plausible | Growth 10k                                | €9            |
| Sentry    | Developer                                 | €0            |
| Domain    |                                           | ~€1           |
| **Total** |                                           | **€10 – €30** |

---

## 5. Database & Backend Design

### 5.1 Division of responsibility

```
Sanity Content Lake            Postgres (Neon)
─────────────────────          ────────────────────────
posts, case studies,           subscribers, contact messages,
journal, projects,             page views, search index,
taxonomy, pages,               webhook log, scheduled jobs
newsletter archive
        │                              ▲
        └── webhook on publish ────────┘  (upserts search_documents)
```

If Postgres is down, the site still serves every page; only search, subscribe and contact degrade. Design the UI for that: a search failure shows _"Search is unavailable. Browse the archive instead →"_, not a spinner.

### 5.2 Postgres schema (DDL)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Newsletter ────────────────────────────────────────────────
CREATE TYPE subscriber_status AS ENUM ('pending','confirmed','unsubscribed','bounced','complained');

CREATE TABLE subscribers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             citext NOT NULL UNIQUE,
  status            subscriber_status NOT NULL DEFAULT 'pending',
  confirm_token     text UNIQUE,
  confirm_expires_at timestamptz,
  unsubscribe_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  source            text,                      -- 'home' | 'post:slug' | 'newsletter-page' | 'footer'
  referrer_path     text,
  provider_id       text,                      -- Resend contact id
  ip_hash           text,                      -- sha256(ip + salt); never store raw IPs
  user_agent_family text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz
);
CREATE INDEX subscribers_status_idx ON subscribers (status, created_at DESC);

CREATE TABLE subscriber_events (
  id          bigserial PRIMARY KEY,
  subscriber_id uuid REFERENCES subscribers(id) ON DELETE CASCADE,
  event       text NOT NULL,                   -- requested|confirmed|unsubscribed|bounced|complained|resent
  meta        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Contact ───────────────────────────────────────────────────
CREATE TYPE contact_status AS ENUM ('new','read','replied','spam','archived');

CREATE TABLE contact_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  email        citext NOT NULL,
  subject      text,
  topic        text,                            -- 'collaboration'|'writing'|'speaking'|'question'|'other'
  message      text NOT NULL,
  status       contact_status NOT NULL DEFAULT 'new',
  spam_score   real,
  ip_hash      text,
  referrer_path text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  replied_at   timestamptz
);
CREATE INDEX contact_messages_status_idx ON contact_messages (status, created_at DESC);

-- ─── Analytics (own, minimal, aggregate-only) ──────────────────
CREATE TABLE page_views (
  path       text NOT NULL,
  day        date NOT NULL,
  views      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (path, day)
);                                   -- UPSERT with views = page_views.views + 1

CREATE MATERIALIZED VIEW content_popularity AS
  SELECT path, sum(views) AS views_30d
  FROM page_views WHERE day > current_date - 30
  GROUP BY path;
CREATE UNIQUE INDEX content_popularity_path_idx ON content_popularity (path);

-- ─── Search index (projection of Sanity) ───────────────────────
CREATE TABLE search_documents (
  id           text PRIMARY KEY,               -- sanity _id
  type         text NOT NULL,                  -- post|caseStudy|journalEntry|project|page
  kind         text,                           -- essay|tutorial|reflection|opinion
  slug         text NOT NULL,
  path         text NOT NULL,
  title        text NOT NULL,
  excerpt      text,
  body_text    text,
  tags_text    text,
  category     text,
  published_at timestamptz,
  year         smallint,
  reading_time smallint,
  cover_url    text,
  updated_at   timestamptz NOT NULL DEFAULT now()
  -- tsv column + indexes as in §4.6
);
CREATE INDEX search_documents_facets_idx ON search_documents (type, year, published_at DESC);

CREATE TABLE search_queries (               -- what readers look for = your editorial calendar
  id bigserial PRIMARY KEY,
  q text NOT NULL, results_count int NOT NULL,
  clicked_path text, created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Ops ───────────────────────────────────────────────────────
CREATE TABLE webhook_deliveries (
  id bigserial PRIMARY KEY,
  source text NOT NULL, event_id text UNIQUE,   -- idempotency key
  payload jsonb NOT NULL, status text NOT NULL,
  error text, created_at timestamptz NOT NULL DEFAULT now()
);
```

### 5.3 Index & performance notes

| Query                | Index used                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| Search with facets   | `search_documents_tsv_idx`, then filter on `search_documents_facets_idx` |
| Typo fallback        | `search_documents_trgm_idx`                                              |
| Archive year view    | `search_documents_facets_idx` (type, year)                               |
| Most read module     | `content_popularity` (refreshed nightly, `CONCURRENTLY`)                 |
| Subscriber dashboard | `subscribers_status_idx`                                                 |

Connection handling: Neon serverless driver over HTTP for one-shot queries in server actions; no pooling problems, no `pg` in the edge runtime.

### 5.4 API routes & server actions

Prefer **server actions** for anything triggered by a form the reader submits, and **route handlers** for anything a machine calls.

| Endpoint / action                  | Method | Auth                           | Rate limit                   | Validation                                                    | Notes                                                                                              |
| ---------------------------------- | ------ | ------------------------------ | ---------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `subscribeToNewsletter` (action)   | —      | public                         | 5 / 10 min / IP-hash         | Zod: email, honeypot empty, Turnstile token, `source`         | Insert `pending`, send opt-in email, always return the same success message (no email enumeration) |
| `GET /api/newsletter/confirm`      | GET    | token                          | 20/hr                        | token exists, not expired                                     | Sets `confirmed`, creates Resend contact, redirects to `/newsletter/confirm`                       |
| `GET /api/newsletter/unsubscribe`  | GET    | token                          | —                            | token                                                         | One click, no login, no confirmation step. Also handles `List-Unsubscribe=One-Click` POST          |
| `sendContactMessage` (action)      | —      | public                         | 3 / hr / IP-hash             | Zod: name 2–80, email, message 20–5000, topic enum, Turnstile | Store + email you via Resend; reply-to = sender                                                    |
| `GET /api/search`                  | GET    | public                         | 30 / min                     | `q` ≤ 120 chars, facets enum                                  | Returns `{results, facets, total, tookMs}`; logs to `search_queries`                               |
| `POST /api/revalidate`             | POST   | HMAC (`SANITY_WEBHOOK_SECRET`) | —                            | signature + `event_id` idempotency                            | Revalidates affected paths **and** upserts `search_documents`. See below.                          |
| `POST /api/views/[slug]`           | POST   | public                         | 1 / 30 min / (IP-hash, path) | path exists in `search_documents`                             | Fire-and-forget from a client effect; failure is silent                                            |
| `GET /api/og`                      | GET    | public                         | —                            | `slug`, `type`                                                | Satori; `Cache-Control: public, immutable, max-age=31536000` keyed on `updatedAt`                  |
| `GET /api/preview/enable`          | GET    | Sanity session                 | —                            | `secret`, `slug`                                              | `draftMode().enable()`, redirect to the path                                                       |
| `POST /api/cron/publish-scheduled` | POST   | `CRON_SECRET`                  | —                            | —                                                             | Vercel Cron hourly: publish docs whose `publishedAt` has passed                                    |
| `POST /api/cron/nightly`           | POST   | `CRON_SECRET`                  | —                            | —                                                             | Refresh `content_popularity`, expire stale opt-in tokens, dataset backup                           |

**Revalidation handler logic** (the one piece of backend that must be exactly right):

```ts
// src/app/api/revalidate/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  if (!(await isValidSignature(body, req.headers.get(SIGNATURE_HEADER_NAME), SECRET)))
    return new Response("Invalid signature", { status: 401 });

  const doc = JSON.parse(body) as {
    _id: string;
    _type: string;
    slug?: { current: string }; /* … */
  };
  if (await alreadyProcessed(doc._rev)) return Response.json({ skipped: true });

  const paths = pathsFor(doc); // e.g. ['/writing/x', '/writing', '/', '/archive', '/writing/tag/react']
  const tags = tagsFor(doc); // e.g. ['post', 'post:x', 'tag:react', 'sitemap']

  paths.forEach(revalidatePath);
  tags.forEach(revalidateTag);

  if (isIndexable(doc._type)) await upsertSearchDocument(doc);
  if (doc.status !== "published") await deleteSearchDocument(doc._id);

  await recordDelivery(doc._rev, "ok");
  return Response.json({ revalidated: paths });
}
```

`pathsFor` must include: the document path, its type index, `/`, `/archive`, `/archive/[year]`, every tag/category/series page it belongs to, **and** the previous versions of those if taxonomy changed. Getting this wrong shows up as stale tag pages — add a nightly full revalidate as a safety net.

### 5.5 Admin & editing workflow

**Studio structure** (`src/sanity/structure.ts`) — organise the desk by workflow, not by document type:

```
📥 Needs attention   → drafts, in review, scheduled, missing alt text, missing excerpt
✍️  Writing          → by status, then by category
🧪 Case studies
📓 Journal           → grouped by month
🧰 Projects
🏷  Taxonomy         → categories, tags (with usage counts), series, resources
✉️  Newsletter        → issues
📄 Pages
⚙️  Settings          → siteSettings singleton, redirects
```

**Lifecycle**

| Stage       | Who    | What happens                                                                                                                                               |
| ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `draft`     | Author | Autosaved. Excluded from all public queries by `status == "published" && publishedAt <= now()`.                                                            |
| Preview     | Author | "Open preview" document action → `/api/preview/enable?secret=…&slug=…` → real template with draft data, banner: _"Preview — not published"_ + Exit button. |
| `inReview`  | Author | Optional self-discipline stage. Studio shows a checklist: alt text, excerpt, tags, cover, SEO description, ≥1 internal link.                               |
| `published` | Author | Publish action runs `computeDerivedFields` (reading time, word count, plain text, headings), then Sanity publishes → webhook → revalidate + index.         |
| Scheduled   | Cron   | `publishedAt` in the future stays hidden; hourly cron flips it and triggers revalidation.                                                                  |
| Update      | Author | `updatedAt` bumped; if `revisionNote` set, the article renders _"Updated 12 Mar 2026 — clarified the caching section"_.                                    |
| `archived`  | Author | 200 with a notice banner (_"This is an old piece I no longer fully agree with"_) — better than a 404 for links that exist in the wild.                     |

**Role-based access** (Sanity project roles; configure now even as a solo author):

| Role          | Can                                                           |
| ------------- | ------------------------------------------------------------- |
| Administrator | Everything, including settings, redirects, dataset export     |
| Editor        | Create/edit/publish all content; cannot change `siteSettings` |
| Contributor   | Create/edit own drafts; **cannot publish**                    |
| Viewer        | Read-only, for a proofreader                                  |

### 5.6 Media & image handling

| Concern       | Approach                                                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Upload        | Sanity asset pipeline; originals kept, never overwritten                                                                                                     |
| Delivery      | `cdn.sanity.io` with `?w=&q=75&fm=webp&fit=max&auto=format`                                                                                                  |
| Next.js       | Custom `next/image` loader that maps `width`/`quality` onto Sanity params — avoids double-processing through Vercel's optimiser                              |
| Placeholders  | Sanity's LQIP base64 → `placeholder="blur"`; dominant colour available for a solid fallback                                                                  |
| Art direction | `figure.layout` drives `sizes`: `inline` → `(min-width:1024px) 66ch, 100vw`; `wide` → `(min-width:1024px) 1080px, 100vw`; `full` → `100vw`; `side` → `256px` |
| Hotspot/crop  | Sanity hotspot honoured on all cards so faces never get cropped badly                                                                                        |
| Alt text      | Required at the schema level; the renderer throws in dev if missing                                                                                          |
| Aspect ratio  | Always render `width`/`height` from asset metadata → zero CLS                                                                                                |
| Video         | Case-study heroes only; `<video muted loop playsinline preload="metadata">` with a poster, paused under `prefers-reduced-motion`                             |
| Budget        | Cover images ≤ 200 KB served; gallery images ≤ 300 KB; lint in CI via a Lighthouse budget                                                                    |

### 5.7 Analytics & instrumentation

Cookieless, so no consent banner is required — treat that as a feature to protect.

| Event                                        | Where                                 | Why                                  |
| -------------------------------------------- | ------------------------------------- | ------------------------------------ |
| `page_view`                                  | Plausible + own `page_views`          | Baseline                             |
| `scroll_depth` (25/50/75/100)                | Plausible custom event                | G1                                   |
| `newsletter_subscribe` (with `source`)       | Plausible goal + `subscribers.source` | G2 — tells you _which post_ converts |
| `case_study_section_view` (Outcomes)         | Plausible custom event                | G3                                   |
| `search_performed` / `search_result_clicked` | `search_queries`                      | Editorial planning                   |
| `contact_submitted`                          | Plausible goal                        | G4                                   |
| `outbound_click`                             | Plausible                             | Which projects people actually open  |
| Web Vitals                                   | Vercel Analytics                      | G6                                   |

### 5.8 Security

CSP with per-request nonces (`script-src 'self' 'nonce-…' plausible.io; img-src 'self' cdn.sanity.io data:; frame-ancestors 'none'`) · HSTS · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy` denying camera/mic/geolocation · Zod on every input, server-side, no exceptions · Turnstile + honeypot + rate limit on both public forms · HMAC on webhooks with replay protection via `_rev` · secrets only in Vercel env, never in `NEXT_PUBLIC_*` unless genuinely public · Studio behind Sanity SSO, `noindex`, and `X-Robots-Tag`.

### 5.9 Test strategy

| Layer         | Tool                                                                                                  | Scope                                                                                                                                  | Gate                  |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Static        | `tsc --noEmit`, ESLint, Prettier                                                                      | Whole repo                                                                                                                             | Blocks merge          |
| Unit          | **Vitest**                                                                                            | `reading-time`, `related`, `seo`, `jsonld`, `pathsFor`, Zod validators, Portable Text serialisers                                      | ≥ 80% on `src/lib`    |
| Component     | Vitest + Testing Library                                                                              | PostCard, Filters, MarginRail, NewsletterForm (states: idle/loading/error/success/already-subscribed)                                  | Blocks merge          |
| Contract      | Vitest                                                                                                | GROQ queries against a seeded Sanity dataset; assert generated types match                                                             | Blocks merge          |
| Integration   | Vitest + Neon branch                                                                                  | Server actions and route handlers against a real ephemeral DB (subscribe → confirm → unsubscribe; search ranking; webhook idempotency) | Blocks merge          |
| E2E           | **Playwright** (Chromium, WebKit, mobile viewport)                                                    | See flows below                                                                                                                        | Blocks deploy to prod |
| Accessibility | `@axe-core/playwright` on all 14 templates + keyboard-only walkthrough of nav, filters, dialog, forms | 0 serious/critical violations                                                                                                          | Blocks deploy         |
| Visual        | Playwright screenshots on 6 key templates, light + dark, 3 widths                                     | Manual approval on diff                                                                                                                | Warns                 |
| Performance   | Lighthouse CI on `/`, `/writing/[slug]`, `/case-studies/[slug]`, `/archive`                           | Perf ≥ 95, A11y = 100, SEO = 100, budget: JS ≤ 90 KB                                                                                   | Blocks deploy         |
| Content       | Custom script                                                                                         | No orphan pages, no missing alt, no broken internal links, every published doc in `search_documents`                                   | Nightly, warns        |

**Critical E2E flows**: read an article end-to-end incl. margin rail and footnotes · filter the archive by tag + year and land on a valid result · search with a typo and still find the piece · subscribe → confirm via emailed link → unsubscribe in one click · submit contact form (happy path, validation errors, rate-limited) · draft preview shows unpublished content while the public URL 404s · dark-mode toggle persists across navigation · 404 page offers search and recent posts.

### 5.10 Deployment

**One-time setup**

1. `pnpm create next-app@latest` → TypeScript, App Router, Tailwind. Commit.
2. Create the Sanity project (`pnpm create sanity@latest` inside the app, dataset `production`, second dataset `development`). Set region EU.
3. Create the Neon project, EU region. Create branches: `main` (prod) and `dev`.
4. `pnpm drizzle-kit generate && pnpm drizzle-kit migrate` against `dev`, then `main`.
5. Create Resend account, verify the sending domain (SPF, DKIM, DMARC records), create an Audience.
6. Create Upstash Redis (EU), Cloudflare Turnstile site, Plausible site, Sentry project.
7. Import the repo into Vercel. Set region `fra1`. Add all env vars from §5.11 for Production / Preview / Development separately.
8. Add the Sanity webhook: `POST https://[domain]/api/revalidate`, filter `_type in ["post","caseStudy","journalEntry","project","page","siteSettings","tag","category","series"]`, include drafts = false, secret = `SANITY_WEBHOOK_SECRET`.
9. Add Vercel Cron: `/api/cron/publish-scheduled` hourly, `/api/cron/nightly` at 03:00 UTC.
10. Point DNS at Vercel. Verify HTTPS, HSTS, and that `www` 301s to apex (or the reverse — pick one).
11. Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.

**Per-change flow**

```
feature branch → PR
  ├── CI: typecheck, lint, unit, component, contract, integration (Neon branch)
  ├── Vercel Preview deploy (uses Sanity `development` dataset)
  ├── Playwright + axe + Lighthouse CI against the preview URL
  └── merge → production deploy → smoke test (§9.2)
```

Rollback: Vercel instant rollback to the previous deployment. Content rollback: Sanity document history → restore revision.

### 5.11 Environment variables

| Variable                                | Scope  | Example / notes                                                  |
| --------------------------------------- | ------ | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | all    | `https://yourdomain.com` — used by feeds, sitemap, canonical, OG |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`         | all    | public by design                                                 |
| `NEXT_PUBLIC_SANITY_DATASET`            | all    | `production` / `development`                                     |
| `NEXT_PUBLIC_SANITY_API_VERSION`        | all    | `2024-10-01` — pin it                                            |
| `SANITY_API_READ_TOKEN`                 | server | viewer token, needed for draft preview                           |
| `SANITY_API_WRITE_TOKEN`                | server | derived fields + scheduled publish                               |
| `SANITY_WEBHOOK_SECRET`                 | server | HMAC                                                             |
| `SANITY_PREVIEW_SECRET`                 | server | preview link guard                                               |
| `DATABASE_URL`                          | server | Neon pooled connection string                                    |
| `DATABASE_URL_UNPOOLED`                 | server | migrations                                                       |
| `RESEND_API_KEY`                        | server |                                                                  |
| `RESEND_AUDIENCE_ID`                    | server |                                                                  |
| `EMAIL_FROM`                            | server | `[Your Name] <hello@yourdomain.com>`                             |
| `EMAIL_TO_CONTACT`                      | server | where contact messages land                                      |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN`     | server | rate limiting                                                    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`        | all    |                                                                  |
| `TURNSTILE_SECRET_KEY`                  | server |                                                                  |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`          | all    |                                                                  |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | both   |                                                                  |
| `SENTRY_AUTH_TOKEN`                     | CI     | source maps                                                      |
| `IP_HASH_SALT`                          | server | rotate yearly; ≥ 32 random bytes                                 |
| `CRON_SECRET`                           | server | Vercel Cron auth                                                 |
| `NEXT_PUBLIC_ENABLE_VIEW_COUNTS`        | all    | feature flag                                                     |

---

## 6. Page-by-Page UX Plan

Every page below follows the same seven-part structure: layout · section order · copy · components · responsive · SEO · accessibility.

Breakpoints used throughout: `sm 480` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`.

### 6.0 Global shell

**Header** — sticky, 56px, `--paper` at 92% with `backdrop-filter: blur(8px)`, single hairline bottom border. Left: your name in Bricolage Grotesque 16/600 (not a logo mark). Right: `Writing · Case studies · Journal · Projects · About` in 14px, then a search button (⌘K) and a theme toggle. The active section's label carries a 2px highlighter underline.

**Footer** — four columns at `lg`, stacked at `sm`: (1) name + one-line description + subscribe field; (2) content links; (3) elsewhere (X, Bluesky, GitHub, LinkedIn, RSS); (4) meta (Archive, Colophon, Privacy, `llms.txt`). Bottom line: `© 2026 [Your Name] · Built with care in Rotterdam · Set in Literata & Bricolage Grotesque`.

**Command palette** (⌘K / `/`) — Radix Dialog. Recent posts by default; typing hits `/api/search` debounced at 200ms; results show type chip + highlighted match. Escape closes, focus returns to the trigger.

Global components: `SkipLink` (first focusable, "Skip to content"), `Header`, `Nav`, `SearchTrigger`, `CommandPalette`, `ThemeToggle`, `Footer`, `SubscribeInline`, `Breadcrumbs`, `Prose`, `PageHeader`.

---

### 6.1 Home — `/`

**1. Layout structure**

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
├──────────────────────────────────────────────────────────────┤
│  STATEMENT                                    (full bleed)   │
│  ┌───────────────────────────────────────┐                   │
│  │ I build software and write about      │   [portrait,       │
│  │ what it teaches me.                   │    b/w, 4:5,       │
│  │                                        │    right column]  │
│  │ ~ 3-line intro paragraph ~             │                   │
│  │ [Read the writing →] [Subscribe]       │                   │
│  └───────────────────────────────────────┘                   │
├──────────────────────────────────────────────────────────────┤
│  CURRENTLY  ─── a single mono line, hairline above and below  │
├──────────────────────────────────────────────────────────────┤
│  SELECTED WRITING            (1 lead + 2 secondary, 8-col)   │
├──────────────────────────────────────────────────────────────┤
│  CASE STUDIES               (2 wide horizontal cards)        │
├──────────────────────────────────────────────────────────────┤
│  FROM THE JOURNAL           (5 dense rows: date · title · ¶) │
├──────────────────────────────────────────────────────────────┤
│  SUBSCRIBE                  (full-width, --surface)          │
├──────────────────────────────────────────────────────────────┤
│ FOOTER                                                       │
└──────────────────────────────────────────────────────────────┘
```

The hero is a **statement, not a marketing headline** — one sentence that could only be said by you, set at 58–76px, with the portrait treated as a document (b/w, no rounded corners, hairline border) rather than a hero image.

**2. Section order** — Statement → Currently → Selected writing → Case studies → Journal → Subscribe. Reason: a first-time reader needs _who_ (2s), _what's good_ (10s), _proof_ (30s), _keep in touch_ (exit intent). Nothing between the statement and the writing.

**3. Copy suggestions**

| Slot                     | Copy                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1                       | _"I build software and write about what it teaches me."_ — alt: _"Notes from the middle of the work."_                                                                                                       |
| Intro                    | _"I'm [Your Name], a [role] in Rotterdam. I write essays about craft and attention, break down the projects I ship, and keep a public journal of what I'm learning — including the parts that didn't work."_ |
| Primary CTA              | `Read the writing` (not "Explore" or "Learn more")                                                                                                                                                           |
| Currently                | `CURRENTLY — Reading [book] · Building [thing] · Learning [topic]`                                                                                                                                           |
| Selected writing eyebrow | `SELECTED WRITING` + `All writing →`                                                                                                                                                                         |
| Case studies eyebrow     | `CASE STUDIES — how things actually got built`                                                                                                                                                               |
| Journal eyebrow          | `FROM THE JOURNAL — thinking out loud, unedited on purpose`                                                                                                                                                  |
| Subscribe heading        | _"A letter every other Sunday."_                                                                                                                                                                             |
| Subscribe sub            | _"One essay, three things I read, and whatever I'm stuck on. No growth tactics. Unsubscribe in one click."_                                                                                                  |
| Subscribe button         | `Subscribe` → success state: `Check your inbox to confirm.`                                                                                                                                                  |

**4. Component list** — `Statement`, `PortraitFrame`, `CurrentlyStrip`, `SectionHeader` (eyebrow + link), `FeaturedPostCard` (lead variant), `PostCard` (compact), `CaseStudyCardWide`, `JournalRow`, `SubscribeBlock`, `Button`, `Tag`.

**5. Responsive** — `< md`: single column; portrait moves above the H1 at 60% width, left-aligned; H1 drops to 34–40px; Currently becomes a two-line wrap; case-study cards stack vertically with the image on top; journal rows lose the excerpt and keep date + title. `md–lg`: 2-col for writing, statement still full width. `≥ lg`: as drawn. `≥ 2xl`: max content width 1280px, gutters grow, type does not.

**6. SEO** — Title `[Your Name] — Writer & [role]`. Description names the three content types and two themes. JSON-LD `Person` (with `sameAs` socials, `jobTitle`, `knowsAbout`) + `WebSite` with `potentialAction: SearchAction`. Only one `h1`. All featured items are real crawlable links, not JS-only cards. Portrait has a descriptive alt. Preload the Literata subset and the LCP portrait image.

**7. Accessibility** — Statement is the `h1`; each section has an `h2` even where the eyebrow is visually small (use `aria-labelledby` on `<section>`). Cards are linked by their title, with a stretched pseudo-element for the click target rather than nested links — one link per card, one accessible name. Currently strip is a `<p>`, not a marquee. Subscribe field has a visible `<label>`, `aria-describedby` for the privacy line, and `aria-live="polite"` on the result message. Focus ring: 2px `--accent` with 2px offset, never removed.

---

### 6.2 About — `/about`

**1. Layout** — Single 8-column measure with the portrait breaking into the margin at `lg`. Sections separated by full-width hairlines, each with a mono eyebrow in the left rail.

**2. Section order** — Opening (who you are, in your voice, not third person) → What I write about (3–4 themes) → How I work / tools → Timeline → Values → Reading now → Contact + subscribe CTA.

**3. Copy suggestions**

| Slot             | Copy                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1               | `About` — with a subhead: _"The long version."_                                                                                                                           |
| Opening          | _"I've spent [N] years building [X]. Somewhere in there I realised the writing wasn't a break from the work — it was how I understood it. This site is where both live."_ |
| Themes eyebrow   | `WHAT I KEEP COMING BACK TO`                                                                                                                                              |
| Theme item       | `Craft under constraint` — _"Most interesting decisions happen when you can't have everything."_ (repeat for 3–4)                                                         |
| Tools eyebrow    | `WHAT I WORK WITH` — grouped: `Build · Write · Think`                                                                                                                     |
| Tools note       | _"Tools are not the point, but people always ask."_                                                                                                                       |
| Timeline eyebrow | `A ROUGH TIMELINE`                                                                                                                                                        |
| Timeline entry   | `2024 — Shipped [project] to [N] users. Learned that [one honest lesson].`                                                                                                |
| Values eyebrow   | `WHAT I BELIEVE ABOUT THE WORK`                                                                                                                                           |
| Value            | `Finish things.` — _"An unfinished piece teaches you almost nothing."_                                                                                                    |
| Closing          | _"If any of this resonates, [write to me] — I answer every email that isn't a pitch."_                                                                                    |

**4. Components** — `PageHeader`, `Prose`, `ThemeList`, `ToolsGrid` (grouped definition list), `Timeline` (real `<ol>`; year as mono marker in the rail), `ValuesGrid` (2×2, no icons — the statement carries it), `ReadingNow`, `ContactCTA`, `SubscribeBlock`.

**5. Responsive** — Portrait full-width above the opening at `< lg`. Timeline rail collapses: year moves inline above each entry. Values grid → single column. Tools grid 3 → 1 column with headings retained.

**6. SEO** — Title `About — [Your Name]`. Description in first person, 150 chars. JSON-LD `ProfilePage` + `Person` with `alumniOf`, `worksFor`, `knowsAbout` from your themes. This page should rank for `[Your Name]` — mention your name in the first sentence and in an image alt. Internal links to at least one piece per theme.

**7. Accessibility** — Timeline is an ordered list with `<time datetime>`; do not fake it with divs. Tools use `<dl>`/`<dt>`/`<dd>`. No text over images. Colour is never the only signal for the value cards (each has a heading).

---

### 6.3 Writing index — `/writing`

**1. Layout** — Page header with a one-line promise, then a sticky filter bar (hairline top/bottom), then a list. **List, not a grid**: full-width rows, each `title / excerpt / meta`, with a small 3:2 thumbnail on the right at `≥ md`. Rows are 140–180px tall with generous whitespace; hairline between rows. Lead item (most recent or featured) gets a larger treatment with a wide image.

**2. Section order** — Header + promise → Filters (kind, category, tag, sort) → Lead item → List (12 per page) → Pagination ("Load more" is a `<button>` that appends, with real `?page=` links behind it for crawlers) → Subscribe.

**3. Copy**

| Slot                  | Copy                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| H1                    | `Writing`                                                                                          |
| Promise               | _"Essays, tutorials and arguments. [N] pieces, oldest first if you like."_                         |
| Filter labels         | `All · Essays · Tutorials · Reflections · Opinions` then `Sort: Newest · Oldest · Longest reads`   |
| Active filter summary | `Showing 8 essays tagged "attention"` + `Clear`                                                    |
| Empty state           | _"Nothing here yet with those filters. [Clear them] or [try the archive] — it goes back further."_ |
| Row meta              | `12 min · Essay · 4 Mar 2026`                                                                      |

**4. Components** — `PageHeader`, `FilterBar` (`FilterChip`, `SortSelect`, `ResultCount`, `ClearFilters`), `LeadPostCard`, `PostRow`, `Pagination`, `EmptyState`, `SubscribeBlock`.

**5. Responsive** — Filters: horizontal scroll with a fade mask at `< md` (never a dropdown-only pattern — visible chips teach the taxonomy). Thumbnails hidden below `md`. Lead item collapses to a standard row below `md`. At `≥ xl` the filter bar moves into a left sidebar that scrolls with the page and the list gets a wider measure.

**6. SEO** — Title `Writing — Essays, tutorials and arguments — [Your Name]`. Filters are query params with `rel="canonical"` back to `/writing`; the _facet pages_ (`/writing/tag/x`) are indexable with their own titles and 40–80 words of intro copy so they aren't thin. `CollectionPage` + `ItemList` JSON-LD with `position`. Paginated pages get `noindex,follow` past page 1 and self-canonical `?page=n` links for crawl.

**7. Accessibility** — Filter chips are toggle buttons with `aria-pressed`; the result count is `aria-live="polite"` so screen-reader users hear the list change. "Load more" announces `12 more posts loaded` and moves focus to the first new row. Each row's link name is the post title alone; meta is not part of the accessible name.

---

### 6.4 Single post — `/writing/[slug]`

**1. Layout**

```
        │◄─ 6rem ─►│◄──── 66ch ────►│◄── 16rem ──►│
        │  RAIL     │    PROSE       │   MARGIN    │
        │           │                │             │
        │  ▓ 34%    │  Essay · 12min │             │
        │  progress │  ══ TITLE ══   │             │
        │           │  Deck sentence │             │
        │  ¶ Intro  │  ─────────     │             │
        │  ¶ The …  │  [wide image, breaks into    │
        │  ¶ What … │   the margin track]          │
        │  ·  fn1   │  body copy …   │ ¹ footnote  │
        │  ¶ Ending │  body copy …   │   in margin │
```

Full-bleed cover image _below_ the title, not above it — the title is the entry point, not decoration. Prose measure locked at 66ch regardless of viewport width.

**2. Section order** — Breadcrumb → Kind + reading time + date (mono) → H1 → Deck (excerpt, 22px, `--ink-muted`) → Byline + share → Cover figure → Body → Update note (if any) → Tags → About-the-author strip → Series navigation (if in a series) → Related (3) → Subscribe → Prev/Next.

**3. Copy**

| Slot            | Copy                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Meta line       | `ESSAY · 12 MIN · 4 MARCH 2026`                                                                       |
| Update note     | `Updated 12 May 2026 — [what changed and why]`                                                        |
| Share           | `Share:` `Copy link` / `X` / `Bluesky` / `LinkedIn` / `Email` — copy state changes to `Copied` for 2s |
| Tags label      | `Filed under`                                                                                         |
| Author strip    | _"[Your Name] writes about [themes] from Rotterdam. [More about me →]"_                               |
| Series nav      | `Part 2 of 4 in "[Series name]"` → `← Previous: [title]` `Next: [title] →`                            |
| Related heading | `If you liked this`                                                                                   |
| Subscribe       | _"Get the next one by email."_                                                                        |
| Prev/Next       | `Older` / `Newer` with titles                                                                         |

**4. Components** — `Breadcrumbs`, `ArticleHeader`, `MarginRail` (progress + `¶` section markers + footnote ticks), `ShareRow`, `Figure` (4 layouts), `CodeBlock` (with copy button + filename tab), `PullQuote`, `Footnote` (margin note at `≥lg`, inline `<details>` below), `Callout`, `Prose`, `UpdateNote`, `TagList`, `AuthorStrip`, `SeriesNav`, `RelatedGrid`, `SubscribeBlock`, `PrevNext`, `ViewCounter` (optional).

**5. Responsive** — `< lg`: rail → 2px fixed top progress bar + a floating `¶ Sections` button opening a bottom sheet; margin track collapses, footnotes become numbered inline `<details>`; `wide`/`full` figures both go edge-to-edge. `lg–xl`: rail + prose + margin as drawn. `≥ xl`: margin widens to 20rem; prose stays 66ch. Share row is sticky at the bottom on mobile only if it doesn't cover content — otherwise leave it inline after the deck.

**6. SEO** — Title = post title, no site suffix if it's already ≥ 55 chars. `BlogPosting` JSON-LD with `headline`, `datePublished`, `dateModified`, `author`, `image`, `wordCount`, `keywords`, `articleSection`, `mainEntityOfPage`. `og:type=article`, `article:published_time`, `article:tag`. Dynamic OG image. Self-canonical, or `canonicalUrl` if syndicated. Heading hierarchy from the CMS is validated at build (no `h4` after an `h2`). Internal links: at least 2 to other pieces, enforced by the publish checklist.

**7. Accessibility** — `<article>` with `<header>`; rail is `<nav aria-label="Sections in this article">` with `aria-current="location"` on the active marker. Progress uses `role="progressbar"` with `aria-valuenow` updated at 10% steps (not on every frame). Footnotes: bidirectional links, `aria-describedby`, and a "return to text" affordance. Code blocks are focusable and scrollable with a keyboard, with `aria-label="Code sample: [filename]"`. Copy-link button announces success via `aria-live`. Reading measure and 19px body meet AA for low vision; ensure 200% zoom reflows without horizontal scroll.

---

### 6.5 Case studies index — `/case-studies`

**1. Layout** — Sparse and confident: 2 columns at `≥ lg`, but with only 4–8 items each card is large (16:10 image, title at 34px, 2-line summary, role chips, metric teaser). No filters unless there are more than 8.

**2. Section order** — Header + positioning line → Featured case study (full width) → Grid of the rest → "Smaller work" link to `/projects` → Contact CTA.

**3. Copy**

| Slot          | Copy                                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| H1            | `Case studies`                                                                                                 |
| Promise       | _"Long-form breakdowns of things I've shipped — including the constraints, the wrong turns, and the numbers."_ |
| Card meta     | `2025 · Design + Frontend · 8 min read`                                                                        |
| Metric teaser | `Crash-free sessions 96% → 99.4%`                                                                              |
| Projects link | _"Smaller things I've built live in [Projects →]"_                                                             |
| Contact CTA   | _"Working on something similar? [Tell me about it →]"_                                                         |

**4. Components** — `PageHeader`, `FeaturedCaseStudy`, `CaseStudyCard`, `RoleChips`, `MetricTeaser`, `CrossLinkBar`, `ContactCTA`.

**5. Responsive** — 1 column below `lg`; featured card and standard cards converge into one treatment on mobile; role chips wrap to two lines maximum then truncate with `+2`.

**6. SEO** — Title `Case studies — [Your Name]`. `CollectionPage` + `ItemList`. Each card links with a descriptive anchor (`"[Project] case study"`), never "Read more". Include the client/stack words in the summary — these are the terms people actually search.

**7. Accessibility** — Metric teasers need a text label, not just a number and an arrow glyph. Chips are non-interactive `<span>`s here (they look like the interactive ones elsewhere — differentiate with `cursor: default` and no hover state, or make them real filter links).

---

### 6.6 Single case study — `/case-studies/[slug]`

**1. Layout** — Wider than an essay (`prose` 72ch) because it carries figures and data. A sticky secondary nav appears under the header at `≥ lg` listing the nine canonical sections. Metrics render as a full-bleed band on `--surface`. Process steps use the margin track for artefacts.

**2. Section order** — 1 Hero (title, client, year, role, stack, one-line outcome) → 2 At a glance (definition list: role, timeframe, team, stack, links) → 3 Background → 4 Problem → 5 Constraints → 6 Process (numbered steps — numbering is legitimate here, it's a real sequence) → 7 Implementation → 8 Outcomes → 9 Metrics band → 10 What I'd change (learnings, grouped by `worked / didn't work / would change`) → 11 Gallery → 12 Testimonial → 13 Related writing → 14 Contact CTA.

**3. Copy**

| Slot               | Copy                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Hero outcome line  | _"Cut cold-start time by 61% and shipped to both stores in six weeks."_                       |
| At a glance labels | `Role · Timeframe · Team · Stack · Links`                                                     |
| Background eyebrow | `01 — BACKGROUND` … through `06 — WHAT I'D CHANGE`                                            |
| Problem framing    | _"The real problem wasn't [obvious thing]. It was [actual thing]."_                           |
| Constraints        | `Two weeks. One developer. No budget for a designer.`                                         |
| Process step       | `Phase 2 — Prototyping · 9 days` + body + artefacts                                           |
| Metrics band label | `MEASURED` + per-metric `source` footnote                                                     |
| Learnings groups   | `What worked` / `What didn't` / `What I'd do differently`                                     |
| Gallery caption    | Always caption. _"The first version of the filter sheet — too many options, and we knew it."_ |
| Closing CTA        | _"I take on [type] work a few times a year. [Get in touch →]"_                                |

**4. Components** — `CaseStudyHero`, `SectionNav` (sticky, scrollspy), `AtAGlance` (`<dl>`), `Prose`, `ProcessStepper`, `ArtifactFigure`, `MetricsBand`, `MetricCard`, `LearningsGroup`, `Gallery` (Radix Dialog lightbox, keyboard + swipe), `Testimonial`, `RelatedGrid`, `ContactCTA`.

**5. Responsive** — Sticky section nav → a `Jump to` select at `< lg`. Metrics: 4-up → 2-up → 1-up, numbers never shrink below 34px. Process artefacts move inline under their step. Gallery: masonry at `lg`, 2-col at `md`, 1-col swipeable carousel at `sm`. Lightbox is full-screen on mobile with a visible close button ≥ 44px.

**6. SEO** — Title `[Project] — [one-line outcome] — Case study`. `Article` JSON-LD + `CreativeWork` with `about`, plus `ImageObject` for gallery items. Metric values in real text so they can be featured in snippets. Deep-linkable section anchors (`#process`, `#outcomes`) — these get cited. If a client site exists, link it with `rel="noopener"` (not `nofollow`; you want the association).

**7. Accessibility** — Section nav is a real `<nav>` with a list; scrollspy sets `aria-current`. Metrics band: each figure has a `<dt>`/`<dd>` pair so the number is never orphaned from its label. Learnings sentiment uses a text heading plus a shape, not colour alone. Gallery lightbox traps focus, restores it on close, supports `Esc`/arrows, and announces `Image 3 of 9`. Process step numbers are decorative (`aria-hidden`) since the `<ol>` already conveys order.

---

### 6.7 Learning journal index — `/journal`

**1. Layout** — The densest page on the site, and deliberately so: a **ledger**, not a card grid. Rows grouped under sticky month headings. Each row: `date (mono, rail) · mood glyph · title · topic chips · time spent`. A year summary strip sits at the top (entries, hours, top topics) — this is the payoff of keeping the journal.

**2. Section order** — Header + honesty note → Year strip (`2026: 84 entries · 61 hours logged · mostly React Native, Postgres, writing`) → Topic filter → Month group → rows → … → Load more → Subscribe (journal-only option).

**3. Copy**

| Slot          | Copy                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H1            | `Learning journal`                                                                                                                                                             |
| Honesty note  | _"Short, dated notes on what I'm learning. Written for me, left public on purpose. Unedited — expect half-formed thoughts and the occasional wrong answer I later corrected."_ |
| Year strip    | `2026 — 84 entries · 61 hours · React Native, Postgres, writing`                                                                                                               |
| Month heading | `MARCH 2026 — 11 entries`                                                                                                                                                      |
| Mood legend   | `↗ breakthrough · ≡ grinding · ✕ stuck · ? curious` (text labels available on hover/focus)                                                                                     |
| Row           | `12 Mar ↗ Finally understood Postgres GIN indexes · postgres, search · 45m`                                                                                                    |
| Empty state   | _"No entries on that topic yet. [See all topics]."_                                                                                                                            |

**4. Components** — `PageHeader`, `YearStrip`, `TopicFilter`, `MonthGroup` (sticky heading), `JournalRow`, `MoodGlyph`, `TimeSpent`, `LoadMore`, `SubscribeBlock` (variant: journal digest).

**5. Responsive** — `< md`: date moves above the title as a mono line; topic chips limited to 2 + `+n`; time spent hidden; year strip becomes two stacked lines. Sticky month heading height 32px on mobile, offset for the header.

**6. SEO** — Title `Learning journal — [Your Name]`. Description should mention it's a public learning log; these pages pick up very long-tail queries. `Blog` JSON-LD with `blogPost[]`. Topic pages (`/journal/topic/postgres`) are the indexable facets and each needs a 30-word intro. Consider `noindex` on entries under 100 words to avoid thin-content dilution — but keep them in the sitemap-less internal nav so readers still find them.

**7. Accessibility** — The ledger is a `<ol>` per month, not a table (it's a list, not tabular data). Mood glyphs are `<span aria-label="Breakthrough">` with the glyph `aria-hidden`. Sticky headings must not obscure focused rows — add `scroll-margin-top`. Ensure the mono date has sufficient size (14px minimum) and contrast at `--ink-muted` (verify ≥ 4.5:1 against `--paper` in both themes).

---

### 6.8 Single journal entry — `/journal/[slug]`

**1. Layout** — Narrow (60ch), no cover image, no rail. Feels like a page torn from a notebook: date large in mono at the top, hairline, then text. Resources sit in a bordered block at the end. Prev/next entries by date, always present.

**2. Section order** — Back link (`← Journal`) → Date (large, mono) + mood → Title → Topics → Body → **Reflection** block (visually distinct — `--surface`, hairline left border in `--accent`) → Resources list → Time spent → Related entries (3) → Prev/next by date.

**3. Copy**

| Slot             | Copy                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| Back link        | `← Journal`                                                                |
| Date             | `12 MARCH 2026`                                                            |
| Reflection label | `WHAT CHANGED IN HOW I THINK`                                              |
| Resources label  | `WHAT I READ / WATCHED` — each: title, kind chip, one-line why-it-mattered |
| Time             | `45 minutes`                                                               |
| Related label    | `Nearby entries`                                                           |
| Prev/next        | `← 11 Mar: [title]` `13 Mar: [title] →`                                    |

**4. Components** — `BackLink`, `JournalHeader`, `MoodGlyph`, `TopicChips`, `Prose` (narrow variant), `ReflectionBlock`, `ResourceList`, `ResourceItem`, `TimeSpent`, `RelatedEntries`, `PrevNextByDate`.

**5. Responsive** — Barely changes; that's the point. Date drops from 34px to 22px below `md`. Resource items stack their kind chip above the title.

**6. SEO** — Title `[Title] — [Date] — Journal`. `BlogPosting` with `datePublished` = `entryDate`. `og:type=article`. If the entry is very short, the reflection field supplies the meta description. Cross-link generously to the related essay if one exists — journal entries are the top of a funnel into the long-form work.

**7. Accessibility** — `<time datetime="2026-03-12">`. The reflection block is a `<section aria-labelledby>` so its purpose is announced, not just visually implied. Resource links state the destination in the link text and mark external links with a visually-hidden "(opens in a new tab)" where `target="_blank"` is used.

---

### 6.9 Projects index — `/projects`

**1. Layout** — 3-column grid at `≥ lg` of compact cards (4:3 thumbnail, title, one-line summary, stack chips, year, status dot). Some cards link internally to a case study, some out to a live site — the card must make the destination obvious before the click.

**2. Section order** — Header → Status filter (`All · Live · Work in progress · Archived`) → Grid → "Want the long version?" → link to `/case-studies`.

**3. Copy**

| Slot             | Copy                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| H1               | `Projects`                                                                          |
| Promise          | _"Things I've built. Some have a full write-up; the rest are here for the record."_ |
| Card link labels | `Case study →` (internal) / `Visit site ↗` (external) / `Source ↗`                  |
| Status           | `Live` / `In progress` / `Archived — kept for the record`                           |
| Cross-link       | _"The three I've written up properly are in [Case studies →]"_                      |

**4. Components** — `PageHeader`, `StatusFilter`, `ProjectCard`, `StackChips`, `StatusDot`, `ExternalLinkIcon`, `CrossLinkBar`.

**5. Responsive** — 3 → 2 → 1 columns. Below `md` the thumbnail becomes a 16:9 banner and stack chips truncate to three.

**6. SEO** — `CollectionPage` + `ItemList` of `SoftwareApplication` or `CreativeWork` per project. Outbound project links use `rel="noopener"`. Each card's anchor text includes the project name and the action.

**7. Accessibility** — Distinguish internal from external destinations in the accessible name (`"TankExchange — case study"` vs `"TankExchange — visit site, opens in a new tab"`). Status dots need text. If a card has two actions (case study + live site), do **not** nest links — use a card with two explicit buttons/links and no whole-card click target.

---

### 6.10 Archive — `/archive`

**1. Layout** — A working index, not a marketing page. Left column (sticky at `≥ lg`, 240px): four filter groups — **Type**, **Category**, **Tag** (top 20 + "show all"), **Year**. Right column: a dense list of every published item, one row each: `date · type chip · title · tags`. A count and an active-filter summary sit above the list. Filtering is instant and client-side over a prefetched JSON index (~40 KB gzipped at 300 documents), with URL sync so any view is shareable.

**2. Section order** — Header → Search-within-archive input → Active filter summary + count + clear → Filters (sidebar) → Highlights strip (optional: collected pull-quotes) → Grouped list by year → Back-to-top.

**3. Copy**

| Slot                | Copy                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------- |
| H1                  | `Archive`                                                                                |
| Promise             | _"Everything I've published here, [N] pieces since [year]. Filter it however you like."_ |
| Search placeholder  | `Search titles and text…`                                                                |
| Filter group labels | `Type` / `Category` / `Tag` / `Year`                                                     |
| Active summary      | `47 results · Writing · tagged "attention" · 2025` `Clear all`                           |
| Empty state         | _"No matches. Try removing a filter, or [search everything] instead."_                   |
| Highlights strip    | `LINES I KEEP COMING BACK TO`                                                            |

**4. Components** — `PageHeader`, `ArchiveSearchInput`, `FilterSidebar` (`FilterGroup`, `FilterCheckbox` with counts, `ShowAllToggle`), `ActiveFilterSummary`, `ResultCount`, `ArchiveRow`, `YearGroup`, `HighlightsStrip`, `EmptyState`, `BackToTop`.

**5. Responsive** — `< lg`: filters collapse into a `Filters (3)` button opening a Radix Dialog sheet from the bottom, with `Apply` and `Clear` at the bottom in a fixed bar; the sheet shows counts so it's usable one-handed. Rows drop the tag list and keep `date · type · title`. `≥ lg`: sidebar sticky with its own scroll.

**6. SEO** — `/archive` is indexable; filter states are **not** (query params, canonical → `/archive`). `/archive/[year]` pages _are_ server-rendered and indexable with their own titles (`Everything I published in 2025`) — they're genuinely useful and crawlable. Ensure every published document is reachable within two clicks from `/archive`; add a build-time orphan check.

**7. Accessibility** — Filters are grouped in `<fieldset>` + `<legend>`; checkboxes are real inputs. Result count is `aria-live="polite"`. Filter counts are included in each label's accessible name (`"React, 14 items"`). The mobile sheet traps focus and returns it to the `Filters` button. Keyboard users can reach `Clear all` without traversing every checkbox — put it first in DOM order and position it visually with CSS.

---

### 6.11 Contact — `/contact`

**1. Layout** — Two columns at `≥ lg`: left is the form (60%), right is context — what you're open to, response time, links elsewhere. Deliberately calm; no map, no stock photo.

**2. Section order** — Header → Collaboration note (what you say yes and no to) → Form → Response expectation → Elsewhere links → Newsletter alternative.

**3. Copy**

| Slot               | Copy                                                                                                                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1                 | `Contact`                                                                                                                                                                                                                                             |
| Intro              | _"The fastest way to reach me is this form or [email]. I read everything."_                                                                                                                                                                           |
| Collaboration note | **`What I'm open to`** — _"Freelance or contract work on [X]. Writing commissions. Talks and podcasts. Reviewing someone's draft."_ · **`What I'll probably decline`** — _"Unpaid 'exposure' work, crypto, and anything that needs an answer today."_ |
| Fields             | `Your name` · `Email` · `What's this about?` (select: Collaboration / Writing / Speaking / A question / Something else) · `Message`                                                                                                                   |
| Field help         | Under Message: _"Detail helps. What are you building, and what's the deadline?"_                                                                                                                                                                      |
| Submit             | `Send message` → loading `Sending…` → success `Message sent. I'll reply within a few days.`                                                                                                                                                           |
| Errors             | `Add your email so I can reply.` / `Your message needs a bit more detail — 20 characters minimum.` / rate-limited: `You've sent a few already. Try again in an hour, or email me directly.`                                                           |
| Response time      | _"I usually reply within 2–3 days. If it's been a week, assume it got lost and send it again."_                                                                                                                                                       |
| Elsewhere          | `X · Bluesky · GitHub · LinkedIn · RSS`                                                                                                                                                                                                               |

**4. Components** — `PageHeader`, `Prose`, `ContactForm` (`Field`, `Label`, `Input`, `Textarea`, `Select`, `ErrorText`, `SubmitButton`, `FormStatus`), `Turnstile`, `CollaborationNote`, `ResponseTimeNote`, `SocialLinks`, `SubscribeBlock`.

**5. Responsive** — Single column below `lg` with the collaboration note **above** the form (it saves you both time). Inputs 44px minimum height, 16px font size to prevent iOS zoom. Submit button full width on mobile.

**6. SEO** — Title `Contact — [Your Name]`. `ContactPage` JSON-LD. Include your email as text (obfuscated only if spam becomes real) — some people want to skip the form. `noindex` the success state if it's a separate URL; prefer an in-place success message so it isn't.

**7. Accessibility** — Every field has a persistent visible `<label>` (no placeholder-only labels). Errors are tied with `aria-describedby` and `aria-invalid`, summarised in an `role="alert"` region at the top of the form, and focus moves to the first invalid field on submit. The form works without JS via a progressively-enhanced server action. Turnstile is the non-interactive variant with a documented fallback. Success message is `role="status"`.

---

### 6.12 Newsletter — `/newsletter` (+ signup area)

**1. Layout** — A landing page that sells by showing, not telling: a single-column pitch, then the actual archive of past issues below the form. The archive is the strongest argument.

**2. Section order** — Statement → What you get (3 bullets) → Signup form → Social proof (subscriber count only if ≥ 500; otherwise a reader quote or nothing) → Past issues list → What I won't do → FAQ (3 items).

**3. Copy**

| Slot               | Copy                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| H1                 | _"A letter every other Sunday."_                                                                                 |
| Sub                | _"One essay, three things worth reading, and whatever I'm currently stuck on."_                                  |
| What you get       | `A new essay before it's public.` · `Three links with a sentence on why.` · `One open problem I haven't solved.` |
| Form               | `Email address` + `Subscribe`                                                                                    |
| Consent line       | _"Double opt-in — you'll get a confirmation email. One click to unsubscribe, forever. I never share the list."_  |
| Success            | `Almost there — check your inbox and click the confirmation link.`                                               |
| Already subscribed | `You're already on the list. [Resend the confirmation?]`                                                         |
| What I won't do    | _"No drip sequences. No 'quick question' emails. No selling you a course."_                                      |
| Past issues        | `#14 — On finishing things · 8 Mar 2026`                                                                         |
| FAQ                | `How often?` `Can I read it without subscribing?` `What happens to my email address?`                            |

**In-page signup areas** — three variants of the same component, differing only in density: `footer` (single row), `inline` (after article body, with a contextual line: _"If you got this far, you'll probably like the newsletter."_), `block` (home/newsletter page). All pass a `source` value so you can measure which posts convert (§5.7).

**4. Components** — `NewsletterHero`, `BenefitList`, `SubscribeForm` (3 variants, shared logic), `ConsentNote`, `IssueList`, `IssueRow`, `FAQ` (`<details>` based), `Prose`.

**5. Responsive** — Form input and button stack below `sm` with the button full width. Issue rows keep number + title, drop the date below `sm`.

**6. SEO** — Title `Newsletter — A letter every other Sunday — [Your Name]`. Archived issues are individually indexable and are excellent long-tail pages. JSON-LD `Blog` for the archive. `/newsletter/confirm` and `/newsletter/unsubscribe` are `noindex`.

**7. Accessibility** — One `<label>` per form instance, uniquely `id`'d (three instances of the same form on one page must not collide — derive ids from the `source` prop). `type="email"` + `autocomplete="email"` + `inputmode="email"`. Status messages in `aria-live="polite"`; errors in `role="alert"`. Never disable the submit button without also explaining why. FAQ `<details>` needs a visible focus ring on the `<summary>`.

---

### 6.13 Search results — `/search?q=`

**1. Layout** — Search field at the top, full width, pre-filled and focused. Facet chips below it with counts. Results as rows with the match rendered in **highlighter yellow** — the one place the site's accent colour is used at full strength, so the page feels like a marked-up index. Timing shown in mono (`23 results · 41ms`) because it signals speed and craft.

**2. Section order** — Search input → Facets (`Type`, `Year`, `Tag`) → Result summary + timing → Results → Pagination → No-results fallback (recent + popular + archive link).

**3. Copy**

| Slot         | Copy                                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1           | `Search` (visually hidden if the input carries the label)                                                                                                         |
| Placeholder  | `Search essays, case studies and journal entries…`                                                                                                                |
| Summary      | `23 results for "postgres index" · 41ms`                                                                                                                          |
| Facets       | `All types · Writing · Case studies · Journal · Projects`                                                                                                         |
| Did-you-mean | _"No exact matches for "postgress". Showing results for **postgres**."_                                                                                           |
| No results   | _"Nothing matched "[query]". Three things you could try: check the [archive], browse [all tags], or [email me] and ask — I might have written it and forgotten."_ |
| Result row   | title (with highlight) · `Journal · 12 Mar 2026 · 3 min` · snippet with highlight                                                                                 |
| Error state  | _"Search is unavailable right now. [Browse the archive] instead — it has everything."_                                                                            |

**4. Components** — `SearchInput` (debounced 200ms, URL-synced), `FacetChips`, `ResultSummary`, `SearchResultRow`, `HighlightMark`, `Pagination`, `NoResults`, `SearchErrorState`, `RecentPosts`.

**5. Responsive** — Facets scroll horizontally below `md`. Input is sticky under the header while scrolling results. Snippets truncate to two lines on mobile, three on desktop.

**6. SEO** — `noindex, follow` on all search pages. Excluded from the sitemap and disallowed in `robots.txt`. Do link out to real pages so crawl equity flows. Implement `SearchAction` in the home page's `WebSite` JSON-LD pointing at `/search?q={search_term_string}` so Google can offer a site search box.

**7. Accessibility** — `role="search"` landmark on the form. Results region is `aria-live="polite"` with the count announced (`"23 results"`), debounced to avoid chatter. Highlighted matches use `<mark>` — semantic, and announced by some screen readers as emphasis. Keyboard: `↑`/`↓` moves through results, `Enter` opens, `Esc` clears. Never move focus into the results list automatically while typing. Verify `--highlight` behind `--ink` clears 4.5:1 in both themes.

---

### 6.14 404 — `/not-found` (+ 500)

**1. Layout** — Single centred column, generous vertical space. No illustration, no "oops". The page's job is to get the reader to content in one click.

**2. Section order** — Status line → Explanation → Search input → Three most recent posts → Links to the four indexes → Report link.

**3. Copy**

| Slot          | Copy                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Status (mono) | `404`                                                                                                                      |
| H1            | _"That page isn't here."_                                                                                                  |
| Explanation   | _"It may have moved, or the link may be wrong. Two things usually work:"_                                                  |
| Search prompt | `Search for what you were after`                                                                                           |
| Recent        | `Or read something recent` + 3 rows                                                                                        |
| Index links   | `Writing · Case studies · Journal · Archive`                                                                               |
| Report        | _"If a link on this site sent you here, [tell me] — I'd like to fix it."_                                                  |
| 500 H1        | _"Something broke on my end."_ + _"It's been logged and I'll look at it. Try again in a moment, or [browse the archive]."_ |

**4. Components** — `StatusCode`, `SearchInput`, `RecentPosts`, `IndexLinks`, `ReportLink`.

**5. Responsive** — Trivially single-column; keep the search input at 44px height and full width below `md`.

**6. SEO** — Must return a real HTTP **404** status (Next.js `not-found.tsx` does this; verify in production — a soft 404 is a common and costly bug). `noindex`. Log 404 paths with referrers so you can add `redirect` documents for the ones that recur. The 500 page returns 500 and is `noindex`.

**7. Accessibility** — `h1` carries the human message, not the number (`404` is a `<p>` with `aria-hidden` or a visually-hidden expansion). Focus lands on the `h1` (`tabindex="-1"`, focused on mount) so screen-reader users immediately hear what happened.

---

## 7. Build Roadmap

Nine phases. Each has an exit criterion — do not start the next phase until it's met. Estimates assume one developer working part-time; halve them for full-time.

### Phase 0 — Foundations (2–3 days)

| Task              | Detail                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Repo              | Next.js 15 + TS strict + pnpm; ESLint, Prettier, `lint-staged`, Husky                                                              |
| Design tokens     | `globals.css` with the §4.5 tokens, light + dark, `color-scheme`, `prefers-reduced-motion` block                                   |
| Fonts             | Self-host Bricolage Grotesque, Literata, IBM Plex Mono via `next/font/local`; subset to latin + punctuation; preload Literata only |
| Type scale        | `typography.css` with the fluid scale and a `.prose` class covering every element Portable Text can emit                           |
| Layout primitives | `Shell`, `Container`, `ArticleGrid` (rail/prose/margin), `Prose`, `Stack`, `Hairline`                                              |
| Global shell      | Header, nav, footer, skip link, theme toggle (no flash: inline script reads the cookie/`localStorage` before paint)                |
| CI                | GitHub Actions: typecheck + lint + Vitest on every push                                                                            |

**Exit:** a static page renders correct type in both themes at 3 widths, Lighthouse a11y = 100, no layout shift.

### Phase 1 — Content backbone (3–4 days)

Sanity project + Studio at `/studio` · all schemas from §3 with validation rules · Studio structure from §5.5 · `computeDerivedFields` document action · GROQ queries in `src/sanity/lib/queries.ts` with `sanity-typegen` types · image URL builder + custom `next/image` loader · Portable Text renderers for every object in §3.2 · seed the `development` dataset with 5 posts, 1 case study, 10 journal entries, 4 projects (real-ish content, not lorem ipsum — you'll design against it).

**Exit:** every content type round-trips CMS → typed query → rendered component.

### Phase 2 — Core reading experience (4–5 days)

`/writing/[slug]` complete: article grid, margin rail with progress and `¶` markers, footnotes in the margin, figure layouts, code blocks with copy, pull quotes, update note, tags, share row, related, prev/next, series nav · `/journal/[slug]` · `generateStaticParams` + `generateMetadata` · `draftMode` preview + preview banner + exit.

**Exit:** an article reads well on a phone and a 27" display; axe clean; JS on the page ≤ 90 KB; a draft is previewable and its public URL 404s.

### Phase 3 — Indexes & navigation (3–4 days)

`/writing` with filters and pagination · `/journal` ledger with month grouping and year strip · `/case-studies` · `/projects` · facet pages for tag / category / series / topic · `/` home page · empty states for all of them.

**Exit:** every published document is reachable in ≤ 2 clicks from the home page; all filter states are URL-shareable and restore correctly on reload.

### Phase 4 — Case study template (2–3 days)

The full 14-section template from §6.6, sticky section nav with scrollspy, metrics band, process stepper with margin artefacts, learnings groups, gallery with accessible lightbox.

**Exit:** one real case study published end-to-end, with sourced metrics.

### Phase 5 — Data layer & forms (3–4 days)

Neon + Drizzle + migrations · `subscribers`, `contact_messages`, `page_views`, `search_documents`, `webhook_deliveries` · Turnstile + Upstash rate limiting · `subscribeToNewsletter` with double opt-in (React Email templates via Resend) · confirm + one-click unsubscribe · `sendContactMessage` · `/contact`, `/newsletter`, confirm and unsubscribe result pages · all form states designed and tested (idle, loading, success, field error, rate-limited, already-subscribed, server error).

**Exit:** subscribe → confirmation email → confirm → appears in Resend audience → unsubscribe in one click, all verified against real inboxes (Gmail, Outlook, Apple Mail).

### Phase 6 — Search & archive (3 days)

`search_documents` upsert in the revalidate webhook · a `scripts/reindex-search.ts` full rebuild · `/api/search` with ranking, `ts_headline`, facet counts and trigram fallback · `/search` page · `⌘K` command palette · `/archive` with the four filter groups and the mobile filter sheet · `/archive/[year]`.

**Exit:** searching a deliberately misspelled term from a real post returns it in the top 3; archive filters combine correctly; the archive JSON index is < 60 KB gzipped.

### Phase 7 — SEO, feeds, media, analytics (2–3 days)

`generateMetadata` for every route · JSON-LD per §4.7 · `/api/og` with Satori · `sitemap.ts`, `robots.ts`, `llms.txt` · four feeds · redirects from CMS documents + middleware fallback · Plausible + Vercel Analytics + custom events · Sentry · view counting behind a flag · security headers and CSP with nonces.

**Exit:** Rich Results Test passes for a post, a case study and the home page; all four feeds validate; OG images render correctly in the X, LinkedIn, Slack and iMessage previewers; CSP has no violations in the console.

### Phase 8 — Hardening & launch (3–4 days)

Playwright flows from §5.9 · axe on all 14 templates · Lighthouse CI budgets · visual snapshots · content lint (orphans, alt text, broken internal links) · weekly dataset backup workflow · Vercel Cron for scheduled publishing and nightly jobs · 404/500 pages · real content pass: write the About page properly, publish 8–10 posts and 2 case studies. **A site with three posts looks abandoned; content is a launch requirement, not a follow-up.**

**Exit:** the §9 checklist is fully green.

### 7.9 After launch (in priority order)

1. **A "start here" page** curating 5 pieces for newcomers — highest-leverage single addition.
2. **Series as first-class landing pages** with their own intros.
3. **Reader highlights** — collect the lines people select and surface them on `/archive`.
4. **A yearly review page** generated from journal stats (entries, hours, topics) — nearly free given the schema.
5. **Typesense** if the corpus passes ~2,000 documents.
6. **Web mentions / replies** instead of comments.
7. **Gated notebook** (Auth.js) if you ever want subscriber-only drafts.
8. **i18n** with locale-prefixed routes, if you decide to write in a second language.

---

## 8. Reusable Prompt Pack

Each prompt is self-contained and assumes the agent can read this document. Use them in order; paste the referenced sections along with the prompt if the agent's context is limited.

### P0 — Project bootstrap

```
You are building the site specified in writer-site-spec.md. Read §4.1, §4.4 and §4.5.

Task: scaffold the repository.
1. Next.js 15 App Router, TypeScript strict, pnpm, Tailwind CSS v4.
2. Create src/app/globals.css containing ONLY the design tokens from §4.5 as CSS
   custom properties, with a light block on :root and a dark block on [data-theme="dark"]
   plus a prefers-color-scheme fallback. Include a @media (prefers-reduced-motion: reduce)
   block that disables all transitions and animations.
3. Load the three fonts from §4.5 with next/font/local, latin subset, display: swap.
   Preload only the body face.
4. Create src/styles/typography.css with the fluid clamp() scale and a .prose class that
   styles every element Portable Text can emit: p, h2, h3, h4, ul, ol, li, blockquote,
   pre, code, a, hr, strong, em, sup, table, figure, figcaption.
5. Create layout primitives: Shell, Container, ArticleGrid (CSS grid named areas
   rail/prose/margin per §4.5), Prose, Stack, Hairline.
6. Build the global Header, Footer, SkipLink and ThemeToggle from §6.0. The theme toggle
   must not flash on load: inline a tiny script in <head> that reads the stored preference
   before first paint.
7. Configure ESLint, Prettier, lint-staged, Husky, and a GitHub Actions workflow running
   typecheck + lint + vitest.

Constraints: no UI component library. No shadows, no gradients, no border-radius on cards.
Do not write any page content yet. Output the file tree and every file's contents.
```

### P1 — Sanity schemas

```
Read §3 in full and §5.5.

Task: implement the complete Sanity content model.
- One file per document type in src/sanity/schemas/documents/, one per object in
  src/sanity/schemas/objects/, with an index that composes them.
- Implement EVERY field, type and validation rule in §3.3 and §3.4, including: required alt
  text, excerpt length caps, max-3-featured enforced via a validation query, slug uniqueness
  across post/caseStudy/journalEntry, required metric sources, and the publish guard on
  missing SEO description.
- Implement the Studio desk structure from §5.5, organised by workflow with a
  "Needs attention" group whose lists use GROQ filters for: drafts, in review, scheduled,
  missing alt text, missing excerpt.
- Implement a document action `computeDerivedFields` that on publish sets readingTime
  (words/220, ceil, min 1), wordCount, plainText (flattened body), and headings[] (h2/h3
  with slugified anchors).
- Add a custom "Open preview" document action hitting /api/preview/enable.
- Mount the Studio at src/app/studio/[[...tool]]/page.tsx with noindex metadata.

Use TypeScript with defineType/defineField. Every field needs a description written for a
writer, not a developer. Output all files.
```

### P2 — Data access layer

```
Read §3.5, §4.3 and §5.

Task: build the typed data layer.
1. src/sanity/lib/client.ts — separate clients for published (CDN, stega off) and draft
   (no CDN, token, perspective: 'drafts').
2. src/sanity/lib/fetch.ts — a sanityFetch wrapper that takes { query, params, tags,
   revalidate } and switches client based on draftMode(). Every call must pass cache tags.
3. src/sanity/lib/queries.ts — GROQ for: home page (featured posts, featured case studies,
   latest journal, settings) in ONE query; post by slug with resolved refs; post index with
   filters + pagination; journal index grouped for month headers; case study by slug; project
   index; facet pages; archive index (lean projection: only fields the archive row needs);
   prev/next by date; related content per §6.4.
   Every published-content query must filter: status == "published" && publishedAt <= now().
4. Configure sanity-typegen and generate types. No `any`, no manual interfaces duplicating
   the schema.
5. src/lib/related.ts — related content scoring: shared tags (3 pts each), same series
   (5 pts), same category (1 pt), recency tiebreak. Returns 3 items, excludes self, prefers
   relatedManual when set. Pure function, unit tested.
6. Postgres: src/db/schema.ts in Drizzle matching the DDL in §5.2 exactly, plus generated
   migrations. Use the Neon HTTP driver.

Output files plus a Vitest suite for related.ts and reading-time.ts.
```

### P3 — Article template (the most important prompt)

```
Read §4.5 and §6.4 in full.

Task: build /writing/[slug] to a publishable standard.
Layout: the three-track ArticleGrid — rail (6rem) / prose (66ch) / margin (16rem) at ≥1024px.
Below that, single column with the rail collapsed to a 2px top progress bar and a
"¶ Sections" bottom sheet.

Build these components:
- ArticleHeader: breadcrumb, mono meta line (KIND · N MIN · DATE), h1, deck, byline, share row.
- MarginRail: scroll-linked highlighter-yellow progress fill (transform only, requestAnimationFrame
  or scroll-timeline), one ¶ marker per h2 that scroll-links and sets aria-current="location"
  when active, and tick marks for footnotes at their document offsets. Wrap in
  <nav aria-label="Sections in this article">. role="progressbar" with aria-valuenow updated
  in 10% steps only.
- Figure: four layouts (inline/wide/full/side) with correct `sizes` per §5.6, blur placeholder
  from Sanity LQIP, intrinsic width/height so CLS is 0, required alt, styled caption + credit.
- CodeBlock: filename tab, copy button with an aria-live confirmation, keyboard-scrollable
  with aria-label, no syntax-highlighting library heavier than shiki at build time.
- Footnote: margin note at ≥1024px, inline <details> below; bidirectional links,
  aria-describedby, return-to-text link.
- PullQuote: default and `emphasis` variant (the latter uses --highlight as a text highlight).
- UpdateNote, TagList, ShareRow (copy link + X + Bluesky + LinkedIn + email, zero third-party
  scripts), AuthorStrip, SeriesNav, RelatedGrid, PrevNext.

Motion: exactly the three animations in §4.5, all disabled under prefers-reduced-motion.

Also implement generateStaticParams, generateMetadata (§6.4 SEO notes), BlogPosting JSON-LD,
and draftMode support with a preview banner.

Acceptance: axe reports zero violations; total client JS ≤ 90 KB gzip; body text 19px at
66ch measure; 200% browser zoom reflows without horizontal scrolling; keyboard-only reader
can reach every section marker, every footnote and back again.
```

### P4 — Index pages

```
Read §6.1, §6.3, §6.5, §6.7, §6.9.

Task: build the home page and the four index pages, plus facet pages for tag, category,
series and journal topic.

Shared requirements:
- Filters are URL state (searchParams), not component state. Every filter combination is
  shareable and restores on reload. Filter chips are toggle buttons with aria-pressed.
  Result counts are announced via aria-live="polite".
- Cards have exactly ONE link whose accessible name is the title alone; use a stretched
  ::after for the click target. Never nest interactive elements.
- Every index has a designed empty state with two escape routes, using the exact copy in §6.
- "Load more" appends and moves focus to the first new item, announcing how many loaded.
  Real ?page=n links exist behind it for crawlers.

Page-specific: the home page composition and copy from §6.1 (statement hero, currently strip,
1 lead + 2 secondary posts, 2 wide case study cards, 5 journal rows, subscribe block).
The journal index is a ledger with sticky month headings, a year summary strip, mood glyphs
with text alternatives, and time-spent totals — NOT a card grid.

Use the copy tables from §6 verbatim as defaults; leave [bracketed] tokens in place.
```

### P5 — Case study template

```
Read §6.6 and §3.3 (caseStudy).

Task: build /case-studies/[slug] with all 14 sections in the specified order.
Key components: CaseStudyHero (title, client, year, role chips, stack, one-line outcome),
SectionNav (sticky, scrollspy, aria-current, degrades to a "Jump to" select below 1024px),
AtAGlance as a real <dl>, ProcessStepper (<ol>, phase label, duration, artefacts placed in
the margin track at ≥1024px and inline below), MetricsBand (4→2→1 up, each metric a <dt>/<dd>
pair, numbers never below 34px, source as a footnote), LearningsGroup (three groups: worked /
didn't work / would change — differentiated by heading and shape, never colour alone),
Gallery + Lightbox (Radix Dialog: focus trap, focus restore, Esc, arrow keys, swipe, announces
"Image 3 of 9", ≥44px close target on mobile), Testimonial, RelatedGrid, ContactCTA.

Deep-linkable anchors on every section. Article + CreativeWork JSON-LD with ImageObject for
gallery items. Metric values must be real text, not images.
```

### P6 — Forms, email, newsletter

```
Read §5.4, §5.8, §6.11, §6.12.

Task: implement both public forms end to end.
1. Zod schemas in src/lib/validators.ts, shared between client and server. Server-side
   validation is authoritative.
2. Server actions subscribeToNewsletter and sendContactMessage with: Turnstile verification,
   Upstash sliding-window rate limits (5/10min and 3/hr per hashed IP), honeypot field,
   sha256(ip + IP_HASH_SALT) storage only — never raw IPs.
3. Double opt-in: insert subscriber as 'pending' with a 48h token, send a React Email
   confirmation via Resend, then /api/newsletter/confirm sets 'confirmed', creates the Resend
   contact, and redirects to /newsletter/confirm. Never reveal whether an email already
   exists — always return the same message.
4. One-click unsubscribe: token in the URL, no login, no confirmation step. Also handle
   RFC 8058 List-Unsubscribe-Post.
5. React Email templates: confirmation, contact notification (reply-to = sender), welcome.
   Test-render them for Gmail, Outlook and Apple Mail.
6. UI: SubscribeForm in three variants (footer/inline/block) sharing one hook and passing a
   `source`. Unique input ids derived from `source` so three instances on one page don't
   collide. Every state from §6.11/§6.12 designed: idle, loading, success, field error,
   rate-limited, already-subscribed, server error.
7. Accessibility: persistent visible labels, aria-invalid + aria-describedby, an error summary
   with role="alert" at the top of the form, focus moved to the first invalid field, success as
   role="status". Both forms must work with JavaScript disabled.

Write integration tests against an ephemeral Neon branch covering the full
subscribe → confirm → unsubscribe path and both rate limits.
```

### P7 — Search, command palette, archive

```
Read §4.6, §5.4, §6.10, §6.13.

Task: implement search and the archive.
1. search_documents upsert/delete inside the /api/revalidate webhook, plus a standalone
   scripts/reindex-search.ts that rebuilds the whole index from Sanity.
2. The tsvector column, GIN indexes and pg_trgm index exactly as in §4.6.
3. /api/search: websearch_to_tsquery + ts_rank_cd ranking, ts_headline for snippets
   (StartSel/StopSel producing <mark>), facet counts for type/year/tag in a single grouped
   query, trigram fallback when fewer than 3 results, and a log row in search_queries.
   Returns { results, facets, total, tookMs }. Rate limited 30/min.
4. /search page: streaming, noindex, URL-synced debounced input (200ms), facet chips with
   counts, results with <mark> highlights styled as highlighter swipes, timing in mono,
   the no-results copy from §6.13 with three escape routes, and a graceful error state that
   points at the archive.
5. ⌘K / "/" command palette (Radix Dialog): recent posts by default, live search while typing,
   type chips, arrow-key navigation, Esc closes and restores focus to the trigger.
6. /archive: prefetched lean JSON index, four filter groups (type, category, tag with top-20
   + show-all, year) as <fieldset>/<legend> with real checkboxes and counts in each label's
   accessible name, URL-synced multi-select filtering, year grouping, and a bottom-sheet
   filter dialog below 1024px with Apply/Clear in a fixed bar. Plus server-rendered,
   indexable /archive/[year] pages.

Acceptance: a deliberately misspelled query still returns the right post in the top 3;
p95 search latency under 100ms; the archive index payload is under 60 KB gzipped.
```

### P8 — SEO, feeds, OG, structured data

```
Read §4.7 and every "SEO notes" block in §6.

Task: implement discovery and sharing.
1. src/lib/seo.ts — a buildMetadata helper used by every route. Description precedence:
   seo.description → excerpt → first 155 chars of plainText. Absolute self-referencing
   canonicals, with canonicalUrl overriding when set.
2. src/lib/jsonld.ts — typed builders for Person, WebSite + SearchAction, BlogPosting,
   Article + CreativeWork, CollectionPage + ItemList, ProfilePage, ContactPage,
   BreadcrumbList. Rendered as <script type="application/ld+json"> per route.
3. /api/og with Satori and next/og: title in the display face, kind + date in mono, on the
   paper colour, with a highlighter swipe beneath the title. Cache immutably, keyed on
   slug + updatedAt.
4. Feeds: /rss.xml (all), /feed/writing.xml, /feed/journal.xml, /feed.json. Full content in
   the writing feed. Valid per the W3C feed validator.
5. app/sitemap.ts generated from Sanity with lastModified from updatedAt; exclude /search,
   /studio, confirm and unsubscribe pages. app/robots.ts disallowing /studio, /api, /search
   and linking the sitemap. A hand-written /llms.txt.
6. Redirects: read `redirect` documents at build into next.config.ts, plus middleware for
   ones added after the build. 301 permanent.
7. Plausible + Vercel Analytics with the custom events in §5.7. Sentry with sampling.
8. Security headers and a nonce-based CSP in middleware. No unsafe-inline.

Acceptance: Rich Results Test passes for a post, a case study and the home page; all four
feeds validate; OG images render in the X, LinkedIn, Slack and iMessage previewers;
zero CSP violations in the console; every page has a unique title and description.
```

### P9 — Testing & hardening

```
Read §5.9.

Task: build the full test suite and CI gates.
1. Vitest: unit tests for lib/* (reading-time, related, seo, jsonld, pathsFor, validators)
   at ≥80% coverage; component tests for PostCard, FilterBar, MarginRail, SubscribeForm
   (all states), Gallery lightbox.
2. Contract tests: run every GROQ query against a seeded dataset, assert the generated types
   still match.
3. Integration tests against an ephemeral Neon branch: subscribe→confirm→unsubscribe, search
   ranking and fallback, webhook idempotency (same _rev twice = one write), rate limits.
4. Playwright across Chromium, WebKit and a mobile viewport, covering every critical flow in
   §5.9, including: draft preview shows unpublished content while the public URL returns a
   real 404, and the dark-mode preference survives navigation.
5. @axe-core/playwright on all 14 templates in both themes; zero serious or critical
   violations. Plus a keyboard-only walkthrough test of nav, filters, dialog and forms.
6. Lighthouse CI on /, an article, a case study and /archive with budgets: performance ≥95,
   accessibility 100, SEO 100, JS ≤90 KB.
7. A content lint script: no orphan pages, no missing alt text, no broken internal links,
   every published document present in search_documents. Runs nightly.
8. Wire all of it into GitHub Actions with the gates in §5.9.
```

### P10 — Deployment

```
Read §5.10 and §5.11.

Task: get this to production.
Follow the 11 one-time setup steps in §5.10 exactly. Then:
- Set every variable in §5.11 separately for Production, Preview and Development. Preview
  must use the Sanity `development` dataset and a Neon dev branch.
- Configure the Sanity webhook with the document-type filter and HMAC secret from §5.4.
- Add Vercel Cron entries for /api/cron/publish-scheduled (hourly) and /api/cron/nightly (03:00 UTC).
- Add a GitHub Action that runs `sanity dataset export` weekly and uploads the artefact.
- Verify: HTTPS, HSTS, apex/www redirect, a real 404 status code from a nonexistent path,
  sitemap submitted to Google Search Console and Bing, feeds reachable, OG image rendering,
  and one end-to-end publish (write a journal entry in the Studio → confirm it appears on the
  live site and in search within 60 seconds).
Output the exact commands, the webhook configuration, the cron config, and a smoke-test script.
```

### P11 — Copy pass

```
Read §6 (every copy table) and §1.6.

Task: you are the editor, not the developer. Replace every [bracketed] placeholder with real
copy, and rewrite anything that reads like a template.
Voice: intelligent, reflective, plain. Active voice. Sentence case. No exclamation marks, no
"unlock", "elevate", "journey", "dive in", or "in today's fast-paced world". No em-dash-heavy
rhythm. Specific over clever, always.
Deliver: the home statement and intro, the About page in full (opening, 4 themes, tools note,
6 timeline entries, 4 values), all index promises, all empty states, all form labels, help
text and error messages, the newsletter pitch, the 404 and 500 pages, and the footer line.
Every error message must say what happened and what to do next, in the interface's voice —
errors do not apologise and are never vague.
```

---

## 9. Implementation Checklist

### 9.1 Pre-launch

**Content**

- [ ] 8–10 posts published, each with a cover image, excerpt, category, 2–6 tags, and ≥2 internal links
- [ ] 2 case studies complete with sourced metrics and captioned galleries
- [ ] 10+ journal entries, each with a filled `reflection` field
- [ ] 6 projects, statuses accurate, outbound links verified
- [ ] About page written in your own voice, not third person
- [ ] Every `[bracketed]` placeholder in the codebase replaced
- [ ] Every image has meaningful alt text; decorative images explicitly marked
- [ ] 3 featured posts and 2 featured case studies selected

**Design & front end**

- [ ] Both themes verified on all 14 templates
- [ ] Contrast checked: `--ink-muted` on `--paper`, `--accent` on `--paper`, `--ink` on `--highlight` — all ≥ 4.5:1
- [ ] 320px width has no horizontal scroll anywhere
- [ ] 200% zoom reflows on the article template
- [ ] `prefers-reduced-motion` disables all three animations
- [ ] Focus visible on every interactive element, never removed
- [ ] Fonts subset, preloaded correctly, no FOIT
- [ ] CLS = 0 on the article and home templates
- [ ] No shadows, gradients, or rounded cards crept in

**Functionality**

- [ ] Publish → live in under 60 seconds, with tag/category/archive pages all updated
- [ ] Draft preview works; the public URL of a draft returns a real 404
- [ ] Scheduled publish verified with a real future-dated document
- [ ] `revisionNote` renders as an update line
- [ ] Search finds a misspelled query; facets combine; error state points at the archive
- [ ] `⌘K` palette opens, searches, navigates by keyboard, restores focus
- [ ] Archive filters combine and survive reload; mobile sheet traps focus
- [ ] Subscribe → confirmation email → confirm → Resend audience → one-click unsubscribe
- [ ] Contact form: happy path, each validation error, and the rate-limited state
- [ ] Both forms work with JavaScript disabled
- [ ] Related content returns 3 sensible items on every post
- [ ] Prev/next and series navigation correct at the boundaries (first and last items)

**SEO & discovery**

- [ ] Unique title and description on every page
- [ ] One `h1` per page; heading hierarchy has no skipped levels
- [ ] Canonicals absolute and self-referencing; syndicated pieces point outward
- [ ] JSON-LD passes Rich Results Test for post, case study, home, about, contact
- [ ] OG images render in X, LinkedIn, Slack, iMessage, WhatsApp
- [ ] `sitemap.xml` complete and correct; `robots.txt` correct
- [ ] All four feeds validate
- [ ] 404 returns HTTP 404; 500 returns HTTP 500 (check with `curl -I`)
- [ ] No orphan pages (content lint passes)
- [ ] Redirects in place for anything you've published elsewhere

**Ops & security**

- [ ] All env vars set for Production, Preview and Development
- [ ] Webhook HMAC verified; replaying the same `_rev` writes once
- [ ] Rate limits confirmed by trying to break them
- [ ] CSP active with no console violations; security headers scored on securityheaders.com
- [ ] No raw IPs stored anywhere; `IP_HASH_SALT` set and ≥ 32 bytes
- [ ] Sentry receiving events from both browser and server
- [ ] Analytics recording page views and at least three custom events
- [ ] Weekly Sanity dataset export running; restore tested once
- [ ] Neon backup/PITR confirmed
- [ ] Cron jobs firing (check logs after the first run)
- [ ] Privacy page accurate about what you collect, and it matches reality

**Quality gates**

- [ ] Lighthouse ≥ 95 / 100 / 100 on all four audited routes
- [ ] axe: zero serious or critical violations on all 14 templates, both themes
- [ ] Playwright suite green on Chromium, WebKit and mobile
- [ ] Client JS ≤ 90 KB gzip on the article route
- [ ] Unit coverage ≥ 80% on `src/lib`

### 9.2 Launch-day smoke test (10 minutes, run in production)

1. Load `/` on a phone over 4G — LCP feels instant, no layout shift.
2. Read one article top to bottom; the margin rail tracks and the footnotes work.
3. Search a term you know exists; click the first result.
4. Subscribe with a real address; confirm from the email; unsubscribe.
5. Submit the contact form; confirm the email arrives with a working reply-to.
6. Hit a nonexistent URL; verify a 404 status and useful recovery options.
7. Share an article link into Slack and X; check the OG preview.
8. Publish a one-line journal entry from your phone; watch it appear.
9. Toggle dark mode and navigate three pages.
10. Run `curl -I` on the home page and check the security headers.

### 9.3 First month

- [ ] Review `search_queries` weekly — it's a free editorial calendar
- [ ] Review 404 logs and add `redirect` documents for recurring paths
- [ ] Check Search Console coverage; fix anything excluded unexpectedly
- [ ] Compare `subscribers.source` values to see which posts convert
- [ ] Publish on your stated cadence for four consecutive weeks — the cadence _is_ the product
- [ ] Write the first "start here" curation once you have ~15 pieces

---

## Appendix A — Definition of done (per content type)

| Type          | Done means                                                                                                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Post          | Title, slug, excerpt, category, 2–6 tags, cover with alt, ≥2 internal links, SEO description, reading time computed, previewed on mobile      |
| Case study    | All nine core sections present, ≥3 metrics with sources, ≥4 captioned gallery images, learnings in all three groups, live/repo links verified |
| Journal entry | `entryDate`, ≥1 topic, `reflection` filled (this is the one non-negotiable field), resources linked                                           |
| Project       | Thumbnail, summary, stack, year, accurate status, at least one working link                                                                   |

## Appendix B — Things that will bite you

| Risk                                                      | Mitigation                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Stale tag/category pages after publishing                 | `pathsFor` must include every taxonomy page the document touches, including its _previous_ tags; add a nightly full revalidate |
| Soft 404s                                                 | Verify the status code with `curl -I`, not the browser                                                                         |
| Three subscribe forms on one page colliding on input `id` | Derive ids from the `source` prop                                                                                              |
| Portable Text emitting an element `.prose` doesn't style  | Style every possible element in Phase 0, before writing content                                                                |
| Double image optimisation (Vercel on top of Sanity)       | Custom `next/image` loader that maps to Sanity params                                                                          |
| Search index drifting from content                        | Nightly content lint that diffs Sanity against `search_documents`                                                              |
| The journal going quiet after month two                   | Lower the bar: 150 words and a filled `reflection` field is a valid entry                                                      |
| Designing against lorem ipsum                             | Seed the dev dataset with real content in Phase 1                                                                              |
| Launching with three posts                                | Content is a Phase 8 requirement, not a follow-up                                                                              |
