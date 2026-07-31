import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import { ButtonLink } from "@/components/primitives/Button";
import { SanityImage } from "@/components/content/SanityImage";
import { SubscribeBlock } from "@/components/modules/ArticleFooter";
import { CaseStudyCardWide, LeadPostCard, PostCard } from "@/components/modules/Cards";
import { EmptyState, SectionHeader } from "@/components/modules/IndexChrome";
import { JournalLedgerRow } from "@/components/modules/JournalLedger";
import { personJsonLd, webSiteJsonLd } from "@/lib/jsonld";
import { sanityFetch } from "@/sanity/lib/fetch";
import { homeQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.1 — the home page. A first-time reader needs WHO (2s), WHAT'S GOOD
 * (10s), PROOF (30s), KEEP IN TOUCH (exit intent) — so: statement →
 * currently → selected writing → case studies → journal → subscribe, and
 * nothing between the statement and the writing.
 */

export const metadata: Metadata = {
  description: site.description,
  alternates: { canonical: "/" },
};

/** The page prerenders at build time; without a reachable Sanity project it
 *  falls back to the designed empty states instead of failing the build. */
async function fetchHome() {
  try {
    return await sanityFetch({
      query: homeQuery,
      tags: ["post", "caseStudy", "journalEntry", "siteSettings", "author"],
    });
  } catch {
    return {
      settings: null,
      author: null,
      featuredPosts: [],
      featuredCaseStudies: [],
      latestJournal: [],
      latestPosts: [],
    };
  }
}

export default async function HomePage() {
  const data = await fetchHome();

  // Featured posts drive the section; latest fill the empty slots honestly.
  const selectedWriting = [
    ...data.featuredPosts,
    ...data.latestPosts.filter(
      (post) => !data.featuredPosts.some((featured) => featured._id === post._id),
    ),
  ].slice(0, 3);
  const [leadPost, ...secondaryPosts] = selectedWriting;

  const jsonLd = [
    personJsonLd({
      name: site.name,
      url: site.url,
      jobTitle: site.role,
      sameAs: site.social.map((entry) => entry.href).filter((href) => href.startsWith("http")),
      knowsAbout: ["writing", "software", "typography"],
    }),
    webSiteJsonLd({ name: site.name, url: site.url }),
  ];

  const currently = [
    `Reading ${site.currently.reading}`,
    `Building ${site.currently.building}`,
    `Learning ${site.currently.learning}`,
  ].join(" · ");

  return (
    <Container className="py-14 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Statement (§6.1) — one sentence only you could say ──────────── */}
      <section aria-label="Introduction" className="grid gap-10 lg:grid-cols-[3fr_2fr]">
        <div>
          <h1 className="max-w-[24ch] font-display text-[var(--text-4xl)] font-semibold">
            {site.statement}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[var(--text-md)] leading-snug text-ink-muted">
            {site.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/writing">Read the writing</ButtonLink>
            <ButtonLink href="/newsletter" variant="secondary">
              Subscribe
            </ButtonLink>
          </div>
        </div>
        {data.author?.avatar?.asset ? (
          <div className="max-lg:order-first max-lg:max-w-60">
            {/* §6.1 — the portrait is a document, not a hero: b/w, hairline. */}
            <SanityImage
              asset={data.author.avatar.asset}
              alt={`Portrait of ${data.author.name ?? site.name}`}
              layout="side"
              priority
              className="aspect-[4/5] w-full border border-rule object-cover grayscale"
            />
          </div>
        ) : null}
      </section>

      {/* ── Currently — a single mono line ───────────────────────────────── */}
      <p className="mt-14 border-y border-rule py-3 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        Currently — {currently}
      </p>

      {/* ── Selected writing ─────────────────────────────────────────────── */}
      <section aria-labelledby="home-writing" className="mt-14">
        <SectionHeader
          id="home-writing"
          eyebrow="Selected writing"
          link={{ label: "All writing →", href: "/writing" }}
        />
        {selectedWriting.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              message="Nothing published yet — the writing lands here first."
              routes={[
                { label: "The journal", href: "/journal" },
                { label: "About", href: "/about" },
              ]}
            />
          </div>
        ) : (
          <div className="grid gap-x-10 lg:grid-cols-[3fr_2fr]">
            <div>{leadPost ? <LeadPostCard post={leadPost} /> : null}</div>
            <div className="flex flex-col gap-8 py-8">
              {secondaryPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Case studies ─────────────────────────────────────────────────── */}
      {data.featuredCaseStudies.length > 0 ? (
        <section aria-labelledby="home-case-studies" className="mt-14">
          <SectionHeader
            id="home-case-studies"
            eyebrow="Case studies — how things actually got built"
            link={{ label: "All case studies →", href: "/case-studies" }}
          />
          {data.featuredCaseStudies.map((caseStudy) => (
            <CaseStudyCardWide key={caseStudy._id} caseStudy={caseStudy} />
          ))}
        </section>
      ) : null}

      {/* ── From the journal ─────────────────────────────────────────────── */}
      {data.latestJournal.length > 0 ? (
        <section aria-labelledby="home-journal" className="mt-14">
          <SectionHeader
            id="home-journal"
            eyebrow="From the journal — thinking out loud, unedited on purpose"
            link={{ label: "All entries →", href: "/journal" }}
          />
          <ol>
            {data.latestJournal.map((entry) => (
              <JournalLedgerRow key={entry._id} entry={entry} />
            ))}
          </ol>
        </section>
      ) : null}

      {/* ── Subscribe ────────────────────────────────────────────────────── */}
      <div className="mt-16">
        <SubscribeBlock
          variant="panel"
          heading={site.newsletter.heading}
          pitch={`${site.newsletter.pitch} No growth tactics. Unsubscribe in one click.`}
        />
      </div>
    </Container>
  );
}
