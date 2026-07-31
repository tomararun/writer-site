import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/Container";
import { PostRow } from "@/components/modules/Cards";
import { EmptyState, PageHeader, SectionHeader } from "@/components/modules/IndexChrome";
import { JournalLedgerRow } from "@/components/modules/JournalLedger";
import { blogJsonLd } from "@/lib/jsonld";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { tagFacetQuery, tagSlugsQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.7 SEO — the journal topic facet, journal-first: the indexable page
 * for long-tail queries, with its 30-word intro. Related essays cross-link
 * below — journal entries are the top of the funnel into the long-form work.
 */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(tagSlugsQuery);
    return slugs.filter(Boolean).map((topic) => ({ topic: topic! }));
  } catch {
    return [];
  }
}

async function fetchFacet(topic: string) {
  return sanityFetch({
    query: tagFacetQuery,
    params: { slug: topic },
    tags: ["post", "journalEntry", "tag", `tag:${topic}`],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  try {
    const data = await fetchFacet(topic);
    if (!data.tag) return {};
    return {
      title: `${data.tag.title} — Learning journal`,
      description:
        data.tag.description ??
        `Dated learning notes on ${data.tag.title}: what worked, what didn't, and what changed in how I think.`,
      alternates: { canonical: `/journal/topic/${topic}` },
    };
  } catch {
    return {};
  }
}

export default async function JournalTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const data = await fetchFacet(topic);
  if (!data.tag) notFound();

  const jsonLd = blogJsonLd({
    name: `Learning journal — ${data.tag.title}`,
    url: `${site.url}/journal/topic/${topic}`,
    description: data.tag.description,
    posts: data.journalEntries
      .filter((entry) => entry.slug)
      .map((entry) => ({
        url: `${site.url}/journal/${entry.slug}`,
        headline: entry.title ?? entry.entryDate ?? "Journal entry",
        datePublished: entry.entryDate,
      })),
  });

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title={`Journal: ${data.tag.title ?? topic}`}
        promise={
          data.tag.description ??
          `Dated notes on ${data.tag.title} — the learning as it happened, corrections included.`
        }
      />

      {data.journalEntries.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="No entries on that topic yet."
            routes={[
              { label: "See all topics", href: "/journal" },
              { label: "The writing", href: "/writing" },
            ]}
          />
        </div>
      ) : (
        <ol className="mt-10">
          {data.journalEntries.map((entry) => (
            <JournalLedgerRow key={entry._id} entry={entry} />
          ))}
        </ol>
      )}

      {data.posts.length > 0 ? (
        <section aria-labelledby="topic-writing" className="mt-14">
          <SectionHeader
            id="topic-writing"
            eyebrow="The long-form version"
            link={{ label: "All writing →", href: "/writing" }}
          />
          {data.posts.map((post) => (
            <PostRow key={post._id} post={post} />
          ))}
        </section>
      ) : null}
    </Container>
  );
}
