# Launch runbook — the §9 checklist, with current state

Legend: ✅ built & verified in CI · 🔌 built, needs services connected ·
✍️ yours (content/accounts) · ⬜ do at launch.

## Content (all ✍️ — the spec is blunt: "content is a launch requirement")

- ✍️ 8–10 posts with cover, excerpt, category, 2–6 tags, ≥2 internal links
  (5 seeded dev posts exist as templates; `npm run lint:content` enforces
  the alt/links/tags rules)
- ✍️ 2 case studies with sourced metrics + captioned galleries (1 seeded)
- ✍️ 10+ journal entries with reflections (10 seeded — write real ones)
- ✍️ 6 projects, accurate statuses (4 seeded)
- ✍️ About page in your own voice (create a `page` doc, slug `about`)
- ✍️ Replace every `[bracketed]` placeholder — all in `src/site.config.ts`
  and `public/llms.txt`
- ✍️ 3 featured posts + 2 featured case studies (Studio enforces the caps)

## Design & front end

- ✅ Contrast ≥4.5:1 both themes (documented next to the tokens)
- ✅ prefers-reduced-motion disables all three animations (CSS gate)
- ✅ Focus visible everywhere; fonts subset + preloaded (Literata only)
- ✅ CLS 0 by construction (dimensions on every image)
- ⬜ Eyeball all 14 templates in both themes at 320/768/1440 with REAL content
- ⬜ 200% zoom reflow spot-check on an article

## Functionality

- ✅ Draft 404s publicly / previews with banner (e2e-covered flow)
- ✅ Search typo fallback, palette keyboard flow, archive URL round-trip
  (unit + e2e where runnable)
- 🔌 Publish→live <60s (needs the Sanity webhook configured — PHASE-6-NOTES)
- 🔌 Scheduled publish (hourly cron — deploys with vercel.json + CRON_SECRET)
- 🔌 Subscribe→confirm→audience→unsubscribe against real inboxes
  (PHASE-5-NOTES §Connect)
- ✅ Forms work without JavaScript (e2e-covered)

## SEO & discovery

- ✅ Unique titles/descriptions, canonicals, JSON-LD, sitemap, robots,
  llms.txt, four feeds, OG images — all built (Phase 7)
- ⬜ Rich Results Test + feed validators + OG previewers against the
  deployed site (PHASE-7-NOTES checklist)
- ✅ 404 returns HTTP 404 (e2e asserts the status code)
- 🔌 Content lint green (`npm run lint:content` — nightly-able)

## Ops & security

- ⬜ Env vars in Vercel for Production/Preview/Development (.env.example is
  the canonical list)
- ✅ Webhook HMAC + `_rev` idempotency (unit + code path)
- 🔌 Rate limits verified by trying to break them (needs Upstash)
- 🔌 CSP: set `ENABLE_CSP=true`, check console + securityheaders.com
- ✅ No raw IPs anywhere (hash verified by unit test) — set `IP_HASH_SALT`
  ≥32 bytes
- 🔌 Sentry receiving server events (set SENTRY_DSN; client-side deliberately
  omitted — PHASE-7-NOTES)
- 🔌 Weekly dataset export (backup.yml — add SANITY_AUTH_TOKEN +
  SANITY_PROJECT_ID repo secrets; test one restore)
- ⬜ Neon PITR confirmed in the Neon console
- ⬜ Cron logs after first run
- ✍️ Privacy page that matches reality (page doc, slug `privacy`)

## Quality gates (CI, running now)

- ✅ typecheck · lint · format · 94 unit/component tests · **coverage ≥80%
  on src/lib** (91% lines) · build · **JS ≤115 KB on the article route**
  (113.5; the spec's 90 KB is below the framework floor — PHASE-0-NOTES)
- ✅ Playwright + axe job (chromium in CI; run `npm run e2e` locally for
  webkit + mobile) — zero serious/critical axe violations on every
  reachable template, both themes
- 🔌 Lighthouse CI job present, `continue-on-error` until real content —
  flip to blocking here and in Vercel before launch
- 🔌 Visual snapshots: `VISUAL=1 npm run e2e:chromium` once seeded content
  is stable, commit the baselines

## Launch day (§9.2) — run top to bottom in production

The ten-step smoke test lives in SPEC §9.2 verbatim; nothing in it needs
tooling beyond a phone, an inbox and `curl -I`.
