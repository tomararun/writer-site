import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";

/**
 * SPEC §5.4 — nightly Vercel Cron (03:00 UTC):
 * 1. Refresh content_popularity CONCURRENTLY (§5.3 — the "most read" module).
 * 2. Expire stale double-opt-in tokens (§5.4 nightly job).
 * 3. Full revalidate — the §5.4 safety net for taxonomy moves the webhook's
 *    payload couldn't see.
 * (The weekly dataset backup lives in GitHub Actions, not here.)
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report: Record<string, unknown> = {};

  if (isDbConfigured()) {
    const db = getDb();
    try {
      await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY content_popularity`);
      report.popularityRefreshed = true;
    } catch (error) {
      console.error("content_popularity refresh failed:", error);
      report.popularityRefreshed = false;
    }

    try {
      const expired = await db
        .update(schema.subscribers)
        .set({ confirmToken: null, confirmExpiresAt: null })
        .where(
          and(
            eq(schema.subscribers.status, "pending"),
            lt(schema.subscribers.confirmExpiresAt, new Date()),
          ),
        )
        .returning({ id: schema.subscribers.id });
      report.tokensExpired = expired.length;
    } catch (error) {
      console.error("Token expiry failed:", error);
      report.tokensExpired = "failed";
    }
  } else {
    report.database = "not configured — skipped popularity refresh and token expiry";
  }

  // The nightly full revalidate: every page re-renders on next request.
  revalidatePath("/", "layout");
  report.fullRevalidate = true;

  return Response.json(report);
}
