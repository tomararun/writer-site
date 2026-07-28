import { defineField, defineType } from "sanity";

/** SPEC §3.3 — `project`: a compact project record; the card, not the story. */
export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 2,
      description: "One or two sentences: what it is and who it's for.",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      description: "The year it shipped (or started, if WIP).",
      validation: (rule) => rule.required().integer().min(2000).max(2100),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Live", value: "live" },
          { title: "Work in progress", value: "wip" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "live",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "stack",
      title: "Stack",
      type: "array",
      of: [{ type: "string" }],
      description: "Technology chips.",
    }),
    defineField({
      name: "thumbnail",
      title: "Thumbnail",
      type: "figure",
      description: "Shown on the projects grid.",
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [{ type: "link" }],
      description: "Live site, repository.",
    }),
    defineField({
      name: "caseStudy",
      title: "Case study",
      type: "reference",
      to: [{ type: "caseStudy" }],
      description: "If there's a full write-up, the card links to it.",
    }),
    defineField({
      name: "body",
      title: "Notes",
      type: "bodyText",
      description:
        "Optional longer notes, shown on the project's own page if it ever gets one.",
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Year, newest first",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", year: "year", status: "status", media: "thumbnail" },
    prepare({ title, year, status, media }) {
      return { title, subtitle: [year, status].filter(Boolean).join(" · "), media };
    },
  },
});
