"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SPEC §6.4 — "Share: Copy link / X / Bluesky / LinkedIn / Email", zero
 * third-party scripts: the networks are plain intent links, copy uses the
 * clipboard API, and the copied state announces itself and reverts after 2s.
 */
export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const targets = [
    { label: "X", href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}` },
    {
      label: "Bluesky",
      href: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    { label: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];

  const itemClass =
    "font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted no-underline transition-colors hover:text-ink";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        Share:
      </span>
      <button type="button" onClick={copy} className={itemClass}>
        <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
      </button>
      {targets.map((target) => (
        <a
          key={target.label}
          href={target.href}
          className={itemClass}
          {...(target.href.startsWith("http") ? { rel: "noopener", target: "_blank" } : {})}
        >
          {target.label}
          {target.href.startsWith("http") ? (
            <span className="sr-only"> (opens in a new tab)</span>
          ) : null}
        </a>
      ))}
    </div>
  );
}
