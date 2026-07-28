import { defineArrayMember, defineField, defineType } from "sanity";
import { seoField } from "../fields";

/**
 * SPEC §3.3 — `page`: About, Contact, Now, Privacy, Colophon. Structured
 * sections, not free HTML — five section types plus figure is enough.
 */
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description: 'The URL path: "about", "privacy", "colophon".',
      options: { source: "title", maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      group: "content",
      of: [
        defineArrayMember({ type: "richTextSection" }),
        defineArrayMember({ type: "timelineSection" }),
        defineArrayMember({ type: "valuesGridSection" }),
        defineArrayMember({ type: "toolsListSection" }),
        defineArrayMember({ type: "contactBlockSection" }),
        defineArrayMember({ type: "faqSection" }),
        defineArrayMember({ type: "figure" }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    seoField(),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle ? `/${subtitle}` : undefined };
    },
  },
});
