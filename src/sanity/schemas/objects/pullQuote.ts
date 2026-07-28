import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — a sentence lifted out of the text and set large. With
 * `emphasis` on, it renders with the highlighter wash — use that at most once
 * per piece.
 */
export const pullQuote = defineType({
  name: "pullQuote",
  title: "Pull quote",
  type: "object",
  fields: [
    defineField({
      name: "text",
      title: "Text",
      type: "text",
      rows: 3,
      description:
        "The sentence to pull out. Keep it under ~140 characters or it stops being a pull quote.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "attribution",
      title: "Attribution",
      type: "string",
      description: "Only if the words are someone else's.",
    }),
    defineField({
      name: "emphasis",
      title: "Highlight it",
      type: "boolean",
      description:
        "Renders with the highlighter wash. The site allows itself very few of these — one per piece, at most.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "text", subtitle: "attribution" },
    prepare({ title, subtitle }) {
      return { title: `“${title ?? ""}”`, subtitle };
    },
  },
});
