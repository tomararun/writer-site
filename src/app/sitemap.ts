import type { MetadataRoute } from "next";
import { publishedClient } from "@/sanity/lib/client";
import { sitemapQuery } from "@/sanity/lib/queries";
import { site } from "@/site.config";

/**
 * SPEC §4.7 — generated from Sanity with lastModified from updatedAt.
 * Excludes /search, /studio and the confirm/unsubscribe result pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/writing`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/case-studies`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/journal`, changeFrequency: "daily", priority: 0.8 },
    { url: `${site.url}/projects`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/archive`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${site.url}/newsletter`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    const data = await publishedClient.fetch(sitemapQuery);

    const posts = data.posts
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: `${site.url}/writing/${doc.slug}`,
        lastModified: doc.updatedAt ?? doc.publishedAt ?? undefined,
        priority: 0.8,
      }));
    const caseStudies = data.caseStudies
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: `${site.url}/case-studies/${doc.slug}`,
        lastModified: doc.updatedAt ?? doc.publishedAt ?? undefined,
        priority: 0.8,
      }));
    const journal = data.journal
      .filter((doc) => doc.slug)
      .map((doc) => ({
        url: `${site.url}/journal/${doc.slug}`,
        lastModified: doc.publishedAt ?? doc.entryDate ?? undefined,
        priority: 0.5,
      }));
    const facets = [
      ...data.tags.filter((doc) => doc.slug).map((doc) => `/writing/tag/${doc.slug}`),
      ...data.tags.filter((doc) => doc.slug).map((doc) => `/journal/topic/${doc.slug}`),
      ...data.categories
        .filter((doc) => doc.slug)
        .map((doc) => `/writing/category/${doc.slug}`),
      ...data.series.filter((doc) => doc.slug).map((doc) => `/writing/series/${doc.slug}`),
      ...data.pages.filter((doc) => doc.slug).map((doc) => `/${doc.slug}`),
    ].map((path) => ({ url: `${site.url}${path}`, priority: 0.4 }));

    const years = [
      ...new Set(
        [...data.posts, ...data.caseStudies].flatMap((doc) =>
          doc.publishedAt ? [doc.publishedAt.slice(0, 4)] : [],
        ),
      ),
    ].map((year) => ({ url: `${site.url}/archive/${year}`, priority: 0.4 }));

    return [...staticEntries, ...posts, ...caseStudies, ...journal, ...facets, ...years];
  } catch {
    // No Sanity project reachable — the static shell is still a valid sitemap.
    return staticEntries;
  }
}
