"use client";

import { useRef } from "react";
import { useMarginPositions } from "./useMarginPositions";

/**
 * SPEC §6.6 — "Process steps use the margin track for artefacts." Each
 * step's artefact figures (server-rendered children) are positioned at the
 * step's vertical offset, same mechanism as the article's margin footnotes.
 * Below lg the margin doesn't exist and the inline copies show instead.
 */
export function ArtifactsMargin({
  stepIds,
  children,
}: {
  /** One entry per step WITH artefacts: the step <li> id to align against. */
  stepIds: string[];
  children: React.ReactNode[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tops = useMarginPositions(containerRef, stepIds);

  if (stepIds.length === 0) return null;

  return (
    <div ref={containerRef} className="relative h-full">
      {stepIds.map((stepId, i) => (
        <div
          key={stepId}
          className="left-0 right-0"
          style={
            tops
              ? { position: "absolute", top: tops[i] }
              : { position: "relative", marginTop: i === 0 ? 0 : 16 }
          }
        >
          {children[i]}
        </div>
      ))}
    </div>
  );
}
