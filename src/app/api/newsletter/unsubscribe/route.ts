import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";

/**
 * SPEC §5.4 — one-click unsubscribe: no login, no confirmation step, no
 * guilt screen. GET serves the email-footer link; POST serves RFC 8058
 * List-Unsubscribe=One-Click (mail clients call it machine-to-machine).
 */

async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token || !/^[a-f0-9]{16,64}$/.test(token) || !isDbConfigured()) return false;

  const db = getDb();
  const subscriber = await db.query.subscribers.findFirst({
    where: eq(schema.subscribers.unsubscribeToken, token),
  });
  if (!subscriber) return false;

  if (subscriber.status !== "unsubscribed") {
    await db
      .update(schema.subscribers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(schema.subscribers.id, subscriber.id));
    await db
      .insert(schema.subscriberEvents)
      .values({ subscriberId: subscriber.id, event: "unsubscribed" });
  }
  return true;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await unsubscribe(token);
  // The result page never reveals whether the token matched.
  redirect("/newsletter/unsubscribed");
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await unsubscribe(token);
  return Response.json({ ok: true });
}
