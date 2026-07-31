"use server";

import { headers } from "next/headers";
import { getDb, isDbConfigured, schema } from "@/db";
import { ContactNotification } from "@/emails/ContactNotification";
import { hashIp, requestIp } from "@/lib/form-security";
import type { FormState } from "@/lib/form-state";
import { sendEmail } from "@/lib/mailer";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { contactSchema, fieldErrors } from "@/lib/validators";
import { site } from "@/site.config";

/**
 * SPEC §5.4 — sendContactMessage: Zod → honeypot → rate limit (3/hr per
 * hashed IP) → Turnstile → store → notify by email with reply-to = sender.
 */

const SUCCESS: FormState = {
  status: "success",
  message: "Message sent. I'll reply within a few days.",
};

export async function sendContactMessage(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const parsed = contactSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      subject: formData.get("subject") || undefined,
      message: formData.get("message"),
      website: formData.get("website") ?? "",
      turnstileToken: formData.get("cf-turnstile-response") ?? undefined,
    });

    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      if (errors.website) return SUCCESS; // bot: pretend it worked
      return {
        status: "error",
        message: "Check the highlighted fields and send again.",
        fieldErrors: errors,
      };
    }

    const headerList = await headers();
    const ip = requestIp(headerList);
    const ipHash = hashIp(ip);

    if (!(await checkRateLimit("contact", ipHash))) {
      return {
        status: "error",
        message: `You've sent a few already. Try again in an hour, or email me directly at ${site.email}.`,
      };
    }

    const turnstile = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!turnstile.ok) {
      return {
        status: "error",
        message: "Couldn't verify you're human. Reload the page and try again.",
      };
    }

    if (!isDbConfigured()) {
      console.warn("sendContactMessage: DATABASE_URL not set — nothing stored.");
      return {
        status: "error",
        message: `The form isn't wired up yet — email ${site.email} instead.`,
      };
    }

    const db = getDb();
    await db.insert(schema.contactMessages).values({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject ?? null,
      topic: parsed.data.topic,
      message: parsed.data.message,
      ipHash,
    });

    const to = process.env.EMAIL_TO_CONTACT;
    if (to) {
      await sendEmail({
        to,
        subject: `Contact: ${parsed.data.subject ?? parsed.data.topic} — ${parsed.data.name}`,
        react: ContactNotification({
          name: parsed.data.name,
          email: parsed.data.email,
          topic: parsed.data.topic,
          subject: parsed.data.subject,
          message: parsed.data.message,
        }),
        replyTo: parsed.data.email,
        devSummary: `From ${parsed.data.name} <${parsed.data.email}>`,
      });
    } else {
      console.info(
        "[contact] EMAIL_TO_CONTACT not set — message stored, no notification sent.",
      );
    }

    return SUCCESS;
  } catch (error) {
    console.error("sendContactMessage failed:", error);
    return {
      status: "error",
      message: "Something went wrong on my end. Try again in a minute, or email me.",
    };
  }
}
