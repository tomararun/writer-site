import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

/**
 * SPEC P2 — two clients, one per perspective.
 *
 * `publishedClient` is what readers hit: CDN-cached, published content only,
 * no stega overlay. `draftClient` exists for preview mode: uncached, token
 * authenticated, sees drafts layered over published documents.
 */
export const publishedClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
  stega: false,
});

export const draftClient = publishedClient.withConfig({
  useCdn: false,
  // Server-only: never NEXT_PUBLIC. Absent until Phase 2 wires preview mode.
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: "drafts",
});
