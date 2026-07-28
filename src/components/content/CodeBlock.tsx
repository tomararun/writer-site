export type CodeBlockValue = {
  language?: string | null;
  filename?: string | null;
  code?: string | null;
  highlightLines?: number[] | null;
  caption?: string | null;
};

/**
 * SPEC §3.2 — the code listing. Phase 1 renders clean semantic markup;
 * Phase 2 adds syntax highlighting, the copy button and line highlights on
 * top of this structure without changing it.
 */
export function CodeBlock({ value }: { value: CodeBlockValue }) {
  if (!value.code) return null;

  return (
    <figure data-language={value.language ?? undefined}>
      {value.filename ? (
        <figcaption className="!mt-0 mb-2">
          <code className="!border-0 !bg-transparent !p-0">{value.filename}</code>
        </figcaption>
      ) : null}
      <pre tabIndex={0}>
        <code>{value.code}</code>
      </pre>
      {value.caption ? <figcaption>{value.caption}</figcaption> : null}
    </figure>
  );
}
