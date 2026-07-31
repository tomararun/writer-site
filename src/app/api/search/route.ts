import type { NextRequest } from "next/server";
import { hashIp, requestIp } from "@/lib/form-security";
import { checkRateLimit } from "@/lib/rate-limit";
import { runSearch } from "@/lib/search";

/**
 * SPEC §5.4 — GET /api/search?q=&type=&year=&page=
 * Public, 30/min per hashed IP, q ≤ 120 chars, facets validated as enums.
 * Returns { results, facets, total, tookMs } (§4.6).
 */

const TYPES = new Set(["post", "caseStudy", "journalEntry", "project", "page"]);

export async function GET(request: NextRequest) {
  const ipHash = hashIp(requestIp(request.headers));
  if (!(await checkRateLimit("search", ipHash))) {
    return Response.json({ error: "Rate limited — try again in a minute." }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").slice(0, 120);
  const typeParam = params.get("type");
  const type = typeParam && TYPES.has(typeParam) ? typeParam : null;
  const yearParam = Number(params.get("year"));
  const year =
    Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100 ? yearParam : null;
  const pageParam = Number(params.get("page"));
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? Math.min(pageParam, 50) : 1;

  try {
    const response = await runSearch({ q, type, year, page });
    return Response.json(response, {
      headers: { "cache-control": "public, max-age=30, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Search failed:", error);
    return Response.json(
      { error: "Search is unavailable right now." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
