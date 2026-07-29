import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "../env";

/**
 * SPEC §5.6 — images are served by the Sanity CDN with transform params;
 * Next.js must NOT re-optimise them (that would double-process every image
 * through Vercel's optimiser). `SanityImage` builds a server-rendered
 * <img srcset> from these params directly — see its doc for why it doesn't
 * go through next/image (the client runtime doesn't fit the JS budget).
 */

const builder = createImageUrlBuilder({ projectId, dataset });

/** URL builder for places that need a concrete URL (OG images, JSON-LD). */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}

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
