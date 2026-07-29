import { SIZES_BY_LAYOUT, type FigureLayout } from "@/sanity/lib/image";

/**
 * SPEC §5.6 — the one way an asset becomes a rendered image:
 * - Sanity CDN transforms (w, q, auto=format, fit=max) via a server-built
 *   srcset — Next never re-optimises, and no image runtime ships to the client
 * - width/height from asset metadata → zero CLS
 * - LQIP base64 painted as a background until the real image arrives
 * - `sizes` from the figure's layout
 *
 * Server component by design: the Phase 0 corrected JS budget (≤ 115 KB on
 * the article route) has no room for the next/image client runtime, and a
 * static <img srcset> delivers the same bytes to the same screens.
 */

export type SanityImageAsset = {
  url?: string | null;
  dimensions?: { width?: number | null; height?: number | null } | null;
  lqip?: string | null;
};

const SRCSET_WIDTHS = [320, 640, 960, 1280, 1600, 2160];

function transformed(url: string, width: number): string {
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", "75");
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "max");
  return u.toString();
}

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

  const widths = SRCSET_WIDTHS.filter((w) => w <= width);
  if (widths.length === 0) widths.push(width);
  const srcSet = widths.map((w) => `${transformed(url, w)} ${w}w`).join(", ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- deliberate: see component doc.
    <img
      src={transformed(url, widths[widths.length - 1] ?? width)}
      srcSet={srcSet}
      sizes={SIZES_BY_LAYOUT[layout]}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
      style={
        asset?.lqip
          ? { backgroundImage: `url(${asset.lqip})`, backgroundSize: "cover" }
          : undefined
      }
    />
  );
}
