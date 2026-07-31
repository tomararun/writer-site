import { loadFeedItems } from "@/lib/feed-data";
import { buildRss } from "@/lib/feeds";
import { site } from "@/site.config";

/** §4.7 — /feed/writing.xml: posts only, FULL content. */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const { posts } = await loadFeedItems();
  const xml = buildRss({
    title: `${site.name} — writing`,
    description: "Essays, tutorials and arguments — full text.",
    feedPath: "/feed/writing.xml",
    items: posts,
  });
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
