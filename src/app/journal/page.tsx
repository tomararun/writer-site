import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import { SubscribeBlock } from "@/components/modules/ArticleFooter";
import { FilterBar } from "@/components/modules/FilterBar";
import { EmptyState, PageHeader } from "@/components/modules/IndexChrome";
import { MonthGroupSection, MoodLegend, YearStrip } from "@/components/modules/JournalLedger";
import { LoadMore } from "@/components/modules/LoadMore";
import { parseJournalParams, type SearchParams } from "@/lib/index-params";
import { groupByMonth, yearStats } from "@/lib/journal-stats";
import { blogJsonLd } from "@/lib/jsonld";
import { sanityFetch } from "@/sanity/lib/fetch";
import { journalIndexQuery, journalTopicsQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §6.7 — the learning journal: a LEDGER, not a card grid. Sticky month
 * headings, a year summary strip (the payoff of keeping the journal), topic
 * filter as URL state.
 */

const PAGE_SIZE = 30;

export const metadata: Metadata = {
  title: "Learning journal",
  description:
    "A public learning log: short, dated notes on what I'm learning, unedited on purpose. These pages go back further than the essays.",
  alternates: { canonical: "/journal" },
};

export default async function JournalIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { topic, page } = parseJournalParams(await searchParams);

  const [allEntries, topics] = await Promise.all([
    sanityFetch({ query: journalIndexQuery, tags: ["journalEntry", "tag"] }),
    sanityFetch({ query: journalTopicsQuery, tags: ["journalEntry", "tag"] }),
  ]);

  // The year strip reflects the whole journal; the filter narrows the list.
  const stats = yearStats(allEntries);
  const filtered = topic
    ? allEntries.filter((entry) => (entry.topics ?? []).some((t) => t.slug === topic))
    : allEntries;
  const visible = filtered.slice(0, PAGE_SIZE * page);
  const groups = groupByMonth(visible);

  const jsonLd = blogJsonLd({
    name: "Learning journal",
    url: `${site.url}/journal`,
    description: "A public learning log.",
    posts: visible
      .filter((entry) => entry.slug)
      .map((entry) => ({
        url: `${site.url}/journal/${entry.slug}`,
        headline: entry.title ?? entry.entryDate ?? "Journal entry",
        datePublished: entry.entryDate,
      })),
  });

  let startIndex = 0;

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        title="Learning journal"
        promise="Short, dated notes on what I'm learning. Written for me, left public on purpose. Unedited — expect half-formed thoughts and the occasional wrong answer I later corrected."
      />

      <div className="mt-8 space-y-4">
        <YearStrip stats={stats} />
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <MoodLegend />
        </div>
        <FilterBar
          summary={`Showing ${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}${
            topic ? ` on “${topics.find((t) => t.slug === topic)?.title ?? topic}”` : ""
          }`}
          groups={[
            {
              param: "topic",
              label: "Topic",
              allLabel: "All topics",
              options: topics
                .filter((t) => t.title && t.slug)
                .map((t) => ({ label: t.title!, value: t.slug! })),
            },
          ]}
        />
      </div>

      {visible.length === 0 ? (
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
        <>
          <div className="mt-6 space-y-10">
            {groups.map((group) => {
              const section = (
                <MonthGroupSection key={group.key} group={group} startIndex={startIndex} />
              );
              startIndex += group.entries.length;
              return section;
            })}
          </div>
          <LoadMore
            loadedCount={visible.length}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            nextPage={page + 1}
            itemIdPrefix="entry"
            noun="entries"
          />
        </>
      )}

      <div className="mt-16">
        <SubscribeBlock
          variant="panel"
          heading={site.newsletter.heading}
          pitch={site.newsletter.pitch}
        />
      </div>
    </Container>
  );
}
