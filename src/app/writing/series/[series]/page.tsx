import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/Container";
import { EmptyState, PageHeader } from "@/components/modules/IndexChrome";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { formatDate } from "@/lib/format";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { seriesFacetQuery, seriesSlugsQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.3 SEO — the series facet: an ORDERED list; the part numbering is
 * the point, so rows carry "Part N" rather than a kind label.
 */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(seriesSlugsQuery);
    return slugs.filter(Boolean).map((series) => ({ series: series! }));
  } catch {
    return [];
  }
}

async function fetchFacet(series: string) {
  return sanityFetch({
    query: seriesFacetQuery,
    params: { slug: series },
    tags: ["post", "series", `series:${series}`],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string }>;
}): Promise<Metadata> {
  const { series } = await params;
  try {
    const data = await fetchFacet(series);
    if (!data.series) return {};
    return {
      title: `${data.series.title} — a series`,
      description: data.series.description ?? `The “${data.series.title}” series, in order.`,
      alternates: { canonical: `/writing/series/${series}` },
    };
  } catch {
    return {};
  }
}

export default async function SeriesFacetPage({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series } = await params;
  const data = await fetchFacet(series);
  if (!data.series) notFound();

  const jsonLd = collectionPageJsonLd({
    name: data.series.title ?? series,
    url: `${site.url}/writing/series/${series}`,
    description: data.series.description,
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
        title={data.series.title ?? series}
        promise={data.series.description ?? undefined}
      />

      {data.posts.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="This series hasn't started yet."
            routes={[
              { label: "All writing", href: "/writing" },
              { label: "The journal", href: "/journal" },
            ]}
          />
        </div>
      ) : (
        <ol className="mt-10">
          {data.posts.map((post, i) => (
            <li key={post._id} className="group relative border-t border-rule py-6">
              <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                Part {post.order ?? i + 1}
                {post.readingTime ? ` · ${post.readingTime} min` : null}
                {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : null}
              </p>
              <h2 className="mt-2 font-display text-[var(--text-lg)] font-semibold">
                <Link
                  href={`/writing/${post.slug}`}
                  className="no-underline after:absolute after:inset-0"
                >
                  <span className="card-rule">{post.title}</span>
                </Link>
              </h2>
              {post.excerpt ? (
                <p className="mt-2 max-w-[60ch] text-[var(--text-sm)] leading-relaxed text-ink-muted">
                  {post.excerpt}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}
