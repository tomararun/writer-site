import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import {
  isIndexable,
  pathsFor,
  tagsFor,
  type RevalidationPayload,
} from "@/lib/revalidate-paths";
import {
  deleteSearchDocument,
  upsertSearchDocument,
  type SearchDocInput,
} from "@/lib/search-index";

/**
 * SPEC §5.4 — the Sanity webhook: HMAC-verified, idempotent via
 * webhook_deliveries, revalidates every affected path and tag, and keeps
 * search_documents in sync (upsert while published, delete otherwise).
 *
 * Configure the webhook in Sanity with the projection documented in
 * PHASE-6-NOTES — the taxonomy slugs and plainText must be in the payload.
 */

type WebhookPayload = RevalidationPayload &
  SearchDocInput & {
    status?: string | null;
  };

async function alreadyProcessed(eventId: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const db = getDb();
  const existing = await db.query.webhookDeliveries.findFirst({
    where: eq(schema.webhookDeliveries.eventId, eventId),
  });
  return Boolean(existing);
}

async function recordDelivery(
  eventId: string,
  payload: unknown,
  status: string,
  error?: string,
) {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db
    .insert(schema.webhookDeliveries)
    .values({ source: "sanity", eventId, payload: payload ?? {}, status, error })
    .onConflictDoNothing();
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "SANITY_WEBHOOK_SECRET is not configured" }, { status: 503 });
  }

  const { isValidSignature, body } = await parseBody<WebhookPayload>(request, secret);
  if (!isValidSignature) {
    return new Response("Invalid signature", { status: 401 });
  }
  if (!body?._id || !body._type) {
    return Response.json({ error: "Missing _id/_type in payload" }, { status: 400 });
  }

  const eventId = `${body._id}@${body._rev ?? "unknown"}`;
  try {
    if (await alreadyProcessed(eventId)) {
      return Response.json({ skipped: true });
    }

    const paths = pathsFor(body);
    const tags = tagsFor(body);
    paths.forEach((path) => revalidatePath(path));
    tags.forEach((tag) => revalidateTag(tag));

    // §5.4 — the index mirrors publication state.
    if (isIndexable(body._type)) {
      const isPublished =
        body._type === "project" || body._type === "page" ? true : body.status === "published";
      if (isPublished) {
        await upsertSearchDocument(body);
      } else {
        await deleteSearchDocument(body._id);
      }
    }

    await recordDelivery(eventId, body, "ok");
    return Response.json({ revalidated: paths, tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Revalidate webhook failed:", message);
    await recordDelivery(eventId, body, "error", message).catch(() => {});
    return Response.json({ error: message }, { status: 500 });
  }
}
