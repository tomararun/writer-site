import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — a footnote anchored inside a sentence. On wide screens it
 * renders in the margin at the height of its reference (Phase 2); below
 * 1024px it renders as an inline disclosure.
 *
 * It is an INLINE object — it lives inside a paragraph, at the exact point
 * the note refers to, not between paragraphs.
 */
export const footnote = defineType({
  name: "footnote",
  title: "Footnote",
  type: "object",
  fields: [
    defineField({
      name: "id",
      title: "Anchor id",
      type: "string",
      description:
        'Optional stable id for deep links (e.g. "fn-caching"). Leave empty and one is derived automatically.',
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true;
          if (/^[a-z0-9-]+$/.test(value)) return true;
          return "Use lowercase letters, numbers and hyphens only.";
        }),
    }),
    defineField({
      name: "body",
      title: "Note",
      type: "simpleText",
      description:
        "The note itself. A sentence or two — if it grows past that, it belongs in the text.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { blocks: "body" },
    prepare({ blocks }) {
      const firstBlock = Array.isArray(blocks)
        ? (blocks as { children?: { text?: string }[] }[]).find((b) => b.children)
        : undefined;
      const text = firstBlock?.children?.map((c) => c.text ?? "").join("") ?? "";
      return { title: text || "Footnote" };
    },
  },
});
