import { defineField, defineType } from "sanity";

/**
 * SPEC §3.3 — `post.body` allows an `embed`. Rendered as a link card, not an
 * iframe: no third-party JavaScript lands on a reading page (§1.8).
 */
export const embed = defineType({
  name: "embed",
  title: "Embed",
  type: "object",
  fields: [
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      description:
        "The address of the thing — a video, a tweet, a demo. Rendered as a link card.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "What the reader will see as the card's heading.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "One line of context — why you're pointing at it.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
  },
});
