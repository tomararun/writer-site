import { defineField, defineType } from "sanity";

/**
 * SPEC §3.1 — `siteSettings`: a singleton. Nav, default SEO, social links,
 * feature flags. The Studio structure pins it under Settings; it cannot be
 * created or deleted from the desk.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "siteName",
      title: "Site name",
      type: "string",
      description: "Your name, as it appears in the header and page titles.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Default description",
      type: "text",
      rows: 2,
      description: "Fallback meta description for pages without their own. ≤ 155 characters.",
      validation: (rule) => rule.max(155),
    }),
    defineField({
      name: "nav",
      title: "Navigation",
      type: "array",
      of: [{ type: "link" }],
      description: "Header items, in order. Five short labels fit; six don't.",
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [{ type: "link" }],
      description: 'Footer "Elsewhere" column.',
    }),
    defineField({
      name: "defaultSeo",
      title: "Default SEO",
      type: "seo",
      description: "Site-wide fallbacks; individual documents can override.",
    }),
    defineField({
      name: "flags",
      title: "Feature flags",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "showViewCounts",
          title: "Show view counts",
          type: "boolean",
          description: "Public view counters on posts (Phase 7). Off by default.",
          initialValue: false,
        }),
        defineField({
          name: "showNewsletterSignup",
          title: "Show newsletter signup",
          type: "boolean",
          description: "Turn off to hide every subscribe box while the list isn't ready.",
          initialValue: true,
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site settings" };
    },
  },
});
