import { defineField, defineType } from "sanity";

/**
 * SPEC §3.1 — `redirect`: old path → new path, editable in the Studio.
 * Consumed by middleware in Phase 7; modelled now so slug changes have
 * somewhere to point.
 */
export const redirect = defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  fields: [
    defineField({
      name: "from",
      title: "From",
      type: "string",
      description: "The old path, starting with / — e.g. /writing/old-slug.",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true;
          if (!value.startsWith("/")) return "Paths start with /.";
          if (value.includes("://")) return "Use a path, not a full URL.";
          return true;
        }),
    }),
    defineField({
      name: "to",
      title: "To",
      type: "string",
      description: "The new destination — a path like /writing/new-slug, or a full URL.",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true;
          if (value.startsWith("/") || value.startsWith("https://")) return true;
          return "Use a path starting with /, or a full https:// URL.";
        }),
    }),
    defineField({
      name: "permanent",
      title: "Permanent (308)",
      type: "boolean",
      description: "On for moved-forever (search engines transfer ranking). Off for temporary.",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "from", subtitle: "to" },
    prepare({ title, subtitle }) {
      return { title: `${title} →`, subtitle };
    },
  },
});
