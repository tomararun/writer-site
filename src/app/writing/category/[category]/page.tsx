import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/Container";
import { PostRow } from "@/components/modules/Cards";
import { EmptyState, PageHeader } from "@/components/modules/IndexChrome";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { categoryFacetQuery, categorySlugsQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/** SPEC §6.3 SEO — the category facet: one fixed shelf, described. */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(categorySlugsQuery);
    return slugs.filter(Boolean).map((category) => ({ category: category! }));
  } catch {
    return [];
  }
}

async function fetchFacet(category: string) {
  return sanityFetch({
    query: categoryFacetQuery,
    params: { slug: category },
    tags: ["post", "category", `category:${category}`],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  try {
    const data = await fetchFacet(category);
    if (!data.category) return {};
    return {
      title: `${data.category.title} — Writing`,
      description:
        data.category.description ?? `Writing in the ${data.category.title} category.`,
      alternates: { canonical: `/writing/category/${category}` },
    };
  } catch {
    return {};
  }
}

export default async function CategoryFacetPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = await fetchFacet(category);
  if (!data.category) notFound();

  const jsonLd = collectionPageJsonLd({
    name: data.category.title ?? category,
    url: `${site.url}/writing/category/${category}`,
    description: data.category.description,
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
        title={data.category.title ?? category}
        promise={data.category.description ?? undefined}
      />

      {data.posts.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="Nothing on this shelf yet."
            routes={[
              { label: "All writing", href: "/writing" },
              { label: "The journal", href: "/journal" },
            ]}
          />
        </div>
      ) : (
        <div className="mt-10">
          {data.posts.map((post) => (
            <PostRow key={post._id} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
