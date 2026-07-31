"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * SPEC §5.7 — the small client trackers. Each is a render-nothing component
 * a server page can drop in; all are inert without Plausible.
 */

/** scroll_depth at 25/50/75/100, each fired once per page view. */
export function ScrollDepthTracker() {
  const fired = useRef(new Set<number>());

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        if (total <= 0) return;
        const percent = (window.scrollY / total) * 100;
        for (const threshold of [25, 50, 75, 100]) {
          if (percent >= threshold && !fired.current.has(threshold)) {
            fired.current.add(threshold);
            track("scroll_depth", { depth: threshold });
          }
        }
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/** case_study_section_view when the Outcomes section becomes visible (G3). */
export function SectionViewTracker({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track("case_study_section_view", { section: sectionId });
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [sectionId]);

  return null;
}

/** outbound_click on any external link, via one delegated listener. */
export function OutboundClickTracker() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor?.href) return;
      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin && url.protocol.startsWith("http")) {
          track("outbound_click", { url: url.hostname });
        }
      } catch {
        /* not a parseable URL */
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}

/**
 * §5.7 view counting (behind the flag): one fire-and-forget ping per page
 * view; failure is silent by design.
 */
export function ViewPing({ path }: { path: string }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_VIEW_COUNTS !== "true") return;
    fetch(`/api/views${path}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [path]);

  return null;
}
