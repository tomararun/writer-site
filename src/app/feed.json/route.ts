import { loadFeedItems } from "@/lib/feed-data";
import { buildJsonFeed } from "@/lib/feeds";
import { site } from "@/site.config";

/** §4.7 — /feed.json: JSON Feed 1.1, everything. */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const { all } = await loadFeedItems();
  const json = buildJsonFeed({
    title: `${site.name} — all posts`,
    description: site.description,
    feedPath: "/feed.json",
    items: all,
  });
  return new Response(json, {
    headers: { "content-type": "application/feed+json; charset=utf-8" },
  });
}
