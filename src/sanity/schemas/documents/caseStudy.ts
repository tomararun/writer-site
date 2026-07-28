import { defineField, defineType } from "sanity";
import {
  derivedFields,
  publishedAtField,
  revisionNoteField,
  seoField,
  statusField,
  updatedAtField,
} from "../fields";
import {
  featuredLimitRule,
  isSlugUniqueAcrossContentTypes,
  seoFloorRule,
  warnOnSlugChangeAfterPublish,
} from "../validations";

/**
 * SPEC §3.3 — `caseStudy`: everything in `post` except kind/category, plus
 * the structured sections. The body is not one Portable Text field but the
 * §6.6 template sections: background → problem → process → implementation →
 * outcomes → learnings.
 */
export const caseStudy = defineType({
  name: "caseStudy",
  title: "Case study",
  type: "document",
  groups: [
    { name: "content", title: "Story", default: true },
    { name: "facts", title: "Facts" },
    { name: "media", title: "Media" },
    { name: "meta", title: "Workflow" },
    { name: "seo", title: "SEO" },
    { name: "derived", title: "Derived" },
  ],
  validation: (rule) => rule.custom(seoFloorRule()),
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      description: "Name the outcome, not the artefact. ≤ 90 characters.",
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description: "The URL: /case-studies/<slug>. Set once, then leave it.",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: isSlugUniqueAcrossContentTypes,
      },
      validation: (rule) => [rule.required(), rule.custom(warnOnSlugChangeAfterPublish())],
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      group: "content",
      description: "One or two sentences for cards and search results. ≤ 200 characters.",
      validation: (rule) => rule.required().max(200),
    }),

    /* ── Facts band (§6.6) ─────────────────────────────────────────────── */
    defineField({
      name: "client",
      title: "Client",
      type: "string",
      group: "facts",
      description: 'Who it was for — or "Personal project".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "array",
      of: [{ type: "string" }],
      group: "facts",
      description: 'What you actually did — "Design", "Frontend", "Writing".',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "timeframe",
      title: "Timeframe",
      type: "timeframe",
      group: "facts",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "stack",
      title: "Stack",
      type: "array",
      of: [{ type: "string" }],
      group: "facts",
      description: "Technology chips shown in the facts band.",
    }),

    /* ── Media ─────────────────────────────────────────────────────────── */
    defineField({
      name: "heroMedia",
      title: "Hero",
      type: "figure",
      group: "media",
      description: "Above the fold. The one image that says what this project is.",
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "figure",
      group: "media",
      description: "Used on cards and the index. Required if featured.",
      validation: (rule) =>
        rule.custom((value, context) => {
          const featured = (context.document as { featured?: boolean } | undefined)?.featured;
          if (featured && !value) return "Featured case studies need a cover image.";
          return true;
        }),
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [{ type: "figure" }],
      group: "media",
      description: "4–12 images. Each figure's layout is respected.",
      validation: (rule) => rule.min(0).max(12),
    }),

    /* ── The story (§6.6 sections) ─────────────────────────────────────── */
    defineField({
      name: "background",
      title: "Background",
      type: "bodyText",
      group: "content",
      description: "The world before the project. Short.",
    }),
    defineField({
      name: "problem",
      title: "Problem",
      type: "bodyText",
      group: "content",
      description: "The sharpest section — what was broken and why it mattered. Required.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "constraints",
      title: "Constraints",
      type: "array",
      of: [{ type: "string" }],
      group: "content",
      description: "Budget, time, team, tech — one line each.",
    }),
    defineField({
      name: "process",
      title: "Process",
      type: "array",
      of: [{ type: "processStep" }],
      group: "content",
      description: "Ordered steps. The numbering is meaningful here.",
    }),
    defineField({
      name: "implementation",
      title: "Implementation",
      type: "bodyText",
      group: "content",
      description: "Technical detail — code blocks welcome.",
    }),
    defineField({
      name: "outcomes",
      title: "Outcomes",
      type: "bodyText",
      group: "content",
      description: "What shipped and what changed because of it.",
    }),
    defineField({
      name: "metrics",
      title: "Metrics",
      type: "array",
      of: [{ type: "metric" }],
      group: "content",
      description: "3–6 numbers, each with a source. No source, no metric.",
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: "learnings",
      title: "Learnings",
      type: "array",
      of: [{ type: "learning" }],
      group: "content",
      description: "Grouped by sentiment in the template: worked / didn't work / would change.",
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [{ type: "link" }],
      group: "content",
      description: "Live site, repository, related write-up.",
    }),
    defineField({
      name: "testimonial",
      title: "Testimonial",
      type: "testimonial",
      group: "content",
      description: "Optional quote from the client or a collaborator.",
    }),
    defineField({
      name: "relatedPosts",
      title: "Related posts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      group: "meta",
      validation: (rule) => rule.max(3).unique(),
    }),

    /* ── Workflow ──────────────────────────────────────────────────────── */
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      group: "meta",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      group: "meta",
      validation: (rule) => rule.max(6).unique(),
    }),
    statusField(),
    publishedAtField(),
    updatedAtField(),
    revisionNoteField(),
    defineField({
      name: "featured",
      title: "Featured on home",
      type: "boolean",
      group: "meta",
      description: "At most 2 case studies can be featured.",
      initialValue: false,
      validation: (rule) => rule.custom(featuredLimitRule("caseStudy", 2)),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      group: "seo",
    }),
    seoField(),
    ...derivedFields(),
  ],
  orderings: [
    {
      title: "Publish date, newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "client", media: "coverImage" },
  },
});
