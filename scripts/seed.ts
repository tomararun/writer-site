/**
 * Seed the development dataset (SPEC Phase 1): 5 posts, 1 case study,
 * 10 journal entries, 4 projects, plus author, categories, tags, series,
 * resources, site settings and an About page.
 *
 * Real-ish content, not lorem ipsum — Phases 2 and 3 are designed against it.
 *
 * Usage:
 *   npm run seed
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 *   SANITY_API_WRITE_TOKEN (Editor role)
 *
 * Idempotent: every document has a fixed `seed-*` id and is createOrReplace'd.
 * Derived fields are computed with the same functions the Studio publish
 * action uses, so seeded documents look exactly like published ones.
 */
import { createClient } from "@sanity/client";
import {
  countWordsInPortableText,
  extractHeadings,
  toPlainText,
} from "../src/lib/portable-text";
import { readingTime } from "../src/lib/reading-time";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "development";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    [
      "Missing Sanity credentials. In .env.local set:",
      "  NEXT_PUBLIC_SANITY_PROJECT_ID=<your project id>",
      "  NEXT_PUBLIC_SANITY_DATASET=development",
      "  SANITY_API_WRITE_TOKEN=<token with Editor role>",
      "Create the token at https://sanity.io/manage → API → Tokens.",
    ].join("\n"),
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-10-01",
  useCdn: false,
});

/* ── Portable Text helpers ────────────────────────────────────────────── */

let keyCounter = 0;
const key = () => `seed${(keyCounter++).toString(36).padStart(5, "0")}`;

type Span = { _type: "span"; _key: string; text: string; marks: string[] };
type Block = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: unknown[];
  children: (Span | object)[];
  listItem?: string;
  level?: number;
};

const span = (text: string, marks: string[] = []): Span => ({
  _type: "span",
  _key: key(),
  text,
  marks,
});

const block = (text: string, style = "normal"): Block => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [span(text)],
});

const h2 = (text: string) => block(text, "h2");
const h3 = (text: string) => block(text, "h3");
const quote = (text: string) => block(text, "blockquote");

const bullet = (text: string): Block => ({ ...block(text), listItem: "bullet", level: 1 });

const pullQuote = (text: string, emphasis = false) => ({
  _type: "pullQuote",
  _key: key(),
  text,
  emphasis,
});

const callout = (variant: string, title: string, body: string) => ({
  _type: "calloutBox",
  _key: key(),
  variant,
  title,
  body: [block(body)],
});

const code = (
  language: string,
  filename: string | null,
  codeText: string,
  caption?: string,
) => ({
  _type: "codeBlock",
  _key: key(),
  language,
  ...(filename ? { filename } : {}),
  code: codeText,
  ...(caption ? { caption } : {}),
});

/** A paragraph with an inline footnote after the first sentence. */
function withFootnote(before: string, note: string, after: string): Block {
  return {
    _type: "block",
    _key: key(),
    style: "normal",
    markDefs: [],
    children: [
      span(before),
      { _type: "footnote", _key: key(), body: [block(note)] },
      span(after),
    ],
  };
}

const ref = (id: string) => ({ _type: "reference", _ref: id, _key: key() });
const singleRef = (id: string) => ({ _type: "reference", _ref: id });

function derived(body: unknown[]) {
  const plainText = toPlainText(body);
  return {
    readingTime: readingTime(plainText),
    wordCount: countWordsInPortableText(body),
    plainText,
    headings: extractHeadings(body),
  };
}

/* ── Cover images: generated SVG placeholders, uploaded as assets ─────── */

function coverSvg(title: string, bg: string, fg: string): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${bg}"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="${fg}" stroke-width="2"/>
  <text x="80" y="330" font-family="Georgia, serif" font-size="56" fill="${fg}">${title}</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

async function uploadCover(
  id: string,
  title: string,
  bg: string,
  fg: string,
): Promise<string | null> {
  try {
    const asset = await client.assets.upload("image", coverSvg(title, bg, fg), {
      filename: `${id}.svg`,
    });
    return asset._id;
  } catch (error) {
    console.warn(`  ! cover upload failed for ${id} (continuing without): ${String(error)}`);
    return null;
  }
}

function figure(assetId: string | null, alt: string, layout = "inline") {
  if (!assetId) return undefined;
  return { _type: "figure", asset: singleRef(assetId), alt, layout };
}

/* ── Dates: fixed, in the past, spread over recent months ─────────────── */

const iso = (d: string) => `${d}T09:00:00Z`;

/* ── Seed row types ───────────────────────────────────────────────────── */

type SeedFigure = ReturnType<typeof figure>;

type SeedPost = {
  _id: string;
  title: string;
  slug: string;
  kind: "essay" | "tutorial" | "reflection" | "opinion";
  excerpt: string;
  category: string;
  tags: string[];
  featured: boolean;
  coverImage?: SeedFigure;
  series?: { series: ReturnType<typeof singleRef>; order: number };
  publishedAt: string;
  body: unknown[];
};

type SeedJournal = {
  date: string;
  slug: string;
  title: string;
  topics: string[];
  mood: "breakthrough" | "grinding" | "stuck" | "curious";
  timeSpent: number;
  body: unknown[];
  reflection: string;
  resources?: string[];
  code?: ReturnType<typeof code>;
};

type SeedProject = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  year: number;
  status: "live" | "wip" | "archived";
  stack: string[];
  thumbnail?: SeedFigure;
  links?: { _type: "link"; _key: string; label: string; href: string; kind: string }[];
  caseStudy?: ReturnType<typeof singleRef>;
  featured: boolean;
};

/* ── Seed data ────────────────────────────────────────────────────────── */

async function main() {
  console.log(`Seeding ${projectId}/${dataset} …`);

  const tx = client.transaction();

  /* Author */
  tx.createOrReplace({
    _id: "seed-author-alex",
    _type: "author",
    name: "Alex",
    slug: { current: "alex" },
    bio: [
      block(
        "I build software and write about what it teaches me. Essays about craft and attention, case studies of shipped work, and a public journal of what I'm learning.",
      ),
    ],
    links: [
      {
        _type: "link",
        _key: key(),
        label: "GitHub",
        href: "https://github.com/tomararun",
        kind: "external",
      },
    ],
  });

  /* Site settings singleton */
  tx.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    siteName: "Alex",
    description: "Essays, case studies and a public learning journal by Alex.",
    nav: [
      { _type: "link", _key: key(), label: "Writing", href: "/writing", kind: "internal" },
      {
        _type: "link",
        _key: key(),
        label: "Case studies",
        href: "/case-studies",
        kind: "internal",
      },
      { _type: "link", _key: key(), label: "Journal", href: "/journal", kind: "internal" },
      { _type: "link", _key: key(), label: "Projects", href: "/projects", kind: "internal" },
      { _type: "link", _key: key(), label: "About", href: "/about", kind: "internal" },
    ],
    socialLinks: [
      {
        _type: "link",
        _key: key(),
        label: "GitHub",
        href: "https://github.com/tomararun",
        kind: "external",
        rel: "me",
      },
      { _type: "link", _key: key(), label: "RSS", href: "/rss.xml", kind: "internal" },
    ],
    flags: { showViewCounts: false, showNewsletterSignup: true },
  });

  /* Categories — the fixed shelves */
  const categories = [
    {
      id: "seed-category-craft",
      title: "Craft",
      description: "How software gets made well: code, design, and the habits between them.",
    },
    {
      id: "seed-category-systems",
      title: "Systems",
      description: "Architecture, tooling and infrastructure — the load-bearing decisions.",
    },
    {
      id: "seed-category-attention",
      title: "Attention",
      description: "Reading, focus, and building for people who actually read.",
    },
    {
      id: "seed-category-practice",
      title: "Practice",
      description: "Careers, learning in public, and the working life around the work.",
    },
  ];
  for (const c of categories) {
    tx.createOrReplace({
      _id: c.id,
      _type: "category",
      title: c.title,
      slug: { current: c.title.toLowerCase() },
      description: c.description,
    });
  }

  /* Tags — the loose threads */
  const tagTitles = [
    "TypeScript",
    "React",
    "Next.js",
    "Design systems",
    "Typography",
    "Performance",
    "Accessibility",
    "Testing",
    "Writing",
    "Reading",
    "Tooling",
    "Career",
  ];
  const tagId = (title: string) =>
    `seed-tag-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  for (const title of tagTitles) {
    tx.createOrReplace({
      _id: tagId(title),
      _type: "tag",
      title,
      slug: { current: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    });
  }

  /* Series */
  tx.createOrReplace({
    _id: "seed-series-typography",
    _type: "series",
    title: "Typography for developers",
    slug: { current: "typography-for-developers" },
    description:
      "A working developer's guide to type: the few decisions that matter, in the order they matter.",
  });

  /* Resources */
  const resources = [
    {
      id: "seed-resource-elements",
      title: "The Elements of Typographic Style",
      kind: "book",
      author: "Robert Bringhurst",
      note: "The measure chapter alone justified the price. Changed how I set line length everywhere.",
      rating: 5,
    },
    {
      id: "seed-resource-practical-typography",
      title: "Practical Typography",
      kind: "article",
      author: "Matthew Butterick",
      url: "https://practicaltypography.com",
      note: "The most actionable writing on type online. Free, and better than most paid courses.",
      rating: 5,
    },
    {
      id: "seed-resource-groq-docs",
      title: "GROQ specification",
      kind: "paper",
      author: "Sanity",
      url: "https://sanity-io.github.io/GROQ/",
      note: "Reading the actual spec cleared up projections in a way the tutorials never did.",
      rating: 4,
    },
    {
      id: "seed-resource-total-typescript",
      title: "Total TypeScript",
      kind: "course",
      author: "Matt Pocock",
      url: "https://totaltypescript.com",
      note: "Where I finally understood conditional types instead of pattern-matching my way through.",
      rating: 5,
    },
    {
      id: "seed-resource-tailwind-repo",
      title: "tailwindcss (source)",
      kind: "repo",
      author: "Tailwind Labs",
      url: "https://github.com/tailwindlabs/tailwindcss",
      note: "Reading how v4 resolves theme values taught me more than the docs did.",
      rating: 4,
    },
    {
      id: "seed-resource-web-typography-talk",
      title: "Web Typography — beyond the basics",
      kind: "video",
      author: "Richard Rutter",
      url: "https://www.youtube.com/watch?v=8J6EdpXdzqc",
      note: "The vertical rhythm section is the part I keep coming back to.",
      rating: 4,
    },
  ];
  for (const r of resources) {
    tx.createOrReplace({
      _id: r.id,
      _type: "resource",
      title: r.title,
      kind: r.kind,
      ...(r.url ? { url: r.url } : {}),
      author: r.author,
      note: r.note,
      rating: r.rating,
    });
  }

  /* Covers (uploaded outside the transaction, before commit) */
  console.log("Uploading cover images …");
  const coverMeasure = await uploadCover(
    "seed-cover-measure",
    "The 66-Character Rule",
    "#e6e8ea",
    "#0f1620",
  );
  const coverBudget = await uploadCover(
    "seed-cover-budget",
    "Attention Is a Budget",
    "#0f1418",
    "#dee4e9",
  );
  const coverCase = await uploadCover(
    "seed-cover-case",
    "Rebuilding the Reading Page",
    "#1d3fa8",
    "#e6e8ea",
  );
  const coverProject1 = await uploadCover(
    "seed-cover-writer-site",
    "writer-site",
    "#171d23",
    "#93aaff",
  );
  const coverProject2 = await uploadCover(
    "seed-cover-readlog",
    "readlog",
    "#ede05f",
    "#0f1620",
  );

  /* ── Posts (5) ──────────────────────────────────────────────────────── */

  const posts: SeedPost[] = [
    {
      _id: "seed-post-66-character-rule",
      title: "The 66-character rule, and when to break it",
      slug: "the-66-character-rule",
      kind: "essay",
      excerpt:
        "Line length governs reading comfort more than font size does. Why 66 characters became the default, and the three cases where it shouldn't be.",
      category: "seed-category-attention",
      tags: ["Typography", "Design systems", "Accessibility"],
      featured: true,
      coverImage: figure(
        coverMeasure,
        "Placeholder cover: the words 'The 66-Character Rule' on cool grey paper.",
      ),
      series: { series: singleRef("seed-series-typography"), order: 1 },
      publishedAt: iso("2026-06-14"),
      body: [
        block(
          "Every serious book you have ever read set its text somewhere between 45 and 75 characters per line. This is not a coincidence and it is not a convention. It is the physical geometry of reading: the distance a pair of eyes can travel before the return sweep to the next line starts costing comprehension.",
        ),
        withFootnote(
          "Bringhurst puts the ideal at 66 characters, and most book designers treat that number the way carpenters treat a level.",
          "The Elements of Typographic Style, section 2.1.2 — 'Anything from 45 to 75 characters is widely regarded as a satisfactory length of line.'",
          " On the web we mostly ignore it, because screens are wide and CSS defaults to filling them.",
        ),
        h2("What the measure actually buys you"),
        block(
          "A constrained measure is doing three jobs at once. It keeps the return sweep short enough that readers don't lose their place. It creates a consistent rhythm of fixations — roughly ten to twelve per line — that lets reading become automatic. And it leaves margin, which is not wasted space but working space: the place annotations, footnotes and figures live.",
        ),
        pullQuote(
          "The margin is not what's left over after the text. It is the text's working space.",
          true,
        ),
        block(
          "When a layout lets lines run to 120 characters, none of that survives. Readers start skimming not because they're lazy but because the geometry makes continuous reading physically expensive.",
        ),
        h2("Three honest exceptions"),
        h3("Code"),
        block(
          "Code is not prose. It is read structurally, by shape, and an 80–100 column block preserves the shapes programmers recognise. Wrapping code at 66 characters destroys information.",
        ),
        h3("Tables"),
        block(
          "Tabular data wants width in proportion to its columns. Squeezing a six-column comparison into a prose measure produces the worst of both worlds.",
        ),
        h3("Headlines"),
        block(
          "Display type at 44px+ reads by the phrase, not the fixation. A headline can and often should run wider than the body under it — capping it at the prose measure makes it wrap in awkward, meaning-breaking places.",
        ),
        callout(
          "note",
          "Implementation",
          "In CSS, set the measure in ch units on the paragraph container — max-width: 66ch — and let the gutters grow. The measure should never be a percentage of the viewport.",
        ),
        h2("The uncomfortable conclusion"),
        block(
          "Most sites don't have a line-length problem because someone decided against the measure. They have one because nobody decided anything. The default is the full container, the container is the viewport, and the viewport is whatever the reader's monitor happens to be. Deciding, once, is a one-line fix that outranks almost any other typographic improvement you can ship.",
        ),
      ],
    },
    {
      _id: "seed-post-attention-budget",
      title: "Attention is a budget your page spends",
      slug: "attention-is-a-budget",
      kind: "opinion",
      excerpt:
        "Every element on a page withdraws from the same account. Most sites are overdrawn before the reader reaches the first paragraph.",
      category: "seed-category-attention",
      tags: ["Writing", "Performance", "Design systems"],
      featured: true,
      coverImage: figure(
        coverBudget,
        "Placeholder cover: the words 'Attention Is a Budget' reversed out of dark ink.",
      ),
      publishedAt: iso("2026-05-02"),
      body: [
        block(
          "A reader arrives with a fixed amount of attention. Not a metaphorical amount — a measurable one, spent in fixations and decisions. Every element on the page withdraws from that account: every navigation item, every card, every animation, every 'related' widget elbowing into the column.",
        ),
        block(
          "The uncomfortable accounting is that chrome spends the budget before content gets a turn. A sticky header costs a little. A newsletter interstitial costs a lot. An autoplaying video is a mugging.",
        ),
        h2("The ledger, not the vibe"),
        block(
          "Minimalism gets discussed as an aesthetic, which lets teams dismiss it as taste. It is not taste. It is a ledger. When you remove an element, the attention it was consuming gets redistributed to what remains — which is why a page with one loud element reads as intentional and a page with nine reads as noise.",
        ),
        pullQuote("Restraint is not a style. It is a spending decision."),
        block(
          "This site allows itself exactly one loud element: a highlighter. It appears in five places, and its scarcity is what makes it legible. If everything can be highlighted, nothing is.",
        ),
        h2("What this means for writers who code"),
        bullet(
          "Cut chrome before you compress prose. The nav item you delete buys more reading than the sentence you tighten.",
        ),
        bullet("Let one thing be loud. Choose it deliberately, then defend it."),
        bullet(
          "Count round trips of the eye, not just of the network. Layout shift is an attention tax with interest.",
        ),
        block(
          "None of this is new. Book designers solved it centuries ago with margins, measures and a near-total absence of interface. The web's advantage is that we can do all of that and still ship search, feeds and a reading progress bar. The failure mode is thinking the advantage means we must.",
        ),
      ],
    },
    {
      _id: "seed-post-typed-groq",
      title: "Typed GROQ end to end: typegen without the ceremony",
      slug: "typed-groq-end-to-end",
      kind: "tutorial",
      excerpt:
        "How to get compile-time types from your CMS queries with sanity-typegen: schema extraction, defineQuery, and the two traps that cost me an afternoon.",
      category: "seed-category-systems",
      tags: ["TypeScript", "Next.js", "Tooling"],
      featured: false,
      publishedAt: iso("2026-04-11"),
      body: [
        block(
          "The promise: write a GROQ query as a string, get a precise TypeScript type for its result, no manual interfaces, no drift. The delivery is real, but the docs scatter the setup across three pages. Here is the whole thing in one pass.",
        ),
        h2("Extract, then generate"),
        block(
          "Typegen is a two-step pipeline. First the CLI compiles your Studio schema to JSON; then it statically evaluates every defineQuery in the codebase against that JSON.",
        ),
        code(
          "bash",
          null,
          "sanity schema extract --path=.sanity/schema.json\nsanity typegen generate",
          "Two commands, wired into one npm script in this project.",
        ),
        block(
          "The generated file augments @sanity/client, so client.fetch(query) — with the literal query string type — returns the right shape with zero annotations at the call site.",
        ),
        h2("The two traps"),
        h3("Interpolation breaks evaluation"),
        block(
          "Typegen evaluates queries statically. The moment you build a query with template interpolation, evaluation fails silently and you get 'unknown'. Repeat the projection inline instead — verbosity is the price of types you can trust.",
        ),
        h3("Params are your job"),
        code(
          "typescript",
          "src/sanity/lib/queries.ts",
          `export const postBySlugQuery = defineQuery(\`
  *[_type == "post" && slug.current == $slug][0]{ title, body }
\`);`,
          "The $slug param is typed as required — but only its presence, not its type.",
        ),
        callout(
          "warning",
          "Check generated output into git",
          "Generate types in CI or commit the output. If neither, every teammate's editor disagrees about what compiles.",
        ),
        h2("Was it worth it?"),
        block(
          "Once, a renamed schema field broke four queries. The compiler listed all four before the dev server had restarted. That is the entire argument: the CMS stops being a stringly-typed stranger and becomes part of the program.",
        ),
      ],
    },
    {
      _id: "seed-post-reading-2026",
      title: "What I learned re-reading my own drafts",
      slug: "rereading-my-own-drafts",
      kind: "reflection",
      excerpt:
        "Six months of unpublished drafts, read in one sitting. The patterns were embarrassing, instructive, and — in two cases — worth publishing.",
      category: "seed-category-practice",
      tags: ["Writing", "Reading", "Career"],
      featured: false,
      publishedAt: iso("2026-03-08"),
      body: [
        block(
          "I keep every draft, including the abandoned ones. Last weekend I read six months of them in one sitting, oldest first, the way you'd review someone else's work. Recommended and uncomfortable, in that order.",
        ),
        h2("Pattern one: the first section is always throat-clearing"),
        block(
          "Nearly every draft opens with two paragraphs of context nobody asked for. The piece actually starts at the third paragraph, where something is claimed. The fix is mechanical: write the opening, then delete it and see if anything is missed. It never is.",
        ),
        h2("Pattern two: abandoned drafts die at the evidence"),
        block(
          "The drafts I abandoned all died at the same point — where an argument needed an example I didn't have. The claim was fine; the supporting material wasn't collected. This is a research failure, not a writing failure, and it happens days before the writing session that discovers it.",
        ),
        quote(
          "A draft doesn't fail when you stop writing it. It fails earlier, when you stop gathering for it.",
        ),
        h2("Pattern three: two of them were finished"),
        block(
          "Two drafts I remembered as failures were, on re-read, done. What they were missing wasn't words — it was the nerve to publish an opinion that might be wrong. One of them is now the most-shared thing I've written. The lesson generalises: the archive of 'not quite ready' contains disproportionate value, because the filter that held it back was fear, not quality.",
        ),
      ],
    },
    {
      _id: "seed-post-fluid-type",
      title: "Fluid type scales that don't drift",
      slug: "fluid-type-scales-that-dont-drift",
      kind: "tutorial",
      excerpt:
        "clamp() makes headings interpolate between breakpoints — and makes them drift off your scale in between. How to build a fluid scale you can still reason about.",
      category: "seed-category-craft",
      tags: ["Typography", "Design systems", "Performance"],
      featured: false,
      series: { series: singleRef("seed-series-typography"), order: 2 },
      publishedAt: iso("2026-02-01"),
      body: [
        block(
          "Fluid type is the rare CSS feature that is both genuinely better and genuinely dangerous. Better, because headings that interpolate between viewport sizes remove an entire class of breakpoint fiddling. Dangerous, because between the endpoints your carefully chosen scale doesn't exist — every intermediate viewport renders sizes nobody chose.",
        ),
        h2("Anchor the endpoints, then check the middle"),
        block(
          "A fluid step is safe when its endpoints sit on the scale and its slope is gentle enough that the middle never collides with the next step up or down. That gives you two rules: derive the clamp() from scale values, never invent them; and keep the growth rate of adjacent steps similar.",
        ),
        code(
          "css",
          "globals.css",
          `--text-xl: clamp(1.6875rem, 1.35rem + 1.7vw, 2.125rem); /* 27 → 34 */
--text-2xl: clamp(2.125rem, 1.6rem + 2.6vw, 2.75rem);   /* 34 → 44 */`,
          "Adjacent steps with proportional slopes cannot cross.",
        ),
        callout(
          "update",
          "Body text stays fixed",
          "Only display sizes are fluid. Body copy is 19px at every width — reading size is a constant, not a proportion of the screen.",
        ),
        h2("Test at the awkward widths"),
        block(
          "Nobody designs at 913px, which is exactly why you should look there. The failure mode of fluid type is always at the widths between the ones on the design file. A ten-second resize pass catches what the math missed.",
        ),
      ],
    },
  ];

  for (const p of posts) {
    tx.createOrReplace({
      _id: p._id,
      _type: "post",
      title: p.title,
      slug: { current: p.slug },
      kind: p.kind,
      excerpt: p.excerpt,
      body: p.body,
      ...(p.coverImage ? { coverImage: p.coverImage } : {}),
      author: singleRef("seed-author-alex"),
      category: singleRef(p.category),
      tags: p.tags.map((t) => ref(tagId(t))),
      ...(p.series ? { series: p.series } : {}),
      status: "published",
      publishedAt: p.publishedAt,
      featured: p.featured,
      ...derived(p.body as unknown[]),
    });
  }

  /* ── Case study (1) ─────────────────────────────────────────────────── */

  const caseBackground = [
    block(
      "My previous site was a theme: fast to launch, impossible to love. Body text ran 90 characters wide, every post looked identical regardless of kind, and the case studies were screenshots with captions. Analytics said what the design suggested — readers arrived, scrolled a screen, left.",
    ),
  ];
  const caseProblem = [
    block(
      "The site's one job is to make reading effortless enough that people finish. Finishing is the metric behind every other metric: subscribers, replies, work inquiries. The old layout taxed reading at every level — line length, contrast, rhythm — and no amount of better writing could out-write the geometry.",
    ),
  ];
  const caseImplementation = [
    block(
      "The rebuild is a Next.js App Router site with design tokens as CSS custom properties, bridged into Tailwind v4 via @theme inline. Every colour and size lives in one file. The reading page is a named three-track grid — rail, prose, margin — where the rail is navigation and sits after the article in the DOM.",
    ),
    code(
      "css",
      "globals.css",
      `--measure-prose: 66ch;
--track-rail: 6rem;
--track-margin: 16rem;`,
      "Three tokens carry the entire reading layout.",
    ),
    block(
      "Fonts are three faces with three jobs — grotesque for chrome, book face for prose, mono for metadata — self-hosted and subset. The theme switches without a flash via a two-line inline script that runs before first paint.",
    ),
  ];
  const caseOutcomes = [
    block(
      "The measurable outcomes are in the metrics band. The unmeasurable one is that the site now has a point of view: chrome is software, prose is print, and one highlighter is allowed to be loud. Every future phase — search, newsletter, archive — has a system to land in instead of a theme to fight.",
    ),
  ];

  tx.createOrReplace({
    _id: "seed-case-reading-page",
    _type: "caseStudy",
    title: "Rebuilding the reading page",
    slug: { current: "rebuilding-the-reading-page" },
    excerpt:
      "Replacing a theme with a system: design tokens, a three-track article grid, and a type scale built for finishing — not skimming.",
    client: "Personal project",
    role: ["Design", "Frontend", "Writing"],
    timeframe: { start: "2026-06-01", ongoing: true },
    stack: ["Next.js 15", "TypeScript", "Tailwind CSS v4", "Sanity"],
    ...(figure(coverCase, "Placeholder cover: 'Rebuilding the Reading Page' on ink blue.")
      ? {
          coverImage: figure(
            coverCase,
            "Placeholder cover: 'Rebuilding the Reading Page' on ink blue.",
          ),
          heroMedia: figure(
            coverCase,
            "Placeholder hero: 'Rebuilding the Reading Page' on ink blue.",
            "wide",
          ),
        }
      : {}),
    background: caseBackground,
    problem: caseProblem,
    constraints: [
      "Zero budget — free tiers only",
      "Evenings and weekends, ~8 hours/week",
      "Solo: design, code and content by one person",
      "Must stay under 115 KB of JavaScript on the article route",
    ],
    process: [
      {
        _type: "processStep",
        _key: key(),
        phase: "Research",
        title: "Read like a designer for two weeks",
        body: [
          block(
            "Collected the twelve sites I actually finish articles on and measured them: line length, type size, contrast, chrome weight. The pattern was embarrassingly consistent — around 66 characters, 18px+, and almost no interface.",
          ),
        ],
        duration: "2 weeks",
      },
      {
        _type: "processStep",
        _key: key(),
        phase: "System",
        title: "Tokens before components",
        body: [
          block(
            "Wrote the entire visual language as CSS custom properties before building a single component: seven colours, ten type sizes, three layout tracks. Every later decision became a lookup instead of a debate.",
          ),
        ],
        duration: "1 week",
      },
      {
        _type: "processStep",
        _key: key(),
        phase: "Build",
        title: "The article grid, DOM-order first",
        body: [
          block(
            "Built the three-track grid with named placement so the rail — which is navigation — could sit after the article in the DOM while appearing to its left. Screen readers get the article first; sighted readers get the map.",
          ),
        ],
        duration: "2 weeks",
      },
      {
        _type: "processStep",
        _key: key(),
        phase: "Verify",
        title: "Budgets as CI gates",
        body: [
          block(
            "Encoded the constraints as failing checks: a JS budget measured from the build manifest, contrast ratios documented next to the tokens, Lighthouse accessibility at 100 as the phase exit. What isn't gated regresses.",
          ),
        ],
        duration: "1 week",
      },
    ],
    implementation: caseImplementation,
    outcomes: caseOutcomes,
    metrics: [
      {
        _type: "metric",
        _key: key(),
        label: "JavaScript on the article route",
        value: "105",
        unit: "KB gzip",
        delta: "−58%",
        note: "vs. the previous theme's 250 KB",
        source: "CI budget gate, app-build-manifest",
      },
      {
        _type: "metric",
        _key: key(),
        label: "Lighthouse accessibility",
        value: "100",
        note: "both themes, three widths",
        source: "Lighthouse 12, median of 5 runs",
      },
      {
        _type: "metric",
        _key: key(),
        label: "Cumulative layout shift",
        value: "0.00",
        note: "article route, cold load",
        source: "Chrome DevTools, throttled 4G",
      },
      {
        _type: "metric",
        _key: key(),
        label: "Body line length",
        value: "66",
        unit: "ch",
        delta: "−24ch",
        note: "was ~90ch in the old theme",
        source: "Measured at 1440px",
      },
    ],
    learnings: [
      {
        _type: "learning",
        _key: key(),
        title: "Tokens-first made every later decision cheaper",
        body: "With colour and type locked in custom properties, component work became assembly. The debates happened once, in one file.",
        sentiment: "worked",
      },
      {
        _type: "learning",
        _key: key(),
        title: "Designing against placeholder copy hid real problems",
        body: "Card layouts that looked balanced with fake titles broke against real ones. Should have seeded real content before building indexes.",
        sentiment: "didntWork",
      },
      {
        _type: "learning",
        _key: key(),
        title: "Would set the JS budget before choosing the stack",
        body: "The framework floor is ~100 KB before a line of app code. Next time the budget conversation happens first, not at CI time.",
        sentiment: "wouldChange",
      },
    ],
    links: [
      {
        _type: "link",
        _key: key(),
        label: "Source on GitHub",
        href: "https://github.com/tomararun/writer-site",
        kind: "external",
      },
    ],
    author: singleRef("seed-author-alex"),
    tags: [ref(tagId("Design systems")), ref(tagId("Typography")), ref(tagId("Next.js"))],
    status: "published",
    publishedAt: iso("2026-07-20"),
    featured: true,
    ...derived([...caseBackground, ...caseProblem, ...caseImplementation, ...caseOutcomes]),
  });

  /* ── Journal entries (10) ───────────────────────────────────────────── */

  const journal: SeedJournal[] = [
    {
      date: "2026-07-24",
      slug: "grid-named-areas",
      title: "Named grid areas beat column counting",
      topics: ["Design systems", "Accessibility"],
      mood: "breakthrough",
      timeSpent: 90,
      body: [
        block(
          "Rebuilt the article grid with named placement instead of column indexes. The win isn't elegance — it's that DOM order and visual order can finally disagree on purpose: rail after article for screen readers, left of it for everyone else.",
        ),
      ],
      reflection:
        "Accessibility work keeps turning out to be information architecture in disguise. The grid was never the hard part; deciding what order things mean was.",
    },
    {
      date: "2026-07-18",
      slug: "clamp-drift",
      title: "clamp() drift between breakpoints",
      topics: ["Typography"],
      mood: "grinding",
      timeSpent: 120,
      body: [
        block(
          "Spent two hours chasing why h2 and h3 nearly converge at 900px. The slopes of adjacent clamp() steps weren't proportional, so the scale collapses mid-viewport. Fixed by deriving slopes from the same ratio.",
        ),
      ],
      reflection:
        "Fluid values need invariants, not just endpoints. If two values must never cross, that constraint has to be in the math, not in the hope.",
      resources: ["seed-resource-practical-typography"],
    },
    {
      date: "2026-07-11",
      slug: "sanity-typegen-first-run",
      title: "First run of sanity-typegen",
      topics: ["TypeScript", "Tooling"],
      mood: "curious",
      timeSpent: 60,
      body: [
        block(
          "Wired schema extract + typegen generate into the verify script. The generated types are stricter than what I'd have written by hand — nullability everywhere a projection can miss.",
        ),
      ],
      reflection:
        "Generated strictness is a gift: every '| null' in the output is a runtime case I'd have discovered in production instead.",
      resources: ["seed-resource-groq-docs"],
      code: code(
        "bash",
        null,
        "sanity schema extract --path=.sanity/schema.json && sanity typegen generate",
      ),
    },
    {
      date: "2026-07-04",
      slug: "groq-projections",
      title: "GROQ projections are the API layer",
      topics: ["Tooling", "Performance"],
      mood: "breakthrough",
      timeSpent: 75,
      body: [
        block(
          "Stopped fetching documents and shaping them in JS. The projection is the shape: cards get card fields, bodies get body fields, and the archive projection is nine fields lean.",
        ),
      ],
      reflection:
        "Every field a query doesn't fetch is bandwidth, parse time and type surface saved. The query language was the API design tool all along.",
    },
    {
      date: "2026-06-27",
      slug: "footnotes-inline-objects",
      title: "Footnotes want to be inline objects",
      topics: ["Design systems", "Writing"],
      mood: "curious",
      timeSpent: 45,
      body: [
        block(
          "Modelled footnotes as inline objects inside block children rather than block-level siblings. A footnote annotates a point in a sentence — the model should record that point, or the margin note can never find its offset.",
        ),
      ],
      reflection:
        "Model the meaning, not the rendering. The margin layout is a Phase 2 problem; the anchor position is a data problem, and data outlives layouts.",
    },
    {
      date: "2026-06-20",
      slug: "contrast-both-themes",
      title: "Contrast ratios in both themes, documented",
      topics: ["Accessibility", "Design systems"],
      mood: "grinding",
      timeSpent: 100,
      body: [
        block(
          "Checked every token pair in light and dark: ink/paper 14.8 and 10.3, muted 5.99 and 6.46, accent 7.34 and 8.37. Wrote the ratios as comments next to the tokens so the next change has to look at them.",
        ),
      ],
      reflection:
        "A ratio nobody can see is a ratio nobody maintains. Documentation next to the value is the cheapest regression test there is.",
    },
    {
      date: "2026-06-13",
      slug: "measure-not-percentage",
      title: "The measure is not a percentage",
      topics: ["Typography"],
      mood: "breakthrough",
      timeSpent: 30,
      body: [
        block(
          "Replaced max-width: 60% with max-width: 66ch and watched three responsive bugs disappear. Percentages tie line length to the viewport; ch ties it to the type. Only one of those is about reading.",
        ),
      ],
      reflection:
        "Units encode intent. When the unit matches the reason for the constraint, half the edge cases stop existing.",
      resources: ["seed-resource-elements"],
    },
    {
      date: "2026-06-06",
      slug: "theme-script-flash",
      title: "Killing the theme flash for good",
      topics: ["React", "Performance"],
      mood: "grinding",
      timeSpent: 80,
      body: [
        block(
          "The dark-mode flash survives every 'just use context' tutorial because hydration is too late by definition. Inlined a three-line script in <head> that sets data-theme before first paint. suppressHydrationWarning on <html> is the honest price.",
        ),
      ],
      reflection:
        "Some problems are timing problems, and no amount of architecture fixes timing. The ugly two lines in the right place beat the elegant hundred in the wrong one.",
    },
    {
      date: "2026-05-30",
      slug: "tailwind-theme-inline",
      title: "Why @theme inline matters in Tailwind v4",
      topics: ["Design systems", "Tooling"],
      mood: "curious",
      timeSpent: 50,
      body: [
        block(
          "Without inline, Tailwind resolves theme values at build time and dark mode custom properties silently stop working. With it, utilities emit var() references and runtime theming just works.",
        ),
      ],
      reflection:
        "Build-time and runtime keep trading places in CSS now. Knowing which side of the line a value lives on is the new specificity.",
      resources: ["seed-resource-tailwind-repo"],
    },
    {
      date: "2026-05-23",
      slug: "reading-time-derived",
      title: "Reading time belongs in the write path",
      topics: ["Tooling", "TypeScript"],
      mood: "curious",
      timeSpent: 40,
      body: [
        block(
          "Computing reading time at render means every consumer — cards, feeds, OG images — recomputes or disagrees. Computing on publish stores one number everyone shares. Pure function, unit tested, reused by the seed script.",
        ),
      ],
      reflection:
        "Derived data wants a single writer. The moment two code paths can compute the 'same' value, they eventually won't.",
    },
  ];

  for (const j of journal) {
    const body = j.body;
    tx.createOrReplace({
      _id: `seed-journal-${j.slug}`,
      _type: "journalEntry",
      title: j.title,
      slug: { current: `${j.date}-${j.slug}` },
      entryDate: j.date,
      topics: j.topics.map((t) => ref(tagId(t))),
      body,
      reflection: j.reflection,
      ...(j.resources ? { resources: j.resources.map((r) => ref(r)) } : {}),
      ...(j.code ? { codeSnippets: [j.code] } : {}),
      mood: j.mood,
      timeSpent: j.timeSpent,
      status: "published",
      publishedAt: iso(j.date),
      ...derived(body),
    });
  }

  /* ── Projects (4) ───────────────────────────────────────────────────── */

  const projects: SeedProject[] = [
    {
      _id: "seed-project-writer-site",
      title: "writer-site",
      slug: "writer-site",
      summary:
        "This site: a personal writing platform with a token-driven design system, Sanity content backbone and a hard JavaScript budget.",
      year: 2026,
      status: "wip",
      stack: ["Next.js", "TypeScript", "Tailwind v4", "Sanity"],
      thumbnail: figure(
        coverProject1,
        "Placeholder thumbnail: 'writer-site' in accent blue on dark.",
      ),
      links: [
        {
          _type: "link",
          _key: key(),
          label: "Source on GitHub",
          href: "https://github.com/tomararun/writer-site",
          kind: "external",
        },
      ],
      caseStudy: singleRef("seed-case-reading-page"),
      featured: true,
    },
    {
      _id: "seed-project-readlog",
      title: "readlog",
      slug: "readlog",
      summary:
        "A tiny CLI that turns highlighted passages from e-reader exports into a searchable, taggable reading log in plain Markdown.",
      year: 2025,
      status: "live",
      stack: ["Node.js", "TypeScript"],
      thumbnail: figure(
        coverProject2,
        "Placeholder thumbnail: 'readlog' in ink on highlighter yellow.",
      ),
      links: [
        {
          _type: "link",
          _key: key(),
          label: "Source on GitHub",
          href: "https://github.com/tomararun/readlog",
          kind: "external",
        },
      ],
      featured: true,
    },
    {
      _id: "seed-project-typescale",
      title: "typescale-check",
      slug: "typescale-check",
      summary:
        "A dev-time script that validates fluid CSS type scales: endpoint alignment, slope proportionality and collision detection between steps.",
      year: 2026,
      status: "live",
      stack: ["TypeScript", "PostCSS"],
      featured: false,
    },
    {
      _id: "seed-project-groq-snippets",
      title: "groq-snippets",
      slug: "groq-snippets",
      summary:
        "An editor snippet pack for common GROQ patterns — projections, joins, facet counts — with typegen-safe formatting.",
      year: 2025,
      status: "archived",
      stack: ["GROQ"],
      featured: false,
    },
  ];

  for (const p of projects) {
    tx.createOrReplace({
      _id: p._id,
      _type: "project",
      title: p.title,
      slug: { current: p.slug },
      summary: p.summary,
      year: p.year,
      status: p.status,
      stack: p.stack,
      ...(p.thumbnail ? { thumbnail: p.thumbnail } : {}),
      ...(p.links ? { links: p.links } : {}),
      ...(p.caseStudy ? { caseStudy: p.caseStudy } : {}),
      featured: p.featured,
    });
  }

  /* ── About page ─────────────────────────────────────────────────────── */

  tx.createOrReplace({
    _id: "seed-page-about",
    _type: "page",
    title: "About",
    slug: { current: "about" },
    sections: [
      {
        _type: "richTextSection",
        _key: key(),
        body: [
          block(
            "I'm Alex. I build software and write about what it teaches me — essays about craft and attention, case studies of shipped work, and a public journal of what I'm learning, including the parts that didn't work.",
          ),
        ],
      },
      {
        _type: "timelineSection",
        _key: key(),
        heading: "The short version",
        items: [
          {
            _type: "timelineItem",
            _key: key(),
            period: "2026 — now",
            title: "Building writer-site in public",
            body: "Design system, content backbone, and a journal that keeps me honest.",
          },
          {
            _type: "timelineItem",
            _key: key(),
            period: "2024 — 2026",
            title: "Frontend, mostly React",
            body: "Product work with a growing sideline in typography and reading UX.",
          },
        ],
      },
      {
        _type: "valuesGridSection",
        _key: key(),
        heading: "How I work",
        items: [
          {
            _type: "valueItem",
            _key: key(),
            title: "Decide once, in one place",
            body: "Tokens over taste debates. If a value matters it gets a name and a file.",
          },
          {
            _type: "valueItem",
            _key: key(),
            title: "Ship the honest version",
            body: "A working link beats a dead input. Placeholders are labelled as placeholders.",
          },
        ],
      },
      {
        _type: "contactBlockSection",
        _key: key(),
        heading: "Get in touch",
        body: [
          block(
            "Good subjects: writing, reading UX, TypeScript, and interesting problems. I read everything, eventually.",
          ),
        ],
        email: "alex@198odds.com",
      },
    ],
  });

  /* ── Commit ─────────────────────────────────────────────────────────── */

  console.log("Committing transaction …");
  const result = await tx.commit();
  console.log(`Done: ${result.results.length} documents written to ${projectId}/${dataset}.`);
  console.log("Open /studio to browse them, or /studio → Vision to query.");
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});
