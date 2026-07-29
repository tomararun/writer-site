import { highlightCode } from "@/lib/shiki";
import { CopyButton } from "./CopyButton";

export type CodeBlockValue = {
  language?: string | null;
  filename?: string | null;
  code?: string | null;
  highlightLines?: number[] | null;
  caption?: string | null;
};

/**
 * SPEC §6.4 — the code listing: filename tab, copy button with live
 * announcement, focusable keyboard-scrollable <pre>, build-time shiki
 * colouring via CSS-variable tokens, and highlighted lines for the lines the
 * prose talks about.
 *
 * Async server component — the highlighter never ships to the client.
 */
export async function CodeBlock({ value }: { value: CodeBlockValue }) {
  if (!value.code) return null;

  const label = `Code sample${value.filename ? `: ${value.filename}` : ""}`;
  const html = await highlightCode(value.code, value.language, {
    highlightLines: value.highlightLines,
    label,
  });

  return (
    <figure className="code-block" data-language={value.language ?? undefined}>
      <div className="flex min-h-8 items-center justify-between gap-4 border border-b-0 border-rule bg-surface px-4 py-1.5">
        <span className="font-mono text-[var(--text-2xs)] text-ink-muted">
          {value.filename ?? value.language ?? "code"}
        </span>
        <CopyButton text={value.code} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {value.caption ? <figcaption>{value.caption}</figcaption> : null}
    </figure>
  );
}
