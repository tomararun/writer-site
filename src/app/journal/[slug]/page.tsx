import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import type { PortableTextBlock } from "next-sanity";
import { Container } from "@/components/primitives/Container";
import { Prose } from "@/components/primitives/Prose";
import { PortableTextRenderer } from "@/components/content/PortableTextRenderer";
import { CodeBlock } from "@/components/content/CodeBlock";
import {
  MoodGlyph,
  ReflectionBlock,
  RelatedEntries,
  ResourceList,
  TimeSpent,
  TopicChips,
  type JournalTeaser,
} from "@/components/modules/Journal";
import { PrevNext } from "@/components/modules/ArticleFooter";
import { formatDate, formatDayMonth, isoDate } from "@/lib/format";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { relatedContent } from "@/lib/related";
import { ogImageUrl } from "@/lib/seo";
import { isPubliclyVisible } from "@/lib/visibility";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  journalEntryBySlugQuery,
  journalRelatedCandidatesQuery,
  journalSlugsQuery,
  prevNextJournalQuery,
} from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.8 — a page torn from a notebook: narrow measure (60ch), no cover,
 * no rail. Date large in mono, hairline, text, then the reflection block —
 * the point of the whole type.
 */

export async function generateStaticParams() {
  try {
    const slugs = await publishedClient.fetch(journalSlugsQuery);
    return slugs.filter(Boolean).map((slug) => ({ slug: slug! }));
  } catch {
    return [];
  }
}

async function fetchEntry(slug: string) {
  return sanityFetch({
    query: journalEntryBySlugQuery,
    params: { slug },
    tags: ["journalEntry", `journalEntry:${slug}`, "tag", "resource"],
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let entry: Awaited<ReturnType<typeof fetchEntry>> = null;
  try {
    entry = await fetchEntry(slug);
  } catch {
    return {};
  }
  if (!entry) return {};

  const dateLabel = formatDate(entry.entryDate);
  // §6.8 — very short entries borrow the reflection as their description.
  const description = entry.reflection ?? undefined;

  return {
    title: `${entry.title ?? dateLabel} — ${dateLabel} — Journal`,
    description,
    alternates: { canonical: `/journal/${slug}` },
    openGraph: {
      type: "article",
      publishedTime: entry.entryDate ?? undefined,
      images: [ogImageUrl({ slug, type: "journalEntry", updatedAt: entry.entryDate })],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function JournalEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await fetchEntry(slug);
  const { isEnabled: isPreview } = await draftMode();

  if (!entry) notFound();
  if (!isPreview && !isPubliclyVisible(entry.status, entry.publishedAt)) notFound();

  const [prevNext, related] = await Promise.all([
    entry.entryDate
      ? sanityFetch({
          query: prevNextJournalQuery,
          params: { entryDate: entry.entryDate },
          tags: ["journalEntry"],
        })
      : Promise.resolve(null),
    (async (): Promise<JournalTeaser[]> => {
      // §3.3 — the manual list wins; the topic-overlap scorer fills in.
      const manual = (entry.relatedEntries ?? []).filter((e) => e.slug);
      if (manual.length > 0) return manual as JournalTeaser[];
      const candidates = await sanityFetch({
        query: journalRelatedCandidatesQuery,
        params: { id: entry._id, topicIds: entry.topicIds ?? [] },
        tags: ["journalEntry"],
      });
      return relatedContent(
        { _id: entry._id, tagIds: entry.topicIds },
        candidates,
      ) as JournalTeaser[];
    })(),
  ]);

  const url = `${site.url}/journal/${slug}`;
  const jsonLd = [
    breadcrumbJsonLd([
      { name: site.name, url: site.url },
      { name: "Journal", url: `${site.url}/journal` },
      { name: entry.title ?? formatDate(entry.entryDate), url },
    ]),
    blogPostingJsonLd({
      url,
      headline: entry.title ?? formatDate(entry.entryDate),
      description: entry.reflection,
      datePublished: entry.entryDate,
      wordCount: entry.wordCount,
      keywords: (entry.topics ?? []).map((topic) => topic.title),
      articleSection: "Journal",
    }),
  ];

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="article-load mx-auto max-w-[var(--measure-narrow)]">
        <nav aria-label="Breadcrumb">
          <Link
            href="/journal"
            className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted no-underline transition-colors hover:text-ink"
          >
            ← Journal
          </Link>
        </nav>

        <header className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <time
              dateTime={isoDate(entry.entryDate)}
              className="font-mono text-[var(--text-md)] uppercase tracking-[var(--tracking-mono)] md:text-[var(--text-2xl)]"
            >
              {formatDate(entry.entryDate)}
            </time>
            <MoodGlyph mood={entry.mood} />
          </div>
          {entry.title ? (
            <h1 className="mt-4 font-display text-[var(--text-lg)] font-semibold">
              {entry.title}
            </h1>
          ) : (
            <h1 className="sr-only">Journal entry, {formatDate(entry.entryDate)}</h1>
          )}
          <div className="mt-4">
            <TopicChips topics={entry.topics} />
          </div>
        </header>

        <hr className="mt-6 border-t border-rule" />

        <Prose measure="narrow" className="mt-8">
          <PortableTextRenderer value={(entry.body ?? []) as PortableTextBlock[]} />
        </Prose>

        {(entry.codeSnippets ?? []).length > 0 ? (
          <div className="prose prose--narrow mt-8">
            {entry.codeSnippets!.map((snippet, i) => (
              <CodeBlock key={i} value={snippet} />
            ))}
          </div>
        ) : null}

        <ReflectionBlock reflection={entry.reflection} />
        <ResourceList resources={entry.resources} />
        <TimeSpent minutes={entry.timeSpent} />
        <RelatedEntries entries={related} />

        <PrevNext
          basePath="/journal"
          labels={{ previous: "Older", next: "Newer" }}
          previous={
            prevNext?.previous
              ? {
                  title: `${formatDayMonth(prevNext.previous.entryDate)}: ${
                    prevNext.previous.title ?? "Untitled"
                  }`,
                  slug: prevNext.previous.slug,
                }
              : null
          }
          next={
            prevNext?.next
              ? {
                  title: `${formatDayMonth(prevNext.next.entryDate)}: ${
                    prevNext.next.title ?? "Untitled"
                  }`,
                  slug: prevNext.next.slug,
                }
              : null
          }
        />
      </article>
    </Container>
  );
}
