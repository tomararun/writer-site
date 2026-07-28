import { defineField, defineType } from "sanity";
import { derivedFields, publishedAtField, statusField } from "../fields";
import { isSlugUniqueAcrossContentTypes, warnOnSlugChangeAfterPublish } from "../validations";

/**
 * SPEC §3.3 — `journalEntry`: a dated learning note. The `reflection` field
 * is the point of the whole type: one paragraph answering "what changed in
 * how I think?"
 */
export const journalEntry = defineType({
  name: "journalEntry",
  title: "Journal entry",
  type: "document",
  groups: [
    { name: "content", title: "Entry", default: true },
    { name: "meta", title: "Workflow" },
    { name: "derived", title: "Derived" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      description: "Short, optional. Without one, the entry shows its date instead.",
      validation: (rule) => rule.max(90),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description: "Pattern: YYYY-MM-DD-topic — it keeps the archive naturally sorted.",
      options: {
        source: (doc) => {
          const d = doc as { entryDate?: string; title?: string };
          return [d.entryDate, d.title ?? "note"].filter(Boolean).join("-");
        },
        maxLength: 96,
        isUnique: isSlugUniqueAcrossContentTypes,
      },
      validation: (rule) => [
        rule.required().custom((value) => {
          if (!value?.current) return true;
          if (/^\d{4}-\d{2}-\d{2}-/.test(value.current)) return true;
          return {
            message: "Journal slugs start with the entry date: YYYY-MM-DD-topic.",
            level: "warning",
          } as const;
        }),
        rule.custom(warnOnSlugChangeAfterPublish()),
      ],
    }),
    defineField({
      name: "entryDate",
      title: "Entry date",
      type: "date",
      group: "content",
      description: "The day the learning happened — not the day you publish it.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "topics",
      title: "Topics",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      group: "content",
      description: "1–4 tags.",
      validation: (rule) => rule.required().min(1).max(4).unique(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "bodyText",
      group: "content",
      description: "Usually short. What you did, what you hit, what you found.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "reflection",
      title: "Reflection",
      type: "text",
      rows: 4,
      group: "content",
      description:
        "One paragraph: what changed in how you think? This is the point of the journal — skip the play-by-play and answer the question.",
    }),
    defineField({
      name: "resources",
      title: "Resources",
      type: "array",
      of: [{ type: "reference", to: [{ type: "resource" }] }],
      group: "content",
      description: "The book, talk, repo or person this learning came from.",
    }),
    defineField({
      name: "codeSnippets",
      title: "Code snippets",
      type: "array",
      of: [{ type: "codeBlock" }],
      group: "content",
    }),
    defineField({
      name: "mood",
      title: "Mood",
      type: "string",
      group: "content",
      description: 'Drives a small glyph on the entry. Be honest — "stuck" entries age best.',
      options: {
        list: [
          { title: "Breakthrough", value: "breakthrough" },
          { title: "Grinding", value: "grinding" },
          { title: "Stuck", value: "stuck" },
          { title: "Curious", value: "curious" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "timeSpent",
      title: "Time spent (minutes)",
      type: "number",
      group: "content",
      description: "Optional. Enables the yearly hours total on the archive.",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({
      name: "relatedEntries",
      title: "Related entries",
      type: "array",
      of: [{ type: "reference", to: [{ type: "journalEntry" }] }],
      group: "meta",
      validation: (rule) => rule.max(3).unique(),
    }),
    statusField(),
    publishedAtField(),
    ...derivedFields(),
  ],
  orderings: [
    {
      title: "Entry date, newest first",
      name: "entryDateDesc",
      by: [{ field: "entryDate", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", date: "entryDate", subtitle: "mood" },
    prepare({ title, date, subtitle }) {
      return {
        title: title || date || "Journal entry",
        subtitle: [date, subtitle].filter(Boolean).join(" · "),
      };
    },
  },
});
