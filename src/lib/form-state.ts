/**
 * SPEC §6.11/§6.12 — the one state shape every form action returns, driving
 * idle / loading / success / field-error / rate-limited / server-error UI.
 * (Loading is the client's `useActionState` pending flag, not a state here.)
 */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idleFormState: FormState = { status: "idle" };
