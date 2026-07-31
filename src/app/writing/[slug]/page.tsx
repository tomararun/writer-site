import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { PortableText, type PortableTextBlock } from "next-sanity";
import { ArticleGrid } from "@/components/primitives/ArticleGrid";
import { Prose } from "@/components/primitives/Prose";
import { Figure } from "@/components/content/Figure";
import { FootnoteMargin } from "@/components/content/FootnoteMargin";
import { footnoteNoteId, footnoteRefId } from "@/components/content/Footnote";
import { PortableTextRenderer } from "@/components/content/PortableTextRenderer";
import { ArticleHeader } from "@/components/modules/ArticleHeader";
import {
  ArchivedNotice,
  AuthorStrip,
  PrevNext,
  RelatedGrid,
  SeriesNav,
  SubscribeBlock,
  TagList,
  UpdateNote,
  type RelatedItem,
} from "@/components/modules/ArticleFooter";
import { MarginRail } from "@/components/modules/MarginRail";
import { MobileArticleNav } from "@/components/modules/MobileArticleNav";
import { ScrollDepthTracker, ViewPing } from "@/components/modules/Trackers";
import { extractFootnotes, extractHeadings } from "@/lib/portable-text";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { relatedContent } from "@/lib/related";
import { buildMetadata, ogImageUrl } from "@/lib/seo";
import { isPubliclyVisible } from "@/lib/visibility";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { urlFor } from "@/sanity/lib/image";
import {
  postBySlugQuery,
  postSlugsQuery,
  prevNextPostQuery,
  relatedCandidatesQuery,
} from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.4 — the single post template. Three-track grid at ≥lg (rail /
 * prose / margin), single column below with the 2px top progress bar and the
 * ¶ Sections sheet. Section order and copy follow §6.4 exactly.
 */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(postSlugsQuery);
    return slugs.filter(Boolean).map((slug) => ({ slug: slug! }));
  } catch {
    // No Sanity project reachable (fresh clone, CI without env) — build the
    // shell; pages render on demand once content exists.
    return [];
  }
}

async function fetchPost(slug: string) {
  return sanityFetch({
    query: postBySlugQuery,
    params: { slug },
    tags: ["post", `post:${slug}`, "author", "category", "tag", "series"],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof fetchPost>> = null;
  try {
    post = await fetchPost(slug);
  } catch {
    return {};
  }
  if (!post) return {};

  // §4.7 — one metadata builder; OG image from /api/og keyed on updatedAt.
  return buildMetadata({
    title: post.title ?? "",
    seoTitle: post.seo?.title,
    seoDescription: post.seo?.description,
    excerpt: post.excerpt,
    plainText: post.plainText,
    path: `/writing/${slug}`,
    canonicalUrl: post.canonicalUrl,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    tags: (post.tags ?? []).map((tag) => tag.title),
    ogImage: ogImageUrl({
      slug,
      type: "post",
      updatedAt: post.updatedAt ?? post.publishedAt,
    }),
    noIndex: post.seo?.noIndex,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  const { isEnabled: isPreview } = await draftMode();

  if (!post) notFound();
  // Exit criterion: "a draft is previewable and its public URL 404s."
  if (!isPreview && !isPubliclyVisible(post.status, post.publishedAt)) notFound();

  const body = (post.body ?? []) as PortableTextBlock[];
  const headings = extractHeadings(body);
  const sections = headings
    .filter((heading) => heading.level === 2)
    .map((heading) => ({ text: heading.text, anchor: heading.anchor }));
  const footnotes = extractFootnotes(body);

  const url = `${site.url}/writing/${slug}`;

  /* Prev/next + related, fetched in parallel. */
  const [prevNext, related] = await Promise.all([
    post.publishedAt
      ? sanityFetch({
          query: prevNextPostQuery,
          params: { publishedAt: post.publishedAt },
          tags: ["post"],
        })
      : Promise.resolve(null),
    (async (): Promise<RelatedItem[]> => {
      // §3.3 — relatedManual overrides the algorithm when set.
      if (post.relatedManual && post.relatedManual.length > 0) {
        return post.relatedManual as RelatedItem[];
      }
      const candidates = await sanityFetch({
        query: relatedCandidatesQuery,
        params: {
          id: post._id,
          tagIds: post.tagIds ?? [],
          categoryId: post.categoryId ?? null,
          seriesId: post.seriesId ?? null,
        },
        tags: ["post"],
      });
      return relatedContent(
        {
          _id: post._id,
          tagIds: post.tagIds,
          categoryId: post.categoryId,
          seriesId: post.seriesId,
        },
        candidates,
      ) as RelatedItem[];
    })(),
  ]);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: site.name, url: site.url },
      { name: "Writing", url: `${site.url}/writing` },
      { name: post.title ?? "", url },
    ]),
    blogPostingJsonLd({
      url,
      headline: post.title ?? "",
      description: post.seo?.description ?? post.excerpt,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      authorName: post.author?.name,
      imageUrl: post.coverImage?.asset?.url
        ? urlFor(post.coverImage.asset.url).width(1200).url()
        : null,
      wordCount: post.wordCount,
      keywords: (post.tags ?? []).map((tag) => tag.title),
      articleSection: post.category?.title,
    }),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MobileArticleNav sections={sections} />
      <ScrollDepthTracker />
      <ViewPing path={`/writing/${slug}`} />

      <ArticleGrid
        className="py-12 sm:py-16"
        rail={
          sections.length > 0 || footnotes.length > 0 ? (
            <div className="sticky top-24">
              <MarginRail
                sections={sections}
                ticks={footnotes.map((note) => ({
                  number: note.number,
                  refId: footnoteRefId(note),
                }))}
              />
            </div>
          ) : undefined
        }
        margin={
          footnotes.length > 0 ? (
            <FootnoteMargin
              notes={footnotes.map((note) => ({
                number: note.number,
                refId: footnoteRefId(note),
                noteId: footnoteNoteId(note),
              }))}
            >
              {footnotes.map((note) => (
                <PortableText
                  key={note._key}
                  value={(note.body ?? []) as PortableTextBlock[]}
                />
              ))}
            </FootnoteMargin>
          ) : undefined
        }
      >
        <article className="article-load">
          {post.status === "archived" ? <ArchivedNotice /> : null}

          <ArticleHeader
            kind={post.kind}
            readingTime={post.readingTime}
            publishedAt={post.publishedAt}
            title={post.title ?? ""}
            deck={post.excerpt}
            authorName={post.author?.name}
            url={url}
          />

          {/* §6.4 — cover BELOW the title: the title is the entry point. */}
          {post.coverImage?.asset ? (
            <div className="mt-10">
              <Figure
                value={{ ...post.coverImage, layout: post.coverImage.layout ?? "wide" }}
              />
            </div>
          ) : null}

          <Prose className="mt-12">
            <PortableTextRenderer value={body} />
          </Prose>

          <UpdateNote updatedAt={post.updatedAt} revisionNote={post.revisionNote} />
          <TagList tags={post.tags ?? []} />
          <AuthorStrip
            name={post.author?.name}
            bio={(post.author?.bio ?? null) as PortableTextBlock[] | null}
          />
          <SeriesNav series={post.series} currentSlug={slug} />
          <RelatedGrid items={related} />
          <SubscribeBlock source={`post:${slug}`} />
          <PrevNext previous={prevNext?.previous} next={prevNext?.next} />
        </article>
      </ArticleGrid>
    </>
  );
}
