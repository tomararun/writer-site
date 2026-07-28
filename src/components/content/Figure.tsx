import { SanityImage, type SanityImageAsset } from "./SanityImage";
import type { FigureLayout } from "@/sanity/lib/image";
import { cn } from "@/lib/cn";

export type FigureValue = {
  alt?: string | null;
  decorative?: boolean | null;
  caption?: string | null;
  credit?: string | null;
  layout?: string | null;
  asset?: SanityImageAsset | null;
};

const LAYOUT_CLASSES: Record<FigureLayout, string> = {
  inline: "",
  // Phase 2 gives wide/full real breakout styles on the article grid;
  // until then they degrade to the prose measure without overflowing.
  wide: "lg:-mx-12",
  full: "lg:-mx-12",
  side: "lg:float-right lg:ml-6 lg:w-64",
};

function resolveLayout(layout: string | null | undefined): FigureLayout {
  if (layout === "wide" || layout === "full" || layout === "side") return layout;
  return "inline";
}

/**
 * SPEC §3.2 — the figure renderer. §5.6: the renderer throws in dev if alt is
 * missing on a non-decorative image, so the mistake is caught at author time.
 */
export function Figure({ value }: { value: FigureValue }) {
  const layout = resolveLayout(value.layout);
  const alt = value.decorative ? "" : (value.alt ?? "");

  if (!value.decorative && !value.alt && process.env.NODE_ENV === "development") {
    throw new Error(
      "Figure is missing alt text. Add alt in the Studio or mark the image decorative.",
    );
  }

  if (!value.asset?.url) return null;

  return (
    <figure className={cn(LAYOUT_CLASSES[layout])}>
      <SanityImage asset={value.asset} alt={alt} layout={layout} />
      {value.caption || value.credit ? (
        <figcaption>
          {value.caption}
          {value.credit ? <span className="credit">{value.credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
