"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useState } from "react";
import { SanityImage, type SanityImageAsset } from "@/components/content/SanityImage";
import { cn } from "@/lib/cn";

/**
 * SPEC §6.6 — the gallery: masonry at lg (CSS columns), 2-col at md, a
 * swipeable single-column strip at sm. Always captioned.
 *
 * The lightbox is a Radix Dialog: focus trap, focus restore and Esc come
 * from Radix; arrow keys and swipe are handled here; position is announced
 * as "Image 3 of 9" via a polite live region. The close target stays ≥44px.
 */

export type GalleryFigure = {
  alt?: string | null;
  caption?: string | null;
  credit?: string | null;
  asset?: SanityImageAsset | null;
};

export function Gallery({ figures }: { figures: GalleryFigure[] }) {
  const items = figures.filter((figure) => figure.asset?.url);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null ? current : (current + delta + items.length) % items.length,
      );
    },
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, step]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (items.length === 0) return null;
  const current = openIndex !== null ? items[openIndex] : null;

  return (
    <>
      {/* sm: swipeable strip · md: 2-col grid · lg: masonry columns */}
      <ul
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2",
          "md:grid md:grid-cols-2 md:overflow-visible md:pb-0",
          "lg:block lg:columns-2 lg:gap-6 xl:columns-3",
        )}
      >
        {items.map((figure, index) => (
          <li
            key={index}
            className="w-4/5 shrink-0 snap-center md:w-auto lg:mb-6 lg:break-inside-avoid"
          >
            <figure>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Open image: ${figure.alt || figure.caption || `image ${index + 1}`}`}
                className="block w-full cursor-zoom-in"
              >
                <SanityImage
                  asset={figure.asset}
                  alt={figure.alt ?? ""}
                  layout="inline"
                  className="w-full border border-rule"
                />
              </button>
              <figcaption className="mt-2 font-mono text-[var(--text-2xs)] leading-relaxed text-ink-muted">
                {figure.caption ?? figure.alt}
                {figure.credit ? (
                  <span className="block opacity-75">{figure.credit}</span>
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <Dialog.Root
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/80" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 focus:outline-none sm:p-10"
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              const endX = event.changedTouches[0]?.clientX;
              if (touchStartX !== null && endX !== undefined) {
                const delta = endX - touchStartX;
                if (Math.abs(delta) > 48) step(delta < 0 ? 1 : -1);
              }
              setTouchStartX(null);
            }}
          >
            <Dialog.Title className="sr-only">Gallery</Dialog.Title>
            <Dialog.Description className="sr-only">
              Use the arrow keys to move between images; Escape closes.
            </Dialog.Description>

            {current ? (
              <figure className="flex max-h-full min-h-0 w-full max-w-5xl flex-col items-center">
                <SanityImage
                  asset={current.asset}
                  alt={current.alt ?? ""}
                  layout="full"
                  className="min-h-0 w-auto max-w-full border border-rule object-contain"
                />
                <figcaption className="mt-3 max-w-[60ch] text-center font-mono text-[var(--text-2xs)] leading-relaxed text-paper">
                  {current.caption ?? current.alt}
                </figcaption>
              </figure>
            ) : null}

            <p aria-live="polite" className="mt-3 font-mono text-[var(--text-2xs)] text-paper">
              Image {openIndex !== null ? openIndex + 1 : 0} of {items.length}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="inline-flex size-11 items-center justify-center border border-paper/40 font-mono text-paper transition-colors hover:border-paper"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="inline-flex size-11 items-center justify-center border border-paper/40 font-mono text-paper transition-colors hover:border-paper"
              >
                →
              </button>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center border border-paper/40 px-5 font-display text-[var(--text-sm)] font-semibold text-paper transition-colors hover:border-paper"
                >
                  Close
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
