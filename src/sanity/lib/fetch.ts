import { draftMode } from "next/headers";
import type { ClientReturn, QueryParams } from "next-sanity";
import { draftClient, publishedClient } from "./client";

/**
 * SPEC P2 — the one way to read content. Takes { query, params, tags,
 * revalidate } and switches client on draftMode():
 *
 * - Published: CDN client, ISR-cached, tagged for on-demand revalidation by
 *   the webhook (Phase 7). Every call MUST pass tags — untagged content can
 *   never be revalidated on demand and goes stale for `revalidate` seconds.
 * - Draft (preview): token client, no store, drafts perspective.
 *
 * The generic threads the literal query string through to `ClientReturn`, so
 * results are typed by sanity-typegen with zero annotations at call sites.
 */
export async function sanityFetch<const QueryString extends string>({
  query,
  params = {},
  tags,
  revalidate = 3600,
}: {
  query: QueryString;
  params?: QueryParams;
  /** Cache tags for on-demand revalidation — e.g. ["post"], ["post:my-slug"]. */
  tags: string[];
  /** Safety-net ISR window in seconds (§4.3). `false` = cache forever, tags only. */
  revalidate?: number | false;
}): Promise<ClientReturn<QueryString>> {
  const { isEnabled: isDraft } = await draftMode();

  if (isDraft) {
    if (!process.env.SANITY_API_READ_TOKEN) {
      throw new Error("Preview requires SANITY_API_READ_TOKEN to be set.");
    }
    return draftClient.fetch(query, params, { cache: "no-store" });
  }

  return publishedClient.fetch(query, params, {
    next: { revalidate, tags },
  });
}
