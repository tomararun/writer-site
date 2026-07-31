import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import { SubscribeBlock } from "@/components/modules/ArticleFooter";
import { LeadPostCard, PostRow } from "@/components/modules/Cards";
import { FilterBar } from "@/components/modules/FilterBar";
import { EmptyState, PageHeader } from "@/components/modules/IndexChrome";
import { LoadMore } from "@/components/modules/LoadMore";
import { parseWritingParams, writingSummary, type SearchParams } from "@/lib/index-params";
import { collectionPageJsonLd } from "@/lib/jsonld";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  postIndexLongestQuery,
  postIndexOldestQuery,
  postIndexQuery,
  writingFilterOptionsQuery,
} from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.3 — the writing index: a LIST, not a grid. Filters live in the
 * URL; the pages are cumulative (?page=2 shows 1..24) so "Load more"
 * appends for readers and paginates for crawlers.
 */

const PAGE_SIZE = 12;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { page } = parseWritingParams(await searchParams);
  return {
    title: "Writing — Essays, tutorials and arguments",
    description: `Essays, tutorials and arguments about craft, systems and attention by ${site.name}.`,
    // §6.3 — filters canonicalise back to /writing; past page 1 noindex,follow.
    alternates: { canonical: "/writing" },
    robots: page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function WritingIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseWritingParams(await searchParams);

  const query =
    filters.sort === "oldest"
      ? postIndexOldestQuery
      : filters.sort === "longest"
        ? postIndexLongestQuery
        : postIndexQuery;

  // Dynamic route: degrade to the designed empty state when Sanity is
  // unreachable (fresh clone, mid-outage) instead of a 500.
  const [result, options] = await Promise.all([
    sanityFetch({
      query,
      params: {
        kind: filters.kind,
        category: filters.category,
        // "tag" itself is reserved by the client as a fetch option name.
        tagSlug: filters.tag,
        offset: 0,
        end: PAGE_SIZE * filters.page,
      },
      tags: ["post", "category", "tag"],
    }).catch(() => ({ total: 0, posts: [] })),
    sanityFetch({ query: writingFilterOptionsQuery, tags: ["category", "tag"] }).catch(() => ({
      categories: [],
      tags: [],
    })),
  ]);

  const posts = result.posts;
  const total = result.total;
  const hasFilters = Boolean(filters.kind || filters.category || filters.tag);
  const showLead = !hasFilters && filters.sort === "newest" && posts.length > 0;
  const [lead, ...rest] = showLead ? posts : [undefined, ...posts];

  const summary = writingSummary(total, filters, {
    category: options.categories.find((c) => c.slug === filters.category)?.title,
    tag: options.tags.find((t) => t.slug === filters.tag)?.title,
  });

  const jsonLd = collectionPageJsonLd({
    name: "Writing",
    url: `${site.url}/writing`,
    description: "Essays, tutorials and arguments.",
    items: posts
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
        title="Writing"
        promise={
          <>Essays, tutorials and arguments. {total} pieces, oldest first if you like.</>
        }
      />

      <div className="mt-8">
        <FilterBar
          summary={summary}
          groups={[
            {
              param: "kind",
              label: "Kind",
              allLabel: "All",
              options: [
                { label: "Essays", value: "essay" },
                { label: "Tutorials", value: "tutorial" },
                { label: "Reflections", value: "reflection" },
                { label: "Opinions", value: "opinion" },
              ],
            },
            {
              param: "category",
              label: "Category",
              allLabel: "All categories",
              options: options.categories
                .filter((c) => c.title && c.slug)
                .map((c) => ({ label: c.title!, value: c.slug! })),
            },
            {
              param: "tag",
              label: "Tag",
              allLabel: "All tags",
              options: options.tags
                .filter((t) => t.title && t.slug)
                .map((t) => ({ label: t.title!, value: t.slug! })),
            },
          ]}
          sort={{
            param: "sort",
            label: "Sort:",
            defaultValue: "newest",
            options: [
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
              { label: "Longest reads", value: "longest" },
            ],
          }}
        />
      </div>

      {posts.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            message="Nothing here yet with those filters. Clear them or try the archive — it goes back further."
            routes={[
              { label: "Clear them", href: "/writing" },
              { label: "Try the archive", href: "/archive" },
            ]}
          />
        </div>
      ) : (
        <>
          {lead ? <LeadPostCard post={lead} /> : null}
          <div>
            {rest
              .filter((post): post is NonNullable<typeof post> => Boolean(post))
              .map((post, i) => (
                <PostRow key={post._id} post={post} id={`post-${i + (lead ? 2 : 1)}`} />
              ))}
          </div>
          <LoadMore
            loadedCount={posts.length}
            total={total}
            pageSize={PAGE_SIZE}
            nextPage={filters.page + 1}
            itemIdPrefix="post"
            noun="posts"
          />
        </>
      )}

      <div className="mt-16">
        <SubscribeBlock
          variant="panel"
          source="writing"
          heading={site.newsletter.heading}
          pitch={site.newsletter.pitch}
        />
      </div>
    </Container>
  );
}
