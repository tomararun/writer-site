import { loadFeedItems } from "@/lib/feed-data";
import { buildRss } from "@/lib/feeds";
import { site } from "@/site.config";

/** §4.7 — /rss.xml: everything, newest first. */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const { all } = await loadFeedItems();
  const xml = buildRss({
    title: `${site.name} — all posts`,
    description: site.description,
    feedPath: "/rss.xml",
    items: all,
  });
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
