/**
 * SPEC §5.4 — which paths and cache tags a document change touches. Getting
 * this wrong shows up as stale tag pages, so it is a pure, unit-tested
 * function over the webhook payload.
 *
 * The webhook's projection (configured in Sanity, documented in
 * PHASE-6-NOTES) must include: _id, _rev, _type, slug, status, and the
 * taxonomy slugs (tags/topics, category, series) — including, ideally, the
 * PREVIOUS taxonomy on change; the nightly full revalidate (Phase 7) is the
 * safety net the spec prescribes for what slips through.
 */

export type RevalidationPayload = {
  _id: string;
  _rev?: string;
  _type: string;
  slug?: string | null;
  tags?: (string | null)[] | null;
  category?: string | null;
  series?: string | null;
};

export function pathsFor(doc: RevalidationPayload): string[] {
  const paths = new Set<string>(["/"]);
  const tagSlugs = (doc.tags ?? []).filter((t): t is string => Boolean(t));

  switch (doc._type) {
    case "post":
      if (doc.slug) paths.add(`/writing/${doc.slug}`);
      paths.add("/writing");
      paths.add("/archive");
      for (const tag of tagSlugs) paths.add(`/writing/tag/${tag}`);
      if (doc.category) paths.add(`/writing/category/${doc.category}`);
      if (doc.series) paths.add(`/writing/series/${doc.series}`);
      break;
    case "journalEntry":
      if (doc.slug) paths.add(`/journal/${doc.slug}`);
      paths.add("/journal");
      paths.add("/archive");
      for (const tag of tagSlugs) paths.add(`/journal/topic/${tag}`);
      break;
    case "caseStudy":
      if (doc.slug) paths.add(`/case-studies/${doc.slug}`);
      paths.add("/case-studies");
      paths.add("/archive");
      break;
    case "project":
      paths.add("/projects");
      break;
    case "page":
      if (doc.slug) paths.add(`/${doc.slug}`);
      break;
    case "newsletterIssue":
      paths.add("/newsletter");
      break;
    case "tag":
      if (doc.slug) {
        paths.add(`/writing/tag/${doc.slug}`);
        paths.add(`/journal/topic/${doc.slug}`);
      }
      paths.add("/writing");
      paths.add("/journal");
      break;
    case "category":
      if (doc.slug) paths.add(`/writing/category/${doc.slug}`);
      paths.add("/writing");
      break;
    case "series":
      if (doc.slug) paths.add(`/writing/series/${doc.slug}`);
      break;
    case "siteSettings":
    case "author":
      // Rendered into the shell / home — the "/" already in the set covers
      // the visible surface; tags below do the heavy lifting.
      break;
  }
  return [...paths];
}

export function tagsFor(doc: RevalidationPayload): string[] {
  const tags = new Set<string>([doc._type]);
  if (doc.slug) tags.add(`${doc._type}:${doc.slug}`);
  for (const tag of (doc.tags ?? []).filter(Boolean)) tags.add(`tag:${tag}`);
  if (doc.category) tags.add(`category:${doc.category}`);
  if (doc.series) tags.add(`series:${doc.series}`);
  return [...tags];
}

/** The types that live in the search index (§5.2 search_documents.type). */
export const INDEXABLE_TYPES = [
  "post",
  "caseStudy",
  "journalEntry",
  "project",
  "page",
] as const;

export function isIndexable(type: string): boolean {
  return (INDEXABLE_TYPES as readonly string[]).includes(type);
}
