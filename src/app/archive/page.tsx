import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import { ArchiveExplorer } from "@/components/modules/ArchiveExplorer";
import { PageHeader } from "@/components/modules/IndexChrome";
import { toArchiveItems } from "@/lib/archive-filter";
import { sanityFetch } from "@/sanity/lib/fetch";
import { archiveIndexQuery } from "@/sanity/lib/queries";

/**
 * SPEC §6.10 / §4.3 — the archive: a working index. The page is static; the
 * lean index arrives with it and every filter runs client-side, instantly,
 * with URL sync. Filter states canonicalise to /archive (only /archive and
 * the year pages are indexable).
 */

export const metadata: Metadata = {
  title: "Archive",
  description: "Everything published here, filterable by type, category, tag and year.",
  alternates: { canonical: "/archive" },
};

export default async function ArchivePage() {
  const rows = await sanityFetch({
    query: archiveIndexQuery,
    tags: ["post", "caseStudy", "journalEntry"],
  }).catch(() => []);
  const items = toArchiveItems(rows);

  const years = items
    .map((item) => item.date?.slice(0, 4))
    .filter((year): year is string => Boolean(year));
  const firstYear = years.length > 0 ? years.sort()[0] : null;

  return (
    <Container className="py-12 sm:py-16">
      <span id="top" />
      <PageHeader
        title="Archive"
        promise={
          items.length > 0
            ? `Everything I've published here, ${items.length} pieces${firstYear ? ` since ${firstYear}` : ""}. Filter it however you like.`
            : "Everything published here will be filterable from this page."
        }
      />
      <ArchiveExplorer items={items} />
    </Container>
  );
}
