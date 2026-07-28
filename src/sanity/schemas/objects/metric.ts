import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 + §3.4 — one number in a case study's metrics band. `source` is
 * required because a metric without a source is an adjective.
 */
export const metric = defineType({
  name: "metric",
  title: "Metric",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'What was measured — "Time to first byte", "Sign-up conversion".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "string",
      description: 'The number itself, as you want it displayed — "1.2s", "38%", "4.9/5".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "delta",
      title: "Change",
      type: "string",
      description: 'The before/after movement, if there is one — "−64%", "+2.1pt". Optional.',
    }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      description: 'Only if the value doesn\'t already carry it — "ms", "visits/mo".',
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description: "One line of context — the time window, the cohort, the caveat.",
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      description:
        'Where this number comes from — "Lighthouse CI, median of 5 runs", "Plausible, Q3 2025". Required: it keeps the case study honest.',
      validation: (rule) => rule.required().error("Every metric needs a source."),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "value" },
  },
});
