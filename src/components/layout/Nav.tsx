"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/site.config";
import { cn } from "@/lib/cn";

/**
 * SPEC §6.0 — "The active section's label carries a 2px highlighter underline."
 *
 * Highlighter appearance #3 of 5. Matching is prefix-based so that
 * /writing/some-post still marks "Writing" as current.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      <ul className="flex items-center gap-4 sm:gap-5">
        {site.nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-block py-1 font-display text-[var(--text-xs)] font-medium no-underline transition-colors",
                  active ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {item.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-highlight"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
