import { defineField, defineType } from "sanity";

/**
 * SPEC §3.2 + §3.4 — the only image type on the site. Alt text is required at
 * the source, not the template, unless the image is explicitly marked
 * decorative. `layout` drives the rendered width and `sizes` attribute (§5.6).
 */
export const figure = defineType({
  name: "figure",
  title: "Figure",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        'Describe what the image shows for someone who can\'t see it. Say what matters, not "image of". Required unless the image is decorative.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { decorative?: boolean } | undefined;
          if (parent?.decorative) return true;
          if (!value || value.trim().length === 0) {
            return "Alt text is required. If the image is purely decorative, mark it as decorative instead.";
          }
          return true;
        }),
    }),
    defineField({
      name: "decorative",
      title: "Decorative only",
      type: "boolean",
      description:
        "Turn on only if the image adds nothing a reader needs — screen readers will skip it entirely.",
      initialValue: false,
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
      description: "Shown under the image in small mono type. Optional.",
    }),
    defineField({
      name: "credit",
      title: "Credit",
      type: "string",
      description: "Who made or owns the image, if it isn't yours. Shown after the caption.",
    }),
    defineField({
      name: "layout",
      title: "Layout",
      type: "string",
      description:
        "How wide the image sits on the reading page. Inline stays within the text column; wide pushes past it; full bleeds edge to edge; side sits in the margin.",
      options: {
        list: [
          { title: "Inline — text width", value: "inline" },
          { title: "Wide — past the text column", value: "wide" },
          { title: "Full — edge to edge", value: "full" },
          { title: "Side — in the margin", value: "side" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "inline",
    }),
  ],
  preview: {
    select: { media: "asset", title: "caption", subtitle: "alt" },
    prepare({ media, title, subtitle }) {
      return {
        media,
        title: title || subtitle || "Figure",
        subtitle: title ? subtitle : undefined,
      };
    },
  },
});
