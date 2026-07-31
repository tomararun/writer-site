import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import { SubscribeForm } from "@/components/modules/SubscribeForm";
import { formatDate, isoDate } from "@/lib/format";
import { blogJsonLd } from "@/lib/jsonld";
import { sanityFetch } from "@/sanity/lib/fetch";
import { newsletterIssuesQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.12 — the newsletter page sells by showing: pitch, form, then the
 * actual archive. Subscriber counts appear only past 500 — until then, no
 * fake social proof.
 */

export const metadata: Metadata = {
  title: `Newsletter — ${site.newsletter.heading.replace(/\.$/, "")}`,
  description: site.newsletter.pitch,
  alternates: { canonical: "/newsletter" },
};

const BENEFITS = [
  "A new essay before it's public.",
  "Three links with a sentence on why.",
  "One open problem I haven't solved.",
];

const FAQ: { question: string; answer: string }[] = [
  {
    question: "How often?",
    answer:
      "Every other Sunday. If there's nothing worth your time, it skips a round — the cadence is a promise, not a quota.",
  },
  {
    question: "Can I read it without subscribing?",
    answer: "Yes — every issue lands in the archive below a few weeks after it's sent.",
  },
  {
    question: "What happens to my email address?",
    answer:
      "It's stored with the newsletter provider and used for exactly one thing: sending the letter. Never shared, never sold, deleted when you unsubscribe.",
  },
];

export default async function NewsletterPage() {
  const issues = await sanityFetch({
    query: newsletterIssuesQuery,
    tags: ["newsletterIssue"],
  }).catch(() => []);

  const jsonLd = blogJsonLd({
    name: "Newsletter",
    url: `${site.url}/newsletter`,
    description: site.newsletter.pitch,
    posts: issues
      .filter((issue) => issue.title)
      .map((issue) => ({
        url: `${site.url}/newsletter`,
        headline: `#${issue.number} — ${issue.title}`,
        datePublished: issue.sentAt,
      })),
  });

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[var(--measure-narrow)]">
        <header>
          <h1 className="font-display text-[var(--text-3xl)] font-semibold">
            {site.newsletter.heading}
          </h1>
          <p className="mt-4 text-[var(--text-md)] leading-snug text-ink-muted">
            One essay, three things worth reading, and whatever I&rsquo;m currently stuck on.
          </p>
        </header>

        <ul className="mt-8 space-y-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="border-l-2 border-rule pl-4 text-[var(--text-sm)] leading-relaxed"
            >
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-8 border border-rule bg-surface p-6">
          <SubscribeForm source="newsletter-page" variant="block" />
        </div>

        {issues.length > 0 ? (
          <section aria-labelledby="past-issues" className="mt-14">
            <h2
              id="past-issues"
              className="border-t border-rule pt-4 font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
            >
              Past issues
            </h2>
            <ol className="mt-4">
              {issues.map((issue) => (
                <li
                  key={issue._id}
                  className="flex flex-wrap items-baseline gap-x-3 border-t border-rule py-3"
                >
                  <span className="font-mono text-[var(--text-xs)] text-ink-muted">
                    #{issue.number}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-[var(--text-sm)] font-medium">
                    {issue.title}
                  </span>
                  {issue.sentAt ? (
                    <time
                      dateTime={isoDate(issue.sentAt)}
                      className="font-mono text-[var(--text-2xs)] text-ink-muted max-sm:hidden"
                    >
                      {formatDate(issue.sentAt)}
                    </time>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <p className="mt-14 border-t border-rule pt-6 text-[var(--text-sm)] text-ink-muted">
          <span className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)]">
            What I won&rsquo;t do
          </span>
          <br />
          No drip sequences. No &ldquo;quick question&rdquo; emails. No selling you a course.
        </p>

        <section aria-labelledby="newsletter-faq" className="mt-10">
          <h2
            id="newsletter-faq"
            className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted"
          >
            Questions
          </h2>
          <div className="prose prose--narrow mt-2">
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
