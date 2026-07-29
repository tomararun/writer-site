import { draftMode } from "next/headers";

/**
 * SPEC §5.5 — the preview banner: "Preview — not published" + Exit. Rendered
 * by the root layout; visible only while draft mode is on, on every page, so
 * a preview session can never be mistaken for the live site.
 */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-accent bg-accent px-5 py-2 text-paper">
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)]">
        Preview — not published
      </p>
      <a
        href="/api/preview/disable"
        className="font-display text-[var(--text-xs)] font-semibold text-paper underline"
      >
        Exit preview
      </a>
    </div>
  );
}
