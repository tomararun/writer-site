import type { Metadata } from "next";
import { Container } from "@/components/primitives/Container";
import type { SearchParams } from "@/lib/index-params";
import { SearchClient } from "./SearchClient";

/**
 * SPEC §6.13 / §4.3 — /search: the one dynamic page. noindex,follow; the
 * client does the querying against /api/search so typing never re-renders
 * the server tree.
 */

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const type = typeof params.type === "string" ? params.type : null;
  const yearNumber = Number(params.year);
  const year = Number.isInteger(yearNumber) && yearNumber > 2000 ? yearNumber : null;

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="sr-only">Search</h1>
      <div className="mx-auto max-w-3xl">
        <SearchClient initialQuery={q} initialType={type} initialYear={year} />
      </div>
    </Container>
  );
}
