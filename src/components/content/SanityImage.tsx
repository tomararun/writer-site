"use client";

import Image from "next/image";
import { sanityImageLoader, SIZES_BY_LAYOUT, type FigureLayout } from "@/sanity/lib/image";

/**
 * SPEC §5.6 — the one way an asset becomes a rendered image:
 * - Sanity CDN via the custom loader (Next never re-optimises)
 * - width/height from asset metadata → zero CLS
 * - LQIP base64 → blur placeholder
 * - `sizes` from the figure's layout
 *
 * Client component only because `next/image` needs the loader function as a
 * prop; it renders no interactive behaviour.
 */

export type SanityImageAsset = {
  url?: string | null;
  dimensions?: { width?: number | null; height?: number | null } | null;
  lqip?: string | null;
};

export function SanityImage({
  asset,
  alt,
  layout = "inline",
  priority = false,
  className,
}: {
  asset: SanityImageAsset | null | undefined;
  alt: string;
  layout?: FigureLayout;
  priority?: boolean;
  className?: string;
}) {
  const url = asset?.url;
  const width = asset?.dimensions?.width;
  const height = asset?.dimensions?.height;
  if (!url || !width || !height) return null;

  return (
    <Image
      loader={sanityImageLoader}
      src={url}
      alt={alt}
      width={width}
      height={height}
      sizes={SIZES_BY_LAYOUT[layout]}
      priority={priority}
      placeholder={asset?.lqip ? "blur" : "empty"}
      blurDataURL={asset?.lqip ?? undefined}
      className={className}
    />
  );
}
