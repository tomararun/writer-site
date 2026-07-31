import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { hashIp, isExpired, requestIp } from "@/lib/form-security";
import { createAudienceContact } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * SPEC §5.4 — GET /api/newsletter/confirm?token=…
 * Token exists + not expired → status confirmed, Resend contact created,
 * redirect to the /newsletter/confirm result page. Rate limit 20/hr.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const resultUrl = (state: string) => `/newsletter/confirm?state=${state}`;

  if (!token || !/^[a-f0-9]{16,64}$/.test(token) || !isDbConfigured()) {
    redirect(resultUrl("invalid"));
  }

  const ipHash = hashIp(requestIp(request.headers));
  if (!(await checkRateLimit("confirm", ipHash))) {
    redirect(resultUrl("invalid"));
  }

  const db = getDb();
  const subscriber = await db.query.subscribers.findFirst({
    where: eq(schema.subscribers.confirmToken, token),
  });

  if (!subscriber) redirect(resultUrl("invalid"));
  if (subscriber.status === "confirmed") redirect(resultUrl("ok"));
  if (isExpired(subscriber.confirmExpiresAt)) redirect(resultUrl("expired"));

  const providerId = await createAudienceContact(subscriber.email);

  await db
    .update(schema.subscribers)
    .set({
      status: "confirmed",
      confirmedAt: new Date(),
      confirmToken: null,
      confirmExpiresAt: null,
      ...(providerId ? { providerId } : {}),
    })
    .where(eq(schema.subscribers.id, subscriber.id));

  await db
    .insert(schema.subscriberEvents)
    .values({ subscriberId: subscriber.id, event: "confirmed" });

  redirect(resultUrl("ok"));
}
