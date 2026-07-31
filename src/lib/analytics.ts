"use client";

/**
 * SPEC §5.7 — Plausible custom events, cookieless (a feature to protect).
 * `track` is a no-op until the Plausible script is configured and loaded,
 * so call sites never need to know whether analytics exist.
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function track(event: string, props?: Record<string, string | number>): void {
  if (typeof window === "undefined" || !window.plausible) return;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break the page.
  }
}
