import { useDocumentOperation, type DocumentActionComponent } from "sanity";
import type { SanityDocument } from "sanity";
import { countWordsInPortableText, extractHeadings, toPlainText } from "@/lib/portable-text";
import { readingTime } from "@/lib/reading-time";

/**
 * SPEC §3.5 + §5.5 — "Publish action runs computeDerivedFields (reading time,
 * word count, plain text, headings), then Sanity publishes."
 *
 * Implemented as a wrapper around the default Publish action: it patches the
 * derived fields into the draft, then delegates to the original handler. The
 * patch and the publish run through the same operation queue, so the
 * published document always carries fresh derived values.
 */

/** The prose a reader actually reads, per type — what the derived fields measure. */
function bodySourcesFor(doc: SanityDocument): unknown[] {
  switch (doc._type) {
    case "caseStudy":
      return [
        doc.background,
        doc.problem,
        ...(Array.isArray(doc.process)
          ? (doc.process as { body?: unknown }[]).map((step) => step.body)
          : []),
        doc.implementation,
        doc.outcomes,
      ];
    default:
      return [doc.body];
  }
}

export function computeDerivedFields(doc: SanityDocument): {
  readingTime: number;
  wordCount: number;
  plainText: string;
  headings: ReturnType<typeof extractHeadings>;
} {
  const sources = bodySourcesFor(doc).filter(Array.isArray);
  const combined = sources.flat();
  const plainText = toPlainText(combined);
  const wordCount = countWordsInPortableText(combined);
  return {
    readingTime: readingTime(plainText),
    wordCount,
    plainText,
    // Headings only make sense within one continuous body; for case studies
    // the §6.6 template owns the section nav, so this stays the main flow.
    headings: extractHeadings(combined),
  };
}

export function withComputeDerivedFields(
  OriginalPublish: DocumentActionComponent,
): DocumentActionComponent {
  const PublishWithDerivedFields: DocumentActionComponent = (props) => {
    const { patch } = useDocumentOperation(props.id, props.type);
    const original = OriginalPublish(props);
    if (!original) return original;

    return {
      ...original,
      onHandle: () => {
        const doc = props.draft ?? props.published;
        if (doc) {
          patch.execute([{ set: computeDerivedFields(doc) }], props.published ?? undefined);
        }
        original.onHandle?.();
      },
    };
  };
  return PublishWithDerivedFields;
}
