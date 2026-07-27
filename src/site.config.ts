/**
 * SPEC §6 / P11 — every piece of standing copy and configuration lives here.
 *
 * This exists so the copy pass touches ONE file instead of forty components.
 * Everything in [square brackets] is a placeholder you must replace before
 * launch (§9.1: "Every [bracketed] placeholder in the codebase replaced").
 */

export const site = {
  /** Used by canonicals, feeds, sitemap and OG images (§4.7). No trailing slash. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  name: "[Your Name]",
  role: "[role]",
  location: "Rotterdam",

  /** §6.1 — the home page statement. One true sentence, not a tagline. */
  statement: "I build software and write about what it teaches me.",

  /** §6.1 — three sentences maximum. First person. */
  intro:
    "I'm [Your Name], a [role] in Rotterdam. I write essays about craft and attention, break down the projects I ship, and keep a public journal of what I'm learning — including the parts that didn't work.",

  /** §4.7 — meta description fallback for the home page. Under 155 characters. */
  description:
    "Essays, case studies and a public learning journal by [Your Name], a [role] in Rotterdam.",

  /** §6.1 — the CURRENTLY strip. Keep it current or delete it; a stale one is worse than none. */
  currently: {
    reading: "[book]",
    building: "[thing]",
    learning: "[topic]",
  },

  /** §6.12 — the newsletter promise. Pick a cadence you can hold for six months. */
  newsletter: {
    heading: "A letter every other Sunday.",
    pitch: "One essay, three things I read, and whatever I'm stuck on.",
    consent:
      "Double opt-in — you'll get a confirmation email. One click to unsubscribe, forever. I never share the list.",
  },

  /** §1.6 — the four content types, in nav order. */
  nav: [
    { label: "Writing", href: "/writing" },
    { label: "Case studies", href: "/case-studies" },
    { label: "Journal", href: "/journal" },
    { label: "Projects", href: "/projects" },
    { label: "About", href: "/about" },
  ],

  /** §6.0 — footer column 3. Remove any you don't actually use. */
  social: [
    { label: "X", href: "https://x.com/[handle]" },
    { label: "Bluesky", href: "https://bsky.app/profile/[handle]" },
    { label: "GitHub", href: "https://github.com/[handle]" },
    { label: "LinkedIn", href: "https://linkedin.com/in/[handle]" },
    { label: "RSS", href: "/rss.xml" },
  ],

  /** §6.0 — footer column 4. */
  meta: [
    { label: "Archive", href: "/archive" },
    { label: "Colophon", href: "/colophon" },
    { label: "Privacy", href: "/privacy" },
  ],

  /** §6.11 — shown on the contact page so people can skip the form. */
  email: "hello@[yourdomain].com",
} as const;

/** §4.5 — named in the footer, because a writer's site should credit its type. */
export const colophon = {
  display: "Bricolage Grotesque",
  body: "Literata",
  mono: "IBM Plex Mono",
} as const;

export type NavItem = (typeof site.nav)[number];
