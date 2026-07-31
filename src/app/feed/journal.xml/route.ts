import { loadFeedItems } from "@/lib/feed-data";
import { buildRss } from "@/lib/feeds";
import { site } from "@/site.config";

/** §4.7 — /feed/journal.xml: the learning journal. */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const { journal } = await loadFeedItems();
  const xml = buildRss({
    title: `${site.name} — learning journal`,
    description: "Short, dated notes on what I'm learning — unedited on purpose.",
    feedPath: "/feed/journal.xml",
    items: journal,
  });
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
