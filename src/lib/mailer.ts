import type { ReactElement } from "react";
import { Resend } from "resend";

/**
 * One door to Resend. Without RESEND_API_KEY (local dev, CI) sends are
 * logged instead of thrown, so the whole subscribe/contact flow is walkable
 * before credentials exist — the confirm URL appears in the server console.
 */

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  cached ??= new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "writer-site <onboarding@resend.dev>";
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
  headers?: Record<string, string>;
  /** Logged instead of the body when no API key is configured. */
  devSummary: string;
}): Promise<{ sent: boolean }> {
  const resend = getResend();
  if (!resend) {
    console.info(
      `[mailer] RESEND_API_KEY not set — would send "${options.subject}" to ${options.to}. ${options.devSummary}`,
    );
    return { sent: false };
  }
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: options.to,
    subject: options.subject,
    react: options.react,
    replyTo: options.replyTo,
    headers: options.headers,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
  return { sent: true };
}

/** §5.4 confirm step — create the Resend audience contact, if configured. */
export async function createAudienceContact(email: string): Promise<string | null> {
  const resend = getResend();
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!resend || !audienceId) return null;
  try {
    const { data } = await resend.contacts.create({ email, audienceId, unsubscribed: false });
    return data?.id ?? null;
  } catch (error) {
    // The subscription is still confirmed in our DB; the contact can be
    // backfilled. Don't fail the reader's confirm click over it.
    console.error("Resend contact creation failed:", error);
    return null;
  }
}
