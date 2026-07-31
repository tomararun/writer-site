import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/primitives/Container";
import { CaseStudyCardWide } from "@/components/modules/Cards";
import { EmptyState, PageHeader } from "@/components/modules/IndexChrome";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { sanityFetch } from "@/sanity/lib/fetch";
import { caseStudyIndexQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.5 — sparse and confident: the featured case study full width, the
 * rest in a two-column grid. No filters unless there are more than 8.
 */

export const metadata: Metadata = {
  title: "Case studies",
  description:
    "Long-form breakdowns of things I've shipped — including the constraints, the wrong turns, and the numbers.",
  alternates: { canonical: "/case-studies" },
};

export default async function CaseStudiesIndexPage() {
  // Prerendered at build — degrade to the empty state without a project.
  const caseStudies = await sanityFetch({
    query: caseStudyIndexQuery,
    tags: ["caseStudy"],
  }).catch(() => []);

  const featured = caseStudies.find((cs) => cs.featured) ?? caseStudies[0];
  const rest = caseStudies.filter((cs) => cs._id !== featured?._id);

  const jsonLd = collectionPageJsonLd({
    name: "Case studies",
    url: `${site.url}/case-studies`,
    description: "Long-form breakdowns of shipped work.",
    items: caseStudies
      .filter((cs) => cs.slug && cs.title)
      .map((cs) => ({ url: `${site.url}/case-studies/${cs.slug}`, name: cs.title! })),
  });

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title="Case studies"
        promise="Long-form breakdowns of things I've shipped — including the constraints, the wrong turns, and the numbers."
      />

      {caseStudies.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="The first full write-up is on its way."
            routes={[
              { label: "Smaller work lives in Projects", href: "/projects" },
              { label: "The writing", href: "/writing" },
            ]}
          />
        </div>
      ) : (
        <>
          {featured ? <CaseStudyCardWide caseStudy={featured} /> : null}
          {rest.length > 0 ? (
            <div className="grid gap-x-10 lg:grid-cols-2">
              {rest.map((cs) => (
                <CaseStudyCardWide key={cs._id} caseStudy={cs} />
              ))}
            </div>
          ) : null}
        </>
      )}

      <p className="mt-14 border-t border-rule pt-6 text-[var(--text-sm)] text-ink-muted">
        Smaller things I&rsquo;ve built live in{" "}
        <Link href="/projects" className="text-accent no-underline">
          Projects →
        </Link>
      </p>
      <p className="mt-3 text-[var(--text-sm)] text-ink-muted">
        Working on something similar?{" "}
        <Link href="/contact" className="text-accent no-underline">
          Tell me about it →
        </Link>
      </p>
    </Container>
  );
}
