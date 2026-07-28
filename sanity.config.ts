"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId, studioBasePath } from "@/sanity/env";
import { DERIVED_FIELD_TYPES, PREVIEWABLE_TYPES, schemaTypes } from "@/sanity/schemas";
import { structure } from "@/sanity/structure";
import { withComputeDerivedFields } from "@/sanity/actions/computeDerivedFields";
import { openPreviewAction } from "@/sanity/actions/openPreview";

/**
 * The embedded Studio (SPEC §5.5), mounted at /studio by
 * src/app/studio/[[...tool]]/page.tsx.
 */
export default defineConfig({
  name: "writer-site",
  title: "writer-site",
  projectId,
  dataset,
  basePath: studioBasePath,

  plugins: [
    structureTool({ structure }),
    // GROQ playground; invaluable while writing queries. Dev only.
    ...(process.env.NODE_ENV === "development"
      ? [visionTool({ defaultApiVersion: apiVersion })]
      : []),
  ],

  schema: {
    types: schemaTypes,
    // The settings singleton is edited via the Settings group, never created.
    templates: (templates) =>
      templates.filter((template) => template.schemaType !== "siteSettings"),
  },

  document: {
    actions: (actions, context) => {
      let result = actions;

      // §3.5 — publish computes the derived fields first.
      if ((DERIVED_FIELD_TYPES as readonly string[]).includes(context.schemaType)) {
        result = result.map((Action) =>
          Action.action === "publish" ? withComputeDerivedFields(Action) : Action,
        );
      }

      // §5.5 — "Open preview" on everything with a public page.
      if ((PREVIEWABLE_TYPES as readonly string[]).includes(context.schemaType)) {
        result = [...result, openPreviewAction];
      }

      // The singleton cannot be deleted or duplicated.
      if (context.schemaType === "siteSettings") {
        result = result.filter(
          (Action) => !["delete", "duplicate", "unpublish"].includes(Action.action ?? ""),
        );
      }

      return result;
    },
  },
});
