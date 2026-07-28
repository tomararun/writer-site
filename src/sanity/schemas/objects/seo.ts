import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 — per-document SEO overrides. Every field is optional: the page
 * falls back to the document's own title and excerpt when these are empty.
 */
export const seo = defineType({
  name: "seo",
  title: "SEO overrides",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "title",
      title: "Search title",
      type: "string",
      description:
        "Replaces the page title in search results and browser tabs. Leave empty to use the document title. Google truncates around 60 characters.",
      validation: (rule) => rule.max(60).warning("Titles over 60 characters get cut off."),
    }),
    defineField({
      name: "description",
      title: "Search description",
      type: "text",
      rows: 3,
      description:
        "The grey text under the link in search results. Leave empty to use the excerpt. Aim for one persuasive sentence.",
      validation: (rule) =>
        rule.max(155).warning("Descriptions over 155 characters get cut off."),
    }),
    defineField({
      name: "ogImage",
      title: "Social sharing image",
      type: "image",
      description:
        "Shown when the page is shared on social media. Leave empty to use the generated card with the title on it. 1200×630 works best.",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      description:
        "Turn on to ask Google not to list this page. The page stays reachable by URL.",
      initialValue: false,
    }),
    defineField({
      name: "canonicalOverride",
      title: "Canonical URL override",
      type: "url",
      description:
        "Only set this if the definitive version of this content lives at a different URL (for example, it was first published elsewhere).",
    }),
  ],
});
