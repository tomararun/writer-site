"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * SPEC P4 — "Load more" appends and moves focus to the first new item,
 * announcing how many loaded. Real ?page=n links exist behind it for
 * crawlers — this IS an anchor; pages are cumulative server-side (?page=2
 * renders items 1..24), so following the link appends for humans and
 * paginates for robots.
 *
 * This component survives the soft navigation (same tree position), so it
 * can remember that the click came from here and only then steal focus —
 * landing directly on ?page=2 never moves focus.
 */
export function LoadMore({
  loadedCount,
  total,
  pageSize,
  nextPage,
  itemIdPrefix,
  noun,
}: {
  loadedCount: number;
  total: number;
  pageSize: number;
  nextPage: number;
  /** Items carry ids `${itemIdPrefix}-<1-based index>`. */
  itemIdPrefix: string;
  noun: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pendingFocusId = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!pendingFocusId.current) return;
    const target = document.getElementById(pendingFocusId.current);
    pendingFocusId.current = null;
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }, [loadedCount]);

  if (loadedCount >= total) {
    return announcement ? (
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    ) : null;
  }

  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(nextPage));
  const remaining = Math.min(pageSize, total - loadedCount);

  return (
    <div className="mt-8 flex justify-center">
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Link
        href={`${pathname}?${params.toString()}`}
        scroll={false}
        onClick={() => {
          pendingFocusId.current = `${itemIdPrefix}-${loadedCount + 1}`;
          setAnnouncement(`${remaining} more ${noun} loaded`);
        }}
        className="inline-flex min-h-11 items-center justify-center border border-ink px-6 font-display text-[var(--text-sm)] font-semibold text-ink no-underline transition-colors hover:border-accent hover:text-accent"
      >
        Load more
      </Link>
    </div>
  );
}
