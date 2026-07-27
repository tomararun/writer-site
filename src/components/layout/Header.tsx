import Link from "next/link";
import { Nav } from "./Nav";
import { ThemeToggle } from "./ThemeToggle";
import { SearchTrigger } from "./SearchTrigger";
import { site } from "@/site.config";

/**
 * SPEC §6.0 — sticky, 56px, paper at 92% with an 8px backdrop blur, single
 * hairline bottom border. Name in the display face at 16/600 — NOT a logo mark.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] backdrop-blur-[8px]">
      <div className="mx-auto flex h-14 w-full max-w-[var(--width-container)] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="font-display text-[var(--text-sm)] font-semibold tracking-[-0.01em] no-underline"
        >
          {site.name}
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Nav scrolls horizontally on narrow screens rather than collapsing into
              a hamburger: five short labels fit, and a visible nav teaches the site. */}
          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Nav />
          </div>
          <div className="flex items-center gap-1 border-l border-rule pl-2 sm:pl-3">
            <SearchTrigger />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
