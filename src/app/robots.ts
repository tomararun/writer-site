import type { MetadataRoute } from "next";
import { site } from "@/site.config";

/** SPEC §4.7 — allows all; disallows /studio, /api, /search; links the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/api/", "/search"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
