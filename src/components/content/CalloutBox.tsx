import { PortableText } from "next-sanity";
import type { PortableTextBlock } from "next-sanity";
import { cn } from "@/lib/cn";

export type CalloutBoxValue = {
  variant?: string | null;
  title?: string | null;
  body?: PortableTextBlock[] | null;
};

const VARIANT_LABEL: Record<string, string> = {
  note: "Note",
  warning: "Warning",
  aside: "Aside",
  update: "Update",
};

/**
 * SPEC §3.2 — the callout box. Border-led, no fills louder than the surface
 * token; the variant is announced in mono, not by colour alone.
 */
export function CalloutBox({ value }: { value: CalloutBoxValue }) {
  const variant = value.variant && VARIANT_LABEL[value.variant] ? value.variant : "note";

  return (
    <aside
      data-variant={variant}
      className={cn(
        "my-8 border border-rule bg-surface p-5",
        variant === "warning" && "border-ink",
        variant === "update" && "border-accent",
      )}
    >
      <p className="font-mono text-[var(--text-2xs)] font-medium uppercase tracking-[var(--tracking-mono)] text-ink-muted">
        {VARIANT_LABEL[variant]}
        {value.title ? (
          <span className="ml-2 normal-case tracking-normal text-ink">{value.title}</span>
        ) : null}
      </p>
      {value.body ? (
        <div className="mt-3 text-[var(--text-sm)] leading-relaxed [&_p+p]:mt-3">
          <PortableText value={value.body} />
        </div>
      ) : null}
    </aside>
  );
}
