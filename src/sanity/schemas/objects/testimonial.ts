import { defineField, defineType } from "sanity";

/** SPEC §3.3 — an optional quote from a case study's client or collaborator. */
export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "object",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      description: 'Their role and where — "CTO, Acme".',
    }),
    defineField({
      name: "avatar",
      title: "Photo",
      type: "image",
      description: "Optional. Shown small, next to the name.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "role" },
  },
});
