import { PortableText } from "next-sanity";
import type { PortableTextBlock } from "next-sanity";
import { Figure, type FigureValue } from "./Figure";

export type ProcessStepValue = {
  phase?: string | null;
  title?: string | null;
  body?: PortableTextBlock[] | null;
  artifacts?: FigureValue[] | null;
  duration?: string | null;
};

/**
 * SPEC §3.2 — one step of a case study's process. The step number comes from
 * the parent (the ordering is meaningful, §3.3); Phase 4's template moves the
 * artifacts into the margin track.
 */
export function ProcessStep({ value, index }: { value: ProcessStepValue; index: number }) {
  return (
    <li className="border-t border-rule pt-6">
      <p className="font-mono text-[var(--text-2xs)] uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        <span aria-hidden="true">{String(index).padStart(2, "0")} · </span>
        {value.phase}
        {value.duration ? <span> · {value.duration}</span> : null}
      </p>
      <h3 className="mt-2 font-display text-[var(--text-lg)] font-semibold">{value.title}</h3>
      {value.body ? (
        <div className="mt-3 text-[var(--text-base)] leading-relaxed [&_p+p]:mt-3">
          <PortableText value={value.body} />
        </div>
      ) : null}
      {value.artifacts?.length ? (
        <div className="mt-4 space-y-4">
          {value.artifacts.map((artifact, i) => (
            <Figure key={i} value={artifact} />
          ))}
        </div>
      ) : null}
    </li>
  );
}
