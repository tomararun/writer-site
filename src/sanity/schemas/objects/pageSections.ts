import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * SPEC §3.3 — `page.sections[]`: a constrained union of five section types
 * plus figure. Deliberately not a page builder; five section types is enough
 * and keeps the design coherent.
 */

export const richTextSection = defineType({
  name: "richTextSection",
  title: "Text section",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "Optional section heading.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "bodyText",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "Text section" };
    },
  },
});

export const timelineSection = defineType({
  name: "timelineSection",
  title: "Timeline",
  type: "object",
  fields: [
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({
      name: "items",
      title: "Entries",
      type: "array",
      validation: (rule) => rule.required().min(2),
      of: [
        defineArrayMember({
          name: "timelineItem",
          title: "Entry",
          type: "object",
          fields: [
            defineField({
              name: "period",
              title: "Period",
              type: "string",
              description: '"2023 – now", "Mar 2021".',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "body", title: "Body", type: "text", rows: 3 }),
          ],
          preview: { select: { title: "title", subtitle: "period" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "Timeline" };
    },
  },
});

export const valuesGridSection = defineType({
  name: "valuesGridSection",
  title: "Values grid",
  type: "object",
  fields: [
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({
      name: "items",
      title: "Values",
      type: "array",
      validation: (rule) => rule.required().min(2).max(6),
      of: [
        defineArrayMember({
          name: "valueItem",
          title: "Value",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "body",
              title: "Body",
              type: "text",
              rows: 3,
              description: "What this value looks like in practice — one honest paragraph.",
            }),
          ],
          preview: { select: { title: "title" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "Values grid" };
    },
  },
});

export const toolsListSection = defineType({
  name: "toolsListSection",
  title: "Tools list",
  type: "object",
  fields: [
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({
      name: "items",
      title: "Tools",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          name: "toolItem",
          title: "Tool",
          type: "object",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "note",
              title: "Note",
              type: "string",
              description: "Why it earns its place.",
            }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
          preview: { select: { title: "name", subtitle: "note" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "Tools list" };
    },
  },
});

export const contactBlockSection = defineType({
  name: "contactBlockSection",
  title: "Contact block",
  type: "object",
  fields: [
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleText",
      description: "What you want to hear about, and what you don't.",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      description: "Shown so people can skip the form (§6.11).",
      validation: (rule) => rule.email(),
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "Contact block" };
    },
  },
});

export const faqSection = defineType({
  name: "faqSection",
  title: "FAQ",
  type: "object",
  fields: [
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          name: "faqItem",
          title: "Question",
          type: "object",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "simpleText",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "question" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "heading" },
    prepare({ title }) {
      return { title: title || "FAQ" };
    },
  },
});
