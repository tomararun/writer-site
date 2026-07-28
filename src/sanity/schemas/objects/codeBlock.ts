import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — a code listing. Rendered with a copy button and optional line
 * highlights (Phase 2).
 */
export const codeBlock = defineType({
  name: "codeBlock",
  title: "Code block",
  type: "object",
  fields: [
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      description: "Drives syntax colouring.",
      options: {
        list: [
          "typescript",
          "tsx",
          "javascript",
          "jsx",
          "css",
          "html",
          "json",
          "bash",
          "sql",
          "python",
          "groq",
          "text",
        ],
      },
      initialValue: "typescript",
    }),
    defineField({
      name: "filename",
      title: "Filename",
      type: "string",
      description:
        'Shown above the block — "src/lib/related.ts". Optional but helpful in tutorials.',
    }),
    defineField({
      name: "code",
      title: "Code",
      type: "text",
      rows: 12,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "highlightLines",
      title: "Highlighted lines",
      type: "array",
      of: [{ type: "number" }],
      description: "Line numbers to emphasise — the lines the surrounding prose talks about.",
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "One line under the block, if it needs explaining.",
    }),
  ],
  preview: {
    select: { title: "filename", subtitle: "language" },
    prepare({ title, subtitle }) {
      return { title: title || "Code block", subtitle };
    },
  },
});
