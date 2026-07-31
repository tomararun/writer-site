"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { ConfirmSubscription } from "@/emails/ConfirmSubscription";
import {
  confirmExpiry,
  hashIp,
  newToken,
  requestIp,
  userAgentFamily,
} from "@/lib/form-security";
import type { FormState } from "@/lib/form-state";
import { sendEmail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { fieldErrors, subscribeSchema } from "@/lib/validators";
import { site } from "@/site.config";

/**
 * SPEC §5.4 — subscribeToNewsletter: Zod → honeypot → rate limit (5/10min
 * per hashed IP) → Turnstile → insert pending → send opt-in email.
 *
 * ALWAYS the same success message (no email enumeration): a bot filling the
 * honeypot, an address that's already confirmed, and a brand-new subscriber
 * all read "check your inbox".
 */

const SUCCESS: FormState = {
  status: "success",
  message: "Almost there — check your inbox and click the confirmation link.",
};

export async function subscribeToNewsletter(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const parsed = subscribeSchema.safeParse({
      email: formData.get("email"),
      source: formData.get("source") ?? undefined,
      website: formData.get("website") ?? "",
      turnstileToken: formData.get("cf-turnstile-response") ?? undefined,
    });

    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      // A filled honeypot is a bot: reply success, store nothing.
      if (errors.website) return SUCCESS;
      return {
        status: "error",
        message: errors.email ?? "Check the form and try again.",
        fieldErrors: errors,
      };
    }

    const headerList = await headers();
    const ipHash = hashIp(requestIp(headerList));

    if (!(await checkRateLimit("subscribe", ipHash))) {
      return {
        status: "error",
        message: "A few attempts already — wait ten minutes and try once more.",
      };
    }

    const turnstile = await verifyTurnstile(parsed.data.turnstileToken, requestIp(headerList));
    if (!turnstile.ok) {
      return {
        status: "error",
        message: "Couldn't verify you're human. Reload the page and try again.",
      };
    }

    if (!isDbConfigured()) {
      console.warn("subscribeToNewsletter: DATABASE_URL not set — nothing stored.");
      return {
        status: "error",
        message: `Subscriptions aren't wired up yet — email ${site.email} and I'll add you by hand.`,
      };
    }

    const db = getDb();
    const email = parsed.data.email;
    const existing = await db.query.subscribers.findFirst({
      where: eq(schema.subscribers.email, email),
    });

    // Already confirmed: same success message, no second confirm email —
    // nothing here reveals whether an address is on the list.
    if (existing?.status === "confirmed") return SUCCESS;

    const token = newToken();
    const expiresAt = confirmExpiry();
    let subscriberId: string;

    if (existing) {
      await db
        .update(schema.subscribers)
        .set({
          status: "pending",
          confirmToken: token,
          confirmExpiresAt: expiresAt,
          source: parsed.data.source,
        })
        .where(eq(schema.subscribers.id, existing.id));
      subscriberId = existing.id;
    } else {
      const inserted = await db
        .insert(schema.subscribers)
        .values({
          email,
          status: "pending",
          confirmToken: token,
          confirmExpiresAt: expiresAt,
          source: parsed.data.source,
          ipHash,
          userAgentFamily: userAgentFamily(headerList),
        })
        .returning({ id: schema.subscribers.id });
      subscriberId = inserted[0]!.id;
    }

    await db.insert(schema.subscriberEvents).values({
      subscriberId,
      event: existing ? "resent" : "requested",
      meta: { source: parsed.data.source },
    });

    const confirmUrl = `${site.url}/api/newsletter/confirm?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Confirm your subscription",
      react: ConfirmSubscription({ confirmUrl, siteName: site.name }),
      devSummary: `Confirm URL: ${confirmUrl}`,
    });

    return SUCCESS;
  } catch (error) {
    console.error("subscribeToNewsletter failed:", error);
    return {
      status: "error",
      message: "Something went wrong on my end. Try again in a minute, or email me.",
    };
  }
}
