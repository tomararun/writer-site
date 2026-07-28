import { defineField, defineType } from "sanity";

/** SPEC §3.3 — `newsletterIssue`: an archived issue, mirrored on the site. */
export const newsletterIssue = defineType({
  name: "newsletterIssue",
  title: "Newsletter issue",
  type: "document",
  fields: [
    defineField({
      name: "number",
      title: "Issue number",
      type: "number",
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sentAt",
      title: "Sent",
      type: "datetime",
      description: "When the issue went out.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3,
      description: "The opening lines, shown on the archive list.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "bodyText",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "linkedPosts",
      title: "Linked posts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      description: "Posts this issue pointed readers at.",
    }),
    defineField({
      name: "subscriberCountAtSend",
      title: "Subscribers at send",
      type: "number",
      description: "For your own records; never shown publicly.",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "providerId",
      title: "Provider id",
      type: "string",
      description: "The broadcast id at the email provider, for cross-referencing.",
    }),
  ],
  orderings: [
    {
      title: "Issue number, newest first",
      name: "numberDesc",
      by: [{ field: "number", direction: "desc" }],
    },
  ],
  preview: {
    select: { number: "number", title: "title" },
    prepare({ number, title }) {
      return { title: `#${number ?? "?"} — ${title ?? "Untitled"}` };
    },
  },
});
