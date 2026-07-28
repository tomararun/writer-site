import { defineField, defineType } from "sanity";

/**
 * SPEC §3.3 — a case study's timeframe, rendered as "Mar 2025 – Aug 2025",
 * or "Mar 2025 – ongoing".
 */
export const timeframe = defineType({
  name: "timeframe",
  title: "Timeframe",
  type: "object",
  fields: [
    defineField({
      name: "start",
      title: "Start",
      type: "date",
      options: { dateFormat: "YYYY-MM" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "end",
      title: "End",
      type: "date",
      options: { dateFormat: "YYYY-MM" },
      description: "Leave empty if the work is ongoing.",
      hidden: ({ parent }) => Boolean((parent as { ongoing?: boolean })?.ongoing),
    }),
    defineField({
      name: "ongoing",
      title: "Ongoing",
      type: "boolean",
      initialValue: false,
    }),
  ],
});
