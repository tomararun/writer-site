"use client";

import { useActionState, useId } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { idleFormState } from "@/lib/form-state";
import { cn } from "@/lib/cn";
import { TurnstileWidget } from "./TurnstileWidget";

/**
 * SPEC §6.12 — the subscribe form, three variants of one component differing
 * only in density: `footer` (single row), `inline` (after an article, with
 * its contextual line), `block` (home / newsletter page). Every instance
 * passes a `source` so conversion is measurable per placement (§5.7), and
 * ids derive from it so three instances on one page never collide.
 *
 * States: idle → loading (pending) → success / field error / rate-limited /
 * server error, all from the server action's FormState. Status messages are
 * aria-live polite; errors are role=alert. The submit button is never
 * disabled without explanation — while pending it says "Subscribing…".
 */
export function SubscribeForm({
  source,
  variant = "block",
}: {
  /** 'home' | 'post:slug' | 'newsletter-page' | 'footer' */
  source: string;
  variant?: "footer" | "inline" | "block";
}) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, idleFormState);
  const uid = useId();
  const emailId = `subscribe-email-${source}-${uid}`;
  const statusId = `subscribe-status-${source}-${uid}`;

  if (state.status === "success") {
    return (
      <p role="status" className="text-[var(--text-sm)] font-medium text-ink">
        {state.message}
      </p>
    );
  }

  const emailError = state.fieldErrors?.email;

  return (
    <form action={formAction} noValidate>
      {variant === "inline" ? (
        <p className="mb-3 text-[var(--text-sm)] text-ink-muted">
          If you got this far, you&rsquo;ll probably like the newsletter.
        </p>
      ) : null}

      <div
        className={cn(
          "flex gap-2",
          variant === "footer" ? "flex-row max-sm:flex-col" : "max-sm:flex-col",
        )}
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor={emailId}
            className={cn(
              variant === "footer"
                ? "sr-only"
                : "mb-1 block font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted",
            )}
          >
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? statusId : undefined}
            className={cn(
              "w-full min-h-11 rounded-[var(--radius-xs)] border bg-paper px-3 text-ink",
              emailError ? "border-ink" : "border-rule",
            )}
          />
        </div>
        <button
          type="submit"
          className="min-h-11 shrink-0 bg-ink px-5 font-display text-[var(--text-sm)] font-semibold text-paper transition-colors hover:bg-accent max-sm:w-full"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>

      {/* Honeypot — humans never see it; anything typed here marks a bot. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor={`website-${uid}`}>Leave this field empty</label>
        <input
          id={`website-${uid}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="source" value={source} />
      <TurnstileWidget />

      <p
        id={statusId}
        aria-live="polite"
        role={state.status === "error" ? "alert" : undefined}
        className={cn(
          "mt-2 text-[var(--text-xs)]",
          state.status === "error" ? "text-ink" : "text-ink-muted",
        )}
      >
        {state.status === "error"
          ? (emailError ?? state.message)
          : variant !== "footer"
            ? "Double opt-in — you'll get a confirmation email. One click to unsubscribe, forever. I never share the list."
            : null}
      </p>
    </form>
  );
}
