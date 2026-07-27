"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * SPEC §6.0 — the ⌘K entry point.
 *
 * Phase 0 scope: the keyboard shortcut and the button are real, and both navigate
 * to /search. The command palette dialog itself is Phase 6 (P7), because it needs
 * the search API to exist. Wiring the affordance now means the shortcut is
 * discoverable from day one and Phase 6 only swaps the handler.
 */
export function SearchTrigger() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isShortcut) return;
      event.preventDefault();
      router.push("/search");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.push("/search")}
      aria-label="Search"
      className="inline-flex size-9 items-center justify-center rounded-[var(--radius-xs)] text-ink-muted transition-colors hover:text-ink"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="7" cy="7" r="4.25" />
        <path d="M10.2 10.2 14 14" strokeLinecap="round" />
      </svg>
    </button>
  );
}
