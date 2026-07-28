import { defineField, defineType } from "sanity";

/** SPEC §3.3 — `resource`: a book/course/talk/repo a journal entry learned from. */
export const resource = defineType({
  name: "resource",
  title: "Resource",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: {
        list: [
          { title: "Book", value: "book" },
          { title: "Article", value: "article" },
          { title: "Course", value: "course" },
          { title: "Video", value: "video" },
          { title: "Repository", value: "repo" },
          { title: "Paper", value: "paper" },
          { title: "Person", value: "person" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      description: "Where to find it. Optional for books and people.",
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      description: "Who made it.",
    }),
    defineField({
      name: "note",
      title: "Why it mattered",
      type: "text",
      rows: 3,
      description: "Not a summary — what it changed for you.",
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      description: "1–5, optional. Your private scale; be consistent.",
      validation: (rule) => rule.min(1).max(5).integer(),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "kind" },
  },
});
