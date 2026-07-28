import { defineArrayMember, defineType } from "sanity";

/**
 * SPEC §3.3 — the main body type: blocks + figure, codeBlock, pullQuote,
 * footnote, calloutBox, embed.
 *
 * Footnotes are INLINE — they sit inside a sentence at the exact point they
 * annotate, which is what lets Phase 2 position the margin note at the
 * reference's vertical offset.
 *
 * Heading levels start at h2: the document title is the only h1 on a page.
 */
export const bodyText = defineType({
  name: "bodyText",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Heading 2", value: "h2" },
        { title: "Heading 3", value: "h3" },
        { title: "Heading 4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Code", value: "code" },
          { title: "Strikethrough", value: "strike-through" },
        ],
        annotations: [
          {
            name: "externalLink",
            title: "External link",
            type: "object",
            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
                validation: (rule) =>
                  rule.required().uri({ scheme: ["http", "https", "mailto"] }),
              },
              {
                name: "rel",
                title: "Link relation (rel)",
                type: "string",
                description: 'Rarely needed — "sponsored" or "nofollow".',
              },
            ],
          },
          {
            name: "internalLink",
            title: "Internal link",
            type: "object",
            fields: [
              {
                name: "reference",
                title: "Document",
                type: "reference",
                to: [
                  { type: "post" },
                  { type: "caseStudy" },
                  { type: "journalEntry" },
                  { type: "project" },
                  { type: "page" },
                ],
                validation: (rule) => rule.required(),
              },
            ],
          },
        ],
      },
      of: [defineArrayMember({ type: "footnote" })],
    }),
    defineArrayMember({ type: "figure" }),
    defineArrayMember({ type: "codeBlock" }),
    defineArrayMember({ type: "pullQuote" }),
    defineArrayMember({ type: "calloutBox" }),
    defineArrayMember({ type: "embed" }),
  ],
});
