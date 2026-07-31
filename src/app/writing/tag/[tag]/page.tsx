import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/Container";
import { PostRow } from "@/components/modules/Cards";
import { EmptyState, PageHeader, SectionHeader } from "@/components/modules/IndexChrome";
import { JournalLedgerRow } from "@/components/modules/JournalLedger";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { tagFacetQuery, tagSlugsQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.3 SEO — the tag facet page: indexable, own title, intro copy so it
 * isn't thin. Shows the tag's writing and its journal entries.
 */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(tagSlugsQuery);
    return slugs.filter(Boolean).map((tag) => ({ tag: tag! }));
  } catch {
    return [];
  }
}

async function fetchFacet(tag: string) {
  return sanityFetch({
    query: tagFacetQuery,
    params: { slug: tag },
    tags: ["post", "journalEntry", "tag", `tag:${tag}`],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  try {
    const data = await fetchFacet(tag);
    if (!data.tag) return {};
    return {
      title: `${data.tag.title} — Writing and journal`,
      description:
        data.tag.description ??
        `Everything filed under “${data.tag.title}”: essays, tutorials and journal entries by ${site.name}.`,
      alternates: { canonical: `/writing/tag/${tag}` },
    };
  } catch {
    return {};
  }
}

export default async function TagFacetPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const data = await fetchFacet(tag);
  if (!data.tag) notFound();

  const jsonLd = collectionPageJsonLd({
    name: `Tagged “${data.tag.title}”`,
    url: `${site.url}/writing/tag/${tag}`,
    description: data.tag.description,
    items: data.posts
      .filter((post) => post.slug && post.title)
      .map((post) => ({ url: `${site.url}/writing/${post.slug}`, name: post.title! })),
  });

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title={data.tag.title ?? tag}
        promise={
          data.tag.description ??
          `Everything filed under “${data.tag.title}” — the essays and the working notes behind them.`
        }
      />

      {data.posts.length === 0 && data.journalEntries.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="Nothing published under this tag yet."
            routes={[
              { label: "All writing", href: "/writing" },
              { label: "The journal", href: "/journal" },
            ]}
          />
        </div>
      ) : (
        <>
          {data.posts.length > 0 ? (
            <section aria-labelledby="tag-writing" className="mt-10">
              <SectionHeader
                id="tag-writing"
                eyebrow={`Writing — ${data.posts.length}`}
                link={{ label: "All writing →", href: "/writing" }}
              />
              {data.posts.map((post) => (
                <PostRow key={post._id} post={post} />
              ))}
            </section>
          ) : null}

          {data.journalEntries.length > 0 ? (
            <section aria-labelledby="tag-journal" className="mt-12">
              <SectionHeader
                id="tag-journal"
                eyebrow={`From the journal — ${data.journalEntries.length}`}
                link={{ label: "All entries →", href: "/journal" }}
              />
              <ol>
                {data.journalEntries.map((entry) => (
                  <JournalLedgerRow key={entry._id} entry={entry} />
                ))}
              </ol>
            </section>
          ) : null}
        </>
      )}
    </Container>
  );
}
