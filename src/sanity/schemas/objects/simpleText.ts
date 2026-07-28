import { defineArrayMember, defineType } from "sanity";

/**
 * Portable Text without block-level objects: paragraphs, lists and inline
 * marks only. Used inside footnotes, callouts, process steps — places where a
 * nested figure or code block would be turtles all the way down.
 */
export const simpleText = defineType({
  name: "simpleText",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          {
            name: "externalLink",
            title: "Link",
            type: "object",
            fields: [
              {
                name: "href",
                title: "URL",
                type: "string",
                description: "Full URL, or a site path starting with /.",
                validation: (rule) => rule.required(),
              },
            ],
          },
        ],
      },
    }),
  ],
});
