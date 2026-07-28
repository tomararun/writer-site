import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — a set-apart box in the prose. Four variants, each with a fixed
 * visual treatment; `update` is the one the article header links to when a
 * revision note exists.
 */
export const calloutBox = defineType({
  name: "calloutBox",
  title: "Callout",
  type: "object",
  fields: [
    defineField({
      name: "variant",
      title: "Variant",
      type: "string",
      options: {
        list: [
          { title: "Note — worth knowing", value: "note" },
          { title: "Warning — will bite", value: "warning" },
          { title: "Aside — tangent", value: "aside" },
          { title: "Update — added later", value: "update" },
        ],
        layout: "radio",
      },
      initialValue: "note",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Optional heading for the box. Without one, only the variant label shows.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleText",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "variant" },
    prepare({ title, subtitle }) {
      return { title: title || "Callout", subtitle };
    },
  },
});
