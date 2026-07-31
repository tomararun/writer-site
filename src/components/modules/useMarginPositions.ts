"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Shared measurement for the margin track (§4.5): given reference element
 * ids in the article, compute absolute `top` offsets inside the margin
 * container so each margin item sits at its reference's height. Items that
 * would overlap are pushed down with a gap. Re-measures when the article
 * resizes (fonts, viewport).
 *
 * Used by FootnoteMargin (Phase 2) and ArtifactsMargin (§6.6 process
 * artefacts).
 */
export function useMarginPositions(
  containerRef: RefObject<HTMLElement | null>,
  refIds: string[],
  gap = 16,
): number[] | null {
  const [tops, setTops] = useState<number[] | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || refIds.length === 0) return;

    function measure() {
      if (!container) return;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const items = Array.from(container.children) as HTMLElement[];
      const next: number[] = [];
      let floor = 0;
      refIds.forEach((refId, i) => {
        const ref = document.getElementById(refId);
        const item = items[i];
        if (!ref || !item) {
          next.push(floor);
          return;
        }
        const wanted = ref.getBoundingClientRect().top + window.scrollY - containerTop;
        const top = Math.max(wanted, floor);
        next.push(top);
        floor = top + item.offsetHeight + gap;
      });
      setTops(next);
    }

    measure();
    const article = document.querySelector("article");
    const observer = new ResizeObserver(measure);
    if (article) observer.observe(article);
    return () => observer.disconnect();
  }, [containerRef, refIds, gap]);

  return tops;
}
