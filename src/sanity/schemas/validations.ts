import type { SlugValidationContext, ValidationContext } from "sanity";

/**
 * SPEC §3.4 — the cross-cutting validation rules. They live in one file
 * because they express editorial policy, not field shape, and several
 * document types share them.
 */

/** The three types whose slugs share the /writing-adjacent URL space and search results. */
const SLUG_SCOPED_TYPES = ["post", "caseStudy", "journalEntry"] as const;

/**
 * §3.4 — "Slug uniqueness across post + caseStudy + journalEntry."
 * Plugged into the slug field's `options.isUnique`.
 */
export async function isSlugUniqueAcrossContentTypes(
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> {
  const { document, getClient } = context;
  const client = getClient({ apiVersion: "2024-10-01" });
  const id = document?._id.replace(/^drafts\./, "") ?? "";
  const params = {
    draft: `drafts.${id}`,
    published: id,
    slug,
    types: [...SLUG_SCOPED_TYPES],
  };
  const query = `!defined(*[_type in $types && !(_id in [$draft, $published]) && slug.current == $slug][0]._id)`;
  return client.fetch<boolean>(query, params);
}

/**
 * §3.4 — "Max 3 featured posts, max 2 featured case studies", enforced by a
 * validation query so the home page composition stays protected.
 */
export function featuredLimitRule(type: "post" | "caseStudy", max: number) {
  return async (value: boolean | undefined, context: ValidationContext) => {
    if (!value) return true;
    const client = context.getClient({ apiVersion: "2024-10-01" });
    const id = context.document?._id.replace(/^drafts\./, "") ?? "";
    const count = await client.fetch<number>(
      `count(*[_type == $type && featured == true && !(_id in [$draft, $published])])`,
      { type, draft: `drafts.${id}`, published: id },
    );
    if (count >= max) {
      return `Only ${max} ${type === "post" ? "posts" : "case studies"} can be featured at once — unfeature one first.`;
    }
    return true;
  };
}

/**
 * §3.3 — slugs are immutable after publish. A hard block would make genuine
 * mistakes unfixable, so this warns instead, loudly.
 */
export function warnOnSlugChangeAfterPublish() {
  return async (value: { current?: string } | undefined, context: ValidationContext) => {
    const current = value?.current;
    if (!current || !context.document?._id.startsWith("drafts.")) return true;
    const publishedId = context.document._id.replace(/^drafts\./, "");
    const client = context.getClient({ apiVersion: "2024-10-01" });
    const publishedSlug = await client.fetch<string | null>(`*[_id == $id][0].slug.current`, {
      id: publishedId,
    });
    if (publishedSlug && publishedSlug !== current) {
      return {
        message: `This is published as /${publishedSlug}. Changing the slug breaks every existing link to it — only do this deliberately (a redirect will be needed).`,
        level: "warning",
      } as const;
    }
    return true;
  };
}

/**
 * §3.4 — "Publish blocked if seo.description and excerpt are both empty."
 * Document-level rule: the excerpt field also carries its own `required`,
 * so this mainly catches documents created by scripts or imports.
 */
export function seoFloorRule() {
  return (document: unknown) => {
    const doc = document as
      { excerpt?: string; seo?: { description?: string }; status?: string } | undefined;
    if (!doc || doc.status !== "published") return true;
    const excerpt = doc.excerpt?.trim();
    const seoDescription = doc.seo?.description?.trim();
    if (!excerpt && !seoDescription) {
      return "Add an excerpt or an SEO description before publishing — search results need one of them.";
    }
    return true;
  };
}
