import type { Metadata, Viewport } from "next";
import { metadata as studioMetadata } from "next-sanity/studio";
import { Studio } from "./studio";

/**
 * SPEC §4.3 — /studio: client-only, noindex. The catch-all segment lets the
 * Studio own its sub-routes (structure, vision) client-side.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  ...studioMetadata,
  title: "Studio",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function StudioPage() {
  return <Studio />;
}
