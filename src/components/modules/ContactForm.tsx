"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { sendContactMessage } from "@/app/actions/contact";
import { track } from "@/lib/analytics";
import { idleFormState } from "@/lib/form-state";
import { cn } from "@/lib/cn";
import { TurnstileWidget } from "./TurnstileWidget";

/**
 * SPEC §6.11 — the contact form. Every field keeps a visible label; errors
 * bind via aria-describedby + aria-invalid, are summarised in a role="alert"
 * region at the top, and focus moves to the first invalid field after a
 * failed submit. Without JavaScript the form still posts — it's a server
 * action on a plain <form>.
 */

const TOPIC_OPTIONS = [
  { value: "collaboration", label: "Collaboration" },
  { value: "writing", label: "Writing" },
  { value: "speaking", label: "Speaking" },
  { value: "question", label: "A question" },
  { value: "other", label: "Something else" },
] as const;

const FIELD_ORDER = ["name", "email", "topic", "message"] as const;

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, idleFormState);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const id = (field: string) => `contact-${field}-${uid}`;
  const errorId = (field: string) => `contact-${field}-error-${uid}`;
  const errors = state.fieldErrors ?? {};

  /* §5.7 G4. */
  useEffect(() => {
    if (state.status === "success") track("contact_submitted");
  }, [state.status]);

  /* Focus the first invalid field after a failed submit (§6.11 a11y). */
  useEffect(() => {
    if (state.status !== "error" || !state.fieldErrors || !formRef.current) return;
    const first = FIELD_ORDER.find((field) => field in state.fieldErrors!);
    if (first) {
      formRef.current.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <p role="status" className="border border-rule bg-surface p-5 text-[var(--text-md)]">
        {state.message}
      </p>
    );
  }

  const labelClass =
    "mb-1 block font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted";
  const inputClass = (field: string) =>
    cn(
      "w-full min-h-11 rounded-[var(--radius-xs)] border bg-paper px-3 py-2 text-ink",
      errors[field] ? "border-ink" : "border-rule",
    );
  const errorTextClass = "mt-1 text-[var(--text-xs)] text-ink";

  return (
    <form ref={formRef} action={formAction} noValidate>
      {state.status === "error" ? (
        <div
          role="alert"
          className="mb-6 border border-ink bg-surface p-4 text-[var(--text-sm)]"
        >
          {state.message}
          {state.fieldErrors ? (
            <ul className="mt-2 list-inside list-disc text-[var(--text-xs)] text-ink-muted">
              {FIELD_ORDER.filter((field) => errors[field]).map((field) => (
                <li key={field}>{errors[field]}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-5">
        <div>
          <label htmlFor={id("name")} className={labelClass}>
            Your name
          </label>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            className={inputClass("name")}
          />
          {errors.name ? (
            <p id={errorId("name")} className={errorTextClass}>
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={id("email")} className={labelClass}>
            Email
          </label>
          <input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? errorId("email") : undefined}
            className={inputClass("email")}
          />
          {errors.email ? (
            <p id={errorId("email")} className={errorTextClass}>
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={id("topic")} className={labelClass}>
            What&rsquo;s this about?
          </label>
          <select
            id={id("topic")}
            name="topic"
            required
            defaultValue="collaboration"
            aria-invalid={errors.topic ? true : undefined}
            aria-describedby={errors.topic ? errorId("topic") : undefined}
            className={inputClass("topic")}
          >
            {TOPIC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.topic ? (
            <p id={errorId("topic")} className={errorTextClass}>
              {errors.topic}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor={id("message")} className={labelClass}>
            Message
          </label>
          <textarea
            id={id("message")}
            name="message"
            rows={7}
            required
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={
              [errors.message ? errorId("message") : null, id("message-help")]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={inputClass("message")}
          />
          <p id={id("message-help")} className="mt-1 text-[var(--text-xs)] text-ink-muted">
            Detail helps. What are you building, and what&rsquo;s the deadline?
          </p>
          {errors.message ? (
            <p id={errorId("message")} className={errorTextClass}>
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      {/* Honeypot */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor={id("website")}>Leave this field empty</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <TurnstileWidget />

      <button
        type="submit"
        className="mt-6 min-h-11 bg-ink px-6 font-display text-[var(--text-sm)] font-semibold text-paper transition-colors hover:bg-accent max-sm:w-full"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
