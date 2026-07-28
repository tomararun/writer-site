import { defineField, defineType } from "sanity";
import { toPlainText } from "@/lib/portable-text";
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

/** SPEC §3.3 — `post`: essay / tutorial / reflection / opinion. */
export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "meta", title: "Workflow" },
    { name: "seo", title: "SEO" },
    { name: "derived", title: "Derived" },
  ],
  validation: (rule) => [
    rule.custom(seoFloorRule()),
    rule.custom((document) => {
      const doc = document as { body?: unknown; status?: string } | undefined;
      if (!doc || doc.status !== "published") return true;
      const words = toPlainText(doc.body).split(/\s+/u).filter(Boolean).length;
      if (words > 0 && words < 300) {
        return {
          message: `This post is ${words} words — is it actually a journal entry? (§3.4)`,
          level: "warning",
        } as const;
      }
      return true;
    }),
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      description: "The argument, not the topic. ≤ 90 characters.",
      validation: (rule) => rule.required().max(90),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      description:
        "The URL: /writing/<slug>. Set once, then leave it — changing it after publish breaks links.",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: isSlugUniqueAcrossContentTypes,
      },
      validation: (rule) => [rule.required(), rule.custom(warnOnSlugChangeAfterPublish())],
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      group: "content",
      description: "Drives the label on cards and the template accents.",
      options: {
        list: [
          { title: "Essay", value: "essay" },
          { title: "Tutorial", value: "tutorial" },
          { title: "Reflection", value: "reflection" },
          { title: "Opinion", value: "opinion" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "essay",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      group: "content",
      description:
        "One or two sentences for cards, feeds and search results. Write it as a promise of what the piece delivers. ≤ 200 characters.",
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "bodyText",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "figure",
      group: "content",
      description: "Optional — but required if the post is featured on the home page.",
      validation: (rule) =>
        rule.custom((value, context) => {
          const featured = (context.document as { featured?: boolean } | undefined)?.featured;
          if (featured && !value) return "Featured posts need a cover image.";
          return true;
        }),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      group: "meta",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      group: "meta",
      description: "Exactly one. Categories are the fixed shelves; tags are the loose threads.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      group: "meta",
      description: "1–6. If you need a seventh, the piece is probably two pieces.",
      validation: (rule) => rule.required().min(1).max(6).unique(),
    }),
    defineField({
      name: "series",
      title: "Series",
      type: "object",
      group: "meta",
      description: "Only if this post is part of an ordered series.",
      fields: [
        defineField({
          name: "series",
          title: "Series",
          type: "reference",
          to: [{ type: "series" }],
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "order",
          title: "Part number",
          type: "number",
          description: "1-based position within the series.",
          validation: (rule) => rule.required().integer().positive(),
        }),
      ],
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
      description: "At most 3 posts can be featured — the home page composition depends on it.",
      initialValue: false,
      validation: (rule) => rule.custom(featuredLimitRule("post", 3)),
    }),
    defineField({
      name: "relatedManual",
      title: "Related posts (manual)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      group: "meta",
      description:
        "Leave empty and related posts are picked automatically (shared tags, series, category). Set to override.",
      validation: (rule) => rule.max(3).unique(),
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      group: "seo",
      description: "Only if this piece was first published somewhere else.",
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
    select: { title: "title", subtitle: "status", media: "coverImage" },
    prepare({ title, subtitle, media }) {
      return { title, subtitle, media };
    },
  },
});
