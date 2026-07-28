import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — a labelled link, used in case study link rows, project cards
 * and page sections.
 */
export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'The visible text — say where it goes: "Live site", "Source on GitHub".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "href",
      title: "URL",
      type: "string",
      description:
        "Full address for external links, or a path like /writing/my-post for internal ones.",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true;
          if (
            value.startsWith("/") ||
            value.startsWith("https://") ||
            value.startsWith("http://")
          )
            return true;
          return "Use a full URL (https://…) or a site path starting with /.";
        }),
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: {
        list: [
          { title: "Internal — this site", value: "internal" },
          { title: "External — elsewhere", value: "external" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "external",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "rel",
      title: "Link relation (rel)",
      type: "string",
      description:
        'Rarely needed. Set "sponsored" or "nofollow" if the link is paid or untrusted.',
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "href" },
  },
});
