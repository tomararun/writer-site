import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { pathsFor, tagsFor } from "@/lib/revalidate-paths";
import { upsertSearchDocument } from "@/lib/search-index";
import { publishedClient } from "@/sanity/lib/client";
import { recentlyPublishedQuery } from "@/sanity/lib/queries";

/**
 * SPEC §5.4/§5.5 — hourly Vercel Cron. Scheduled documents (published
 * status, future publishedAt) become visible the moment now() passes their
 * date — in QUERIES. Static pages don't know that, so this cron finds
 * everything whose date crossed in the last two hours (one hour + overlap)
 * and revalidates its paths, tags and search row.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const docs = await publishedClient.fetch(recentlyPublishedQuery, { since });

    const revalidated: string[] = [];
    for (const doc of docs) {
      const paths = pathsFor(doc);
      paths.forEach((path) => revalidatePath(path));
      tagsFor(doc).forEach((tag) => revalidateTag(tag));
      await upsertSearchDocument(doc).catch((error: unknown) =>
        console.error(`Search upsert failed for ${doc._id}:`, error),
      );
      revalidated.push(...paths);
    }

    return Response.json({ published: docs.length, revalidated: [...new Set(revalidated)] });
  } catch (error) {
    console.error("publish-scheduled cron failed:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
