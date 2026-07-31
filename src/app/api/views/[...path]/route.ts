import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { hashIp, requestIp } from "@/lib/form-security";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * SPEC §5.4 — POST /api/views/<path>: fire-and-forget view counting behind
 * NEXT_PUBLIC_ENABLE_VIEW_COUNTS. 1/30min per (IP-hash, path); the path must
 * exist in search_documents; aggregate-only storage (path, day, views).
 * Failure is always silent-shaped: the client never retries.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (process.env.NEXT_PUBLIC_ENABLE_VIEW_COUNTS !== "true" || !isDbConfigured()) {
    return Response.json({ ok: false }, { status: 202 });
  }

  const { path: segments } = await params;
  const path = `/${segments.join("/")}`;
  if (!/^\/[a-z0-9/-]{1,120}$/.test(path)) {
    return Response.json({ ok: false }, { status: 202 });
  }

  const ipHash = hashIp(requestIp(request.headers));
  if (!(await checkRateLimit("views", `${ipHash}:${path}`))) {
    return Response.json({ ok: false }, { status: 202 });
  }

  try {
    const db = getDb();
    const known = await db.query.searchDocuments.findFirst({
      where: eq(schema.searchDocuments.path, path),
      columns: { id: true },
    });
    if (!known) return Response.json({ ok: false }, { status: 202 });

    const today = new Date().toISOString().slice(0, 10);
    await db
      .insert(schema.pageViews)
      .values({ path, day: today, views: 1 })
      .onConflictDoUpdate({
        target: [schema.pageViews.path, schema.pageViews.day],
        set: { views: sql`${schema.pageViews.views} + 1` },
      });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("View count failed:", error);
    return Response.json({ ok: false }, { status: 202 });
  }
}
