/**
 * SPEC §4.7 / §6 — structured data builders. Each returns a plain object;
 * the page renders it into a <script type="application/ld+json">.
 */

/** §6.1 — Person (with sameAs socials) + WebSite with a SearchAction. */
export function personJsonLd(input: {
  name: string;
  url: string;
  jobTitle?: string | null;
  sameAs?: (string | null)[] | null;
  knowsAbout?: (string | null)[] | null;
}): Record<string, unknown> {
  const sameAs = (input.sameAs ?? []).filter(Boolean);
  const knowsAbout = (input.knowsAbout ?? []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
  };
}

export function webSiteJsonLd(input: { name: string; url: string }): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${input.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** §6.3 / §6.9 — CollectionPage with a positioned ItemList. */
export function collectionPageJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  items: { url: string; name: string }[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: item.url,
        name: item.name,
      })),
    },
  };
}

/** §6.7 — the journal is a Blog with blogPost[]. */
export function blogJsonLd(input: {
  name: string;
  url: string;
  description?: string | null;
  posts: { url: string; headline: string; datePublished?: string | null }[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    blogPost: input.posts.map((post) => ({
      "@type": "BlogPosting",
      url: post.url,
      headline: post.headline,
      ...(post.datePublished ? { datePublished: post.datePublished } : {}),
    })),
  };
}

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
