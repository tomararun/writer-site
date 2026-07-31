import { z } from "zod";

/**
 * SPEC P6 — Zod schemas shared between client and server. The server is
 * authoritative; the client uses the same schema for instant feedback.
 * Error copy comes from §6.11/§6.12 verbatim.
 */

export const CONTACT_TOPICS = [
  "collaboration",
  "writing",
  "speaking",
  "question",
  "other",
] as const;

const email = z
  .string()
  .trim()
  .min(1, "Add your email so I can reply.")
  .email("That email doesn't look complete — check it and try again.")
  .max(254, "That email is too long.");

/** The honeypot: humans never see it, so a value means a bot. */
const honeypot = z
  .string()
  .max(0, "Something went wrong. Try again.")
  .optional()
  .or(z.literal(""));

export const subscribeSchema = z.object({
  email,
  /** 'home' | 'post:slug' | 'newsletter-page' | 'footer' (§5.2 source). */
  source: z
    .string()
    .trim()
    .regex(/^[a-z0-9:/-]{1,80}$/i, "Invalid source.")
    .default("newsletter-page"),
  website: honeypot,
  turnstileToken: z.string().optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Add your name — 2 characters minimum.")
    .max(80, "That name is too long — 80 characters maximum."),
  email,
  topic: z.enum(CONTACT_TOPICS, {
    error: "Pick what this is about.",
  }),
  subject: z.string().trim().max(140, "Keep the subject under 140 characters.").optional(),
  message: z
    .string()
    .trim()
    .min(20, "Your message needs a bit more detail — 20 characters minimum.")
    .max(5000, "That's over the 5000 character limit — link to a doc instead."),
  website: honeypot,
  turnstileToken: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Flatten Zod issues into {field: firstMessage} for aria-describedby wiring. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
