import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — one step in a case study's process section. Steps are ordered
 * and the numbering is meaningful (§3.3).
 */
export const processStep = defineType({
  name: "processStep",
  title: "Process step",
  type: "object",
  fields: [
    defineField({
      name: "phase",
      title: "Phase",
      type: "string",
      description: 'The stage label — "Research", "Prototype", "Ship".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "What actually happened in this step, as a headline.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "simpleText",
      description: "The story of the step: what you tried, what you found.",
    }),
    defineField({
      name: "artifacts",
      title: "Artifacts",
      type: "array",
      of: [{ type: "figure" }],
      description:
        "Sketches, screenshots, whiteboard photos from this step. Shown in the margin on wide screens.",
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
      description: 'Roughly how long it took — "2 weeks", "3 days".',
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "phase" },
  },
});
