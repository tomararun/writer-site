import type { APIRequestContext } from "@playwright/test";

/** The seeded article every content-dependent spec keys off. */
export const SEEDED_POST_PATH = "/writing/the-66-character-rule";

/** True when the server is running against a seeded Sanity dataset. */
export async function hasSeededContent(request: APIRequestContext): Promise<boolean> {
  const response = await request.get(SEEDED_POST_PATH);
  return response.status() === 200;
}

/** True when /api/search is backed by a reachable database. */
export async function hasSearchBackend(request: APIRequestContext): Promise<boolean> {
  const response = await request.get("/api/search?q=test");
  return response.status() === 200;
}
