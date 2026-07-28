/**
 * SPEC §5.11 — Sanity environment. Public values only; tokens never pass
 * through here.
 *
 * The placeholder fallback keeps builds and the type pipeline working before
 * a real project id is configured. Anything that actually talks to the API
 * will fail loudly with it, which is the correct behaviour.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "placeholder";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "development";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-10-01";
export const studioBasePath = "/studio";
