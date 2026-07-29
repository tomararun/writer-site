/**
 * SPEC §6.4 / §6.8 — BlogPosting structured data. One builder for posts and
 * journal entries; the page renders it into a <script type="application/ld+json">.
 */
export type BlogPostingInput = {
  url: string;
  headline: string;
  description?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  imageUrl?: string | null;
  wordCount?: number | null;
  keywords?: (string | null)[] | null;
  articleSection?: string | null;
};

export function blogPostingJsonLd(input: BlogPostingInput): Record<string, unknown> {
  const keywords = (input.keywords ?? []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": input.url },
    url: input.url,
    headline: input.headline,
    ...(input.description ? { description: input.description } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.authorName ? { author: { "@type": "Person", name: input.authorName } } : {}),
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    ...(typeof input.wordCount === "number" ? { wordCount: input.wordCount } : {}),
    ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    ...(input.articleSection ? { articleSection: input.articleSection } : {}),
  };
}
