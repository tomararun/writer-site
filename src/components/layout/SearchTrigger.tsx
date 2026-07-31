"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * SPEC §6.0 / §6.13 — the ⌘K (and "/") entry point, now opening the command
 * palette. The palette itself (Radix Dialog + search UI) is loaded on first
 * open, so the reading page's JS budget never carries it.
 */

const CommandPalette = dynamic(() => import("@/components/modules/CommandPalette"), {
  ssr: false,
});

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function show() {
    setLoaded(true);
    setOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const target = event.target as HTMLElement | null;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      const isSlash = event.key === "/" && !inField && !event.metaKey && !event.ctrlKey;
      if (!isCommandK && !isSlash) return;
      event.preventDefault();
      show();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search"
        aria-haspopup="dialog"
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
      {loaded ? <CommandPalette open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
