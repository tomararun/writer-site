import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { draftClient } from "@/sanity/lib/client";

/**
 * SPEC §5.5 — "Open preview" lands here. The URL carries a short-lived
 * secret that the Studio action wrote INTO THE DATASET
 * (@sanity/preview-url-secret); this route verifies it with the server-side
 * read token and enables draft mode. No long-lived secret exists in any
 * client bundle.
 *
 * Requires SANITY_API_READ_TOKEN (Viewer role) in the environment.
 */
export const { GET } = defineEnableDraftMode({ client: draftClient });
