import { defineField, defineType } from "sanity";

/**
 * SPEC §3.3 — one learning in a case study, grouped by sentiment: what
 * worked, what didn't, what you'd change. The honest section.
 */
export const learning = defineType({
  name: "learning",
  title: "Learning",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The learning as a single sentence you'd say out loud.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 4,
      description: "The evidence: what happened that taught you this.",
    }),
    defineField({
      name: "sentiment",
      title: "Sentiment",
      type: "string",
      options: {
        list: [
          { title: "Worked", value: "worked" },
          { title: "Didn't work", value: "didntWork" },
          { title: "Would change", value: "wouldChange" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "sentiment" },
  },
});
