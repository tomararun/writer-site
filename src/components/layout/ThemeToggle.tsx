"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme-script";

/**
 * SPEC §9.1 — "the dark-mode preference survives navigation".
 *
 * The inline script in <head> has already applied the stored theme before paint,
 * so this component's only job is to reflect and change it. It renders a stable
 * label on the server and syncs on mount to avoid a hydration mismatch.
 */
function resolveCurrentTheme(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(resolveCurrentTheme());
  }, []);

  function toggle() {
    const next: Theme = (theme ?? resolveCurrentTheme()) === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse writes. The toggle still works for this session.
    }
    setTheme(next);
  }

  // Before mount we don't know the theme, so describe the control by what it does
  // rather than by a state we can't yet read.
  const label =
    theme === null ? "Switch theme" : theme === "dark" ? "Use light theme" : "Use dark theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-[var(--radius-xs)] text-ink-muted transition-colors hover:text-ink"
    >
      <span aria-hidden="true" className="font-mono text-[var(--text-xs)] leading-none">
        {theme === "dark" ? "☾" : "☀"}
      </span>
    </button>
  );
}
