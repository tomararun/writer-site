import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/primitives/Container";
import { PageHeader } from "@/components/modules/IndexChrome";
import { groupItemsByYear, toArchiveItems, yearOf } from "@/lib/archive-filter";
import { formatDayMonth, isoDate } from "@/lib/format";
import { publishedClient } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/fetch";
import { archiveIndexQuery } from "@/sanity/lib/queries";

/**
 * SPEC §6.10 SEO — /archive/[year]: server-rendered and indexable, with its
 * own title. Genuinely useful, genuinely crawlable.
 */

const TYPE_LABEL: Record<string, string> = {
  post: "Writing",
  caseStudy: "Case study",
  journalEntry: "Journal",
};

export async function generateStaticParams() {
  try {
    const rows = await publishedClient.fetch(archiveIndexQuery);
    const years = new Set(
      toArchiveItems(rows)
        .map((item) => yearOf(item))
        .filter((year): year is string => Boolean(year)),
    );
    return [...years].map((year) => ({ year }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Everything I published in ${year}`,
    description: `The complete ${year} archive: essays, case studies and journal entries.`,
    alternates: { canonical: `/archive/${year}` },
  };
}

export default async function ArchiveYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();

  const rows = await sanityFetch({
    query: archiveIndexQuery,
    tags: ["post", "caseStudy", "journalEntry"],
  }).catch(() => []);
  const items = toArchiveItems(rows).filter((item) => yearOf(item) === year);
  if (items.length === 0) notFound();

  const group = groupItemsByYear(items)[0]!;

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title={`Everything I published in ${year}`}
        promise={`${items.length} ${items.length === 1 ? "piece" : "pieces"}. The full, filterable archive is one step up.`}
      />

      <p className="mt-4">
        <Link
          href="/archive"
          className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-accent no-underline"
        >
          ← Full archive
        </Link>
      </p>

      <ol className="mt-8 max-w-3xl">
        {group.items.map((item) => (
          <li key={item.id} className="group relative">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-rule py-3">
              <time
                dateTime={isoDate(item.date)}
                className="w-14 shrink-0 font-mono text-[var(--text-2xs)] text-ink-muted"
              >
                {formatDayMonth(item.date)}
              </time>
              <span className="w-24 shrink-0 font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
                {TYPE_LABEL[item.type] ?? item.type}
              </span>
              <span className="min-w-0 flex-1 font-display text-[var(--text-sm)] font-medium">
                <Link href={item.path} className="no-underline after:absolute after:inset-0">
                  <span className="card-rule">{item.title}</span>
                </Link>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Container>
  );
}
