import { defineField } from "sanity";

/**
 * Field factories shared by post, caseStudy and journalEntry, so the three
 * publishable types cannot drift apart on workflow or derived fields.
 */

/** §5.5 lifecycle — draft → inReview → published → archived. */
export function statusField() {
  return defineField({
    name: "status",
    title: "Status",
    type: "string",
    group: "meta",
    description:
      "Draft and In review are private. Published goes live once the publish date passes. Archived stays online with a notice instead of 404ing old links.",
    options: {
      list: [
        { title: "Draft", value: "draft" },
        { title: "In review", value: "inReview" },
        { title: "Published", value: "published" },
        { title: "Archived", value: "archived" },
      ],
      layout: "radio",
      direction: "horizontal",
    },
    initialValue: "draft",
    validation: (rule) => rule.required(),
  });
}

export function publishedAtField() {
  return defineField({
    name: "publishedAt",
    title: "Publish date",
    type: "datetime",
    group: "meta",
    description:
      "Required to publish. A future date schedules the piece — it stays hidden until then.",
    validation: (rule) =>
      rule.custom((value, context) => {
        const status = (context.document as { status?: string } | undefined)?.status;
        if (status === "published" && !value) {
          return "A publish date is required to publish.";
        }
        return true;
      }),
  });
}

export function updatedAtField() {
  return defineField({
    name: "updatedAt",
    title: "Updated",
    type: "datetime",
    group: "meta",
    description:
      'Set this when you make a meaningful revision. With a revision note, readers see "Updated 12 Mar 2026 — …".',
  });
}

export function revisionNoteField() {
  return defineField({
    name: "revisionNote",
    title: "Revision note",
    type: "string",
    group: "meta",
    description:
      'One line about what changed — "clarified the caching section". Shown to readers next to the updated date.',
  });
}

/**
 * SPEC §3.5 — the derived fields. Computed on publish by the
 * computeDerivedFields document action; read-only in the Studio because a
 * hand-edited value would be overwritten on the next publish anyway.
 */
export function derivedFields() {
  const common = {
    group: "derived",
    readOnly: true as const,
  };
  return [
    defineField({
      ...common,
      name: "readingTime",
      title: "Reading time (minutes)",
      type: "number",
      description: "Words ÷ 220, rounded up, minimum 1. Computed on publish.",
    }),
    defineField({
      ...common,
      name: "wordCount",
      title: "Word count",
      type: "number",
      description: "Computed on publish. Feeds the archive stats and the yearly review.",
    }),
    defineField({
      ...common,
      name: "plainText",
      title: "Plain text",
      type: "text",
      rows: 4,
      description: "Flattened body, computed on publish. Feeds the search index and OG images.",
    }),
    defineField({
      ...common,
      name: "headings",
      title: "Headings",
      type: "array",
      description: "H2/H3 outline with anchors, computed on publish. Feeds the margin rail.",
      of: [
        {
          type: "object",
          name: "heading",
          fields: [
            defineField({ name: "level", title: "Level", type: "number" }),
            defineField({ name: "text", title: "Text", type: "string" }),
            defineField({ name: "anchor", title: "Anchor", type: "string" }),
          ],
          preview: { select: { title: "text", subtitle: "anchor" } },
        },
      ],
    }),
  ];
}

export function seoField() {
  return defineField({
    name: "seo",
    title: "SEO",
    type: "seo",
    group: "seo",
  });
}
