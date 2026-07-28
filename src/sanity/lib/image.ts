import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import type { ImageLoader } from "next/image";
import { dataset, projectId } from "../env";

/**
 * SPEC §5.6 — images are served by the Sanity CDN with transform params;
 * Next.js must NOT re-optimise them (that would double-process every image
 * through Vercel's optimiser).
 */

const builder = createImageUrlBuilder({ projectId, dataset });

/** URL builder for places that need a concrete URL (OG images, plain <img>). */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}

/**
 * §5.6 — the custom `next/image` loader: maps width/quality onto Sanity CDN
 * params. Passed via the `loader` prop by `SanityImage`.
 */
export const sanityImageLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "max");
  return url.toString();
};

/**
 * §5.6 — art direction: `figure.layout` drives the `sizes` attribute so the
 * browser downloads the width the layout will actually render.
 */
export const SIZES_BY_LAYOUT = {
  inline: "(min-width: 1024px) 66ch, 100vw",
  wide: "(min-width: 1024px) 1080px, 100vw",
  full: "100vw",
  side: "(min-width: 1024px) 256px, 100vw",
} as const;

export type FigureLayout = keyof typeof SIZES_BY_LAYOUT;
