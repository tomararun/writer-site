import type { Metadata } from "next";
import { site } from "@/site.config";

/**
 * SPEC §4.7 / P8 — one metadata builder for content routes.
 * Description precedence: seo.description → excerpt → first 155 chars of
 * plainText. Canonicals are absolute and self-referencing; `canonicalUrl`
 * wins when the piece was first published elsewhere. The OG image comes
 * from /api/og, keyed on slug + updatedAt so caches bust on revision.
 */

export function descriptionFor(input: {
  seoDescription?: string | null;
  excerpt?: string | null;
  plainText?: string | null;
}): string | undefined {
  if (input.seoDescription?.trim()) return input.seoDescription.trim();
  if (input.excerpt?.trim()) return input.excerpt.trim();
  const plain = input.plainText?.trim();
  if (plain) {
    return plain.length <= 155 ? plain : `${plain.slice(0, 154).trimEnd()}…`;
  }
  return undefined;
}

export function ogImageUrl(input: {
  slug: string;
  type: string;
  updatedAt?: string | null;
}): string {
  const params = new URLSearchParams({ slug: input.slug, type: input.type });
  if (input.updatedAt) params.set("v", input.updatedAt);
  return `${site.url}/api/og?${params.toString()}`;
}

export function buildMetadata(input: {
  title: string;
  /** No site suffix once the title is long (§6.4) or explicitly absolute. */
  absoluteTitle?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  excerpt?: string | null;
  plainText?: string | null;
  path: string;
  canonicalUrl?: string | null;
  type?: "article" | "website";
  publishedAt?: string | null;
  updatedAt?: string | null;
  tags?: (string | null)[] | null;
  ogImage?: string | null;
  noIndex?: boolean | null;
}): Metadata {
  const title = input.seoTitle?.trim() || input.title;
  const description = descriptionFor(input);
  const useAbsolute = input.absoluteTitle || title.length >= 55;

  return {
    title: useAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical: input.canonicalUrl ?? input.path },
    openGraph: {
      type: input.type ?? "article",
      title,
      description,
      ...(input.publishedAt ? { publishedTime: input.publishedAt } : {}),
      ...(input.updatedAt ? { modifiedTime: input.updatedAt } : {}),
      ...(input.tags?.length
        ? { tags: input.tags.filter((tag): tag is string => Boolean(tag)) }
        : {}),
      ...(input.ogImage ? { images: [input.ogImage] } : {}),
    },
    twitter: { card: "summary_large_image" },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
