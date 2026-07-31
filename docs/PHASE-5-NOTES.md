# Phase 5 — build notes

Exit criterion from the spec: _"subscribe → confirmation email → confirm →
appears in Resend audience → unsubscribe in one click, all verified against
real inboxes."_ The code path is complete and unit-tested; the real-inbox
run needs the four service accounts below (only you can create them).

## What was built

| Area       | Files                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database   | `src/db/schema.ts` — the §5.2 DDL in Drizzle (subscribers + events, contact_messages, page_views, search_documents, search_queries, webhook_deliveries); `drizzle/0000` (with citext/pg_trgm/pgcrypto extensions), `drizzle/0001` (tsv generated column, GIN + trigram indexes, content_popularity MV); Neon HTTP driver, lazily initialised |
| Validation | `src/lib/validators.ts` — Zod schemas shared client/server, §6.11/§6.12 error copy verbatim, honeypot field                                                                                                                                                                                                                                  |
| Security   | `src/lib/form-security.ts` (sha256 ip+salt — raw IPs never stored; 48h confirm tokens), `rate-limit.ts` (Upstash sliding windows: 5/10min subscribe, 3/hr contact, 20/hr confirm), `turnstile.ts` (server verify)                                                                                                                            |
| Email      | `src/emails/` — ConfirmSubscription + ContactNotification (React Email); `src/lib/mailer.ts` — Resend with a dev fallback that logs the confirm URL to the console                                                                                                                                                                           |
| Actions    | `subscribeToNewsletter` (double opt-in, always the same success message — no email enumeration; bots get a fake success), `sendContactMessage` (store + notify, reply-to = sender)                                                                                                                                                           |
| Routes     | `GET /api/newsletter/confirm` (token + expiry → confirmed → Resend contact → result page), `GET/POST /api/newsletter/unsubscribe` (one click; POST serves RFC 8058 List-Unsubscribe)                                                                                                                                                         |
| Forms      | `SubscribeForm` — three variants (footer/inline/block) with per-source ids and §5.7 source tracking; `ContactForm` — visible labels, aria-describedby/invalid, role=alert summary, focus-first-invalid; both on `useActionState`, working without JS                                                                                         |
| Pages      | `/newsletter` (pitch → benefits → form → archive → won't-do → FAQ), `/newsletter/confirm` + `/unsubscribed` (noindex results), `/contact` (§6.11 two-column)                                                                                                                                                                                 |
| Wiring     | The Phase 0 footer link and every SubscribeBlock became real forms with sources: footer, home, writing, journal, post:slug, newsletter-page                                                                                                                                                                                                  |
| Tests      | 67 unit tests (11 new: schema copy, honeypot, ip hashing determinism, token/expiry)                                                                                                                                                                                                                                                          |

## Every form state, and where it comes from

idle (initial `FormState`) · loading (`useActionState` pending → "Sending…"/
"Subscribing…") · field error (Zod, exact §6 copy, aria wiring) ·
rate-limited (Upstash, §6.11 copy with the email escape hatch) · server
error (catch-all with an email fallback) · success (role="status") ·
already-subscribed (same success as everyone — see below).

## Decisions that deviate from the spec, with reasons

### 1. "Already subscribed" is indistinguishable from success

§6.12's copy shows "You're already on the list. [Resend?]" — but §5.4
mandates "always return the same success message (no email enumeration)",
and the two can't both hold: revealing already-subscribed IS enumeration.
The security row wins. A confirmed address that subscribes again gets the
standard success message and no email; pending ones get a fresh confirm
link.

### 2. Everything degrades gracefully without credentials

Missing Upstash → limits open (warned once). Missing Turnstile keys → check
skipped (the §6.11 "documented fallback"); honeypot and rate limits still
stand. Missing Resend → the confirm URL is logged to the server console, so
the whole flow is walkable in dev. Missing DATABASE_URL → the forms return
an honest "not wired up yet — email me" error instead of pretending. None of
these are silent in production logs.

### 3. Turnstile is hand-rolled, not a wrapper library

The widget is a ~50-line client component that injects Cloudflare's script
and renders into a div. A wrapper dependency would be larger than the code
it wraps.

### 4. `subscriber_events.meta` and search tables ship now, consumers later

The §5.2 DDL is implemented in full (per P2 "matching the DDL exactly"),
including `search_documents` + tsv and `content_popularity` — their
consumers are Phase 6 (search) and Phase 7 (webhook, nightly cron). Shipping
the schema now means those phases are additive, not migratory.

## Connect the services (in this order)

1. **Neon** — create a project, copy the pooled connection string into
   `DATABASE_URL`, run `npm run db:migrate` (applies both migrations,
   including extensions).
2. **Resend** — API key + verified sending domain → `RESEND_API_KEY`,
   `EMAIL_FROM`, `EMAIL_TO_CONTACT`; create an Audience →
   `RESEND_AUDIENCE_ID`.
3. **Upstash** — a Redis database → `UPSTASH_REDIS_REST_URL` / `_TOKEN`.
4. **Turnstile** — a widget (non-interactive) →
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
5. Set `IP_HASH_SALT` to any long random string.

Then the exit-criterion run: subscribe on `/newsletter` with a real address
(Gmail, Outlook, Apple Mail per spec) → confirmation email → click → check
the Resend audience → unsubscribe from the result of
`/api/newsletter/unsubscribe?token=…` (token is in the subscribers table).
Without any of it, `npm run dev` still walks the flow: the confirm URL
appears in the terminal.
