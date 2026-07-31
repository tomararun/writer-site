import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import type { PortableTextBlock } from "next-sanity";
import { ArticleGrid } from "@/components/primitives/ArticleGrid";
import { Prose } from "@/components/primitives/Prose";
import { PortableTextRenderer } from "@/components/content/PortableTextRenderer";
import { ProcessStep } from "@/components/content/ProcessStep";
import { SanityImage } from "@/components/content/SanityImage";
import {
  ArchivedNotice,
  RelatedGrid,
  type RelatedItem,
} from "@/components/modules/ArticleFooter";
import { ArtifactsMargin } from "@/components/modules/ArtifactsMargin";
import {
  AtAGlance,
  CaseStudyHero,
  ContactCTA,
  LearningsGroups,
  MetricsBand,
  NumberedSection,
  TestimonialBlock,
} from "@/components/modules/CaseStudy";
import { Gallery } from "@/components/modules/Gallery";
import { SectionNav } from "@/components/modules/SectionNav";
import { caseStudySections } from "@/lib/case-study-sections";
import { caseStudyJsonLd } from "@/lib/jsonld";
import { isPubliclyVisible } from "@/lib/visibility";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import { caseStudyBySlugQuery, caseStudySlugsQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.6 — the case study template: the 14 sections in order, on a 72ch
 * measure with the margin track carrying process artefacts at ≥lg. Every
 * section anchor is deep-linkable (#process, #outcomes — these get cited).
 */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(caseStudySlugsQuery);
    return slugs.filter(Boolean).map((slug) => ({ slug: slug! }));
  } catch {
    return [];
  }
}

async function fetchCaseStudy(slug: string) {
  return sanityFetch({
    query: caseStudyBySlugQuery,
    params: { slug },
    tags: ["caseStudy", `caseStudy:${slug}`, "author", "tag", "post"],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let caseStudy: Awaited<ReturnType<typeof fetchCaseStudy>> = null;
  try {
    caseStudy = await fetchCaseStudy(slug);
  } catch {
    return {};
  }
  if (!caseStudy) return {};

  const title = caseStudy.seo?.title ?? `${caseStudy.title} — Case study`;
  const description = caseStudy.seo?.description ?? caseStudy.excerpt ?? undefined;
  const coverUrl = caseStudy.coverImage?.asset?.url
    ? urlFor(caseStudy.coverImage.asset.url).width(1200).url()
    : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: caseStudy.canonicalUrl ?? `/case-studies/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: caseStudy.publishedAt ?? undefined,
      modifiedTime: caseStudy.updatedAt ?? undefined,
      images: coverUrl ? [coverUrl] : undefined,
    },
    robots: caseStudy.seo?.noIndex ? { index: false, follow: false } : undefined,
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = await fetchCaseStudy(slug);
  const { isEnabled: isPreview } = await draftMode();

  if (!caseStudy) notFound();
  if (!isPreview && !isPubliclyVisible(caseStudy.status, caseStudy.publishedAt)) notFound();

  const gallery = (caseStudy.gallery ?? []).filter((figure) => figure.asset?.url);
  const learnings = caseStudy.learnings ?? [];
  const metrics = caseStudy.metrics ?? [];
  const process = caseStudy.process ?? [];

  const sections = caseStudySections({
    background: Boolean(caseStudy.background?.length),
    problem: Boolean(caseStudy.problem?.length),
    constraints: Boolean(caseStudy.constraints?.length),
    process: process.length > 0,
    implementation: Boolean(caseStudy.implementation?.length),
    outcomes: Boolean(caseStudy.outcomes?.length),
    metrics: metrics.length > 0,
    learnings: learnings.length > 0,
    gallery: gallery.length > 0,
  });
  const sectionById = new Map(sections.map((section) => [section.id, section]));

  const stepsWithArtifacts = process
    .map((step, index) => ({ step, id: `process-step-${index + 1}` }))
    .filter(({ step }) => (step.artifacts ?? []).length > 0);

  const url = `${site.url}/case-studies/${slug}`;
  const jsonLd = caseStudyJsonLd({
    url,
    headline: caseStudy.title ?? "",
    description: caseStudy.excerpt,
    datePublished: caseStudy.publishedAt,
    dateModified: caseStudy.updatedAt,
    authorName: caseStudy.author?.name,
    about: [caseStudy.client, ...(caseStudy.stack ?? [])],
    images: gallery.map((figure) => ({
      url: urlFor(figure.asset!.url!).width(1200).url(),
      caption: figure.caption ?? figure.alt,
    })),
  });

  const year = caseStudy.timeframe?.start?.slice(0, 4) ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionNav sections={sections} />

      <ArticleGrid
        measure="wide"
        className="py-12 sm:py-16"
        margin={
          stepsWithArtifacts.length > 0 ? (
            <ArtifactsMargin stepIds={stepsWithArtifacts.map(({ id }) => id)}>
              {stepsWithArtifacts.map(({ step, id }) => (
                <div key={id} className="space-y-4">
                  {(step.artifacts ?? []).map((artifact, i) =>
                    artifact.asset?.url ? (
                      <figure key={i}>
                        <SanityImage
                          asset={artifact.asset}
                          alt={artifact.alt ?? ""}
                          layout="side"
                          className="w-full border border-rule"
                        />
                        {artifact.caption ? (
                          <figcaption className="mt-1 font-mono text-[var(--text-2xs)] leading-relaxed text-ink-muted">
                            {artifact.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    ) : null,
                  )}
                </div>
              ))}
            </ArtifactsMargin>
          ) : undefined
        }
      >
        <article className="article-load">
          {caseStudy.status === "archived" ? <ArchivedNotice /> : null}

          {/* 1 — Hero */}
          <CaseStudyHero
            title={caseStudy.title ?? ""}
            outcome={caseStudy.excerpt}
            client={caseStudy.client}
            year={year}
            role={caseStudy.role}
            stack={caseStudy.stack}
            heroMedia={caseStudy.heroMedia}
          />

          {/* 2 — At a glance */}
          <AtAGlance
            role={caseStudy.role}
            timeframe={caseStudy.timeframe}
            stack={caseStudy.stack}
            links={caseStudy.links}
          />

          {/* 3 — Background */}
          {sectionById.has("background") ? (
            <NumberedSection section={sectionById.get("background")!}>
              <Prose measure="wide">
                <PortableTextRenderer value={caseStudy.background as PortableTextBlock[]} />
              </Prose>
            </NumberedSection>
          ) : null}

          {/* 4 — Problem */}
          {sectionById.has("problem") ? (
            <NumberedSection section={sectionById.get("problem")!}>
              <Prose measure="wide">
                <PortableTextRenderer value={caseStudy.problem as PortableTextBlock[]} />
              </Prose>
            </NumberedSection>
          ) : null}

          {/* 5 — Constraints */}
          {sectionById.has("constraints") ? (
            <NumberedSection section={sectionById.get("constraints")!}>
              <ul className="space-y-2">
                {caseStudy.constraints!.map((constraint) => (
                  <li
                    key={constraint}
                    className="border-l-2 border-rule pl-4 text-[var(--text-md)] leading-snug"
                  >
                    {constraint}
                  </li>
                ))}
              </ul>
            </NumberedSection>
          ) : null}

          {/* 6 — Process: a real <ol>; numbering is legitimate here */}
          {sectionById.has("process") ? (
            <NumberedSection section={sectionById.get("process")!}>
              <ol className="space-y-8">
                {process.map((step, index) => (
                  <ProcessStep
                    key={index}
                    value={{ ...step, body: (step.body ?? null) as PortableTextBlock[] | null }}
                    index={index + 1}
                    id={`process-step-${index + 1}`}
                    artifactsBelowLgOnly
                  />
                ))}
              </ol>
            </NumberedSection>
          ) : null}

          {/* 7 — Implementation */}
          {sectionById.has("implementation") ? (
            <NumberedSection section={sectionById.get("implementation")!}>
              <Prose measure="wide">
                <PortableTextRenderer value={caseStudy.implementation as PortableTextBlock[]} />
              </Prose>
            </NumberedSection>
          ) : null}

          {/* 8 — Outcomes */}
          {sectionById.has("outcomes") ? (
            <NumberedSection section={sectionById.get("outcomes")!}>
              <Prose measure="wide">
                <PortableTextRenderer value={caseStudy.outcomes as PortableTextBlock[]} />
              </Prose>
            </NumberedSection>
          ) : null}

          {/* 9 — Metrics band (breaks out of the prose column at lg) */}
          {sectionById.has("metrics") ? (
            <NumberedSection section={sectionById.get("metrics")!}>
              <div className="lg:-mx-12">
                <MetricsBand metrics={metrics} />
              </div>
            </NumberedSection>
          ) : null}

          {/* 10 — What I'd change */}
          {sectionById.has("learnings") ? (
            <NumberedSection section={sectionById.get("learnings")!}>
              <LearningsGroups learnings={learnings} />
            </NumberedSection>
          ) : null}

          {/* 11 — Gallery */}
          {sectionById.has("gallery") ? (
            <NumberedSection section={sectionById.get("gallery")!}>
              <Gallery figures={gallery} />
            </NumberedSection>
          ) : null}

          {/* 12 — Testimonial */}
          <TestimonialBlock testimonial={caseStudy.testimonial} />

          {/* 13 — Related writing */}
          <RelatedGrid
            items={(caseStudy.relatedPosts ?? []) as RelatedItem[]}
            heading="Related writing"
          />

          {/* 14 — Contact CTA */}
          <ContactCTA />
        </article>
      </ArticleGrid>
    </>
  );
}
