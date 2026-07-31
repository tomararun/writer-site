/**
 * SPEC §5.9 — the content lint (nightly, warns): no missing alt text, no
 * broken internal links, no orphan pages, every published document present
 * in search_documents.
 *
 * Usage: npx tsx --env-file-if-exists=.env.local scripts/content-lint.ts
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID; the search-index check also needs
 * DATABASE_URL (skipped otherwise). Exit code 1 when problems are found.
 */
import { inArray } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "../src/db";
import { publishedClient } from "../src/sanity/lib/client";

type Problem = { level: "error" | "warn"; message: string };
const problems: Problem[] = [];

const LINT_QUERY = `{
  "published": *[
    _type in ["post", "caseStudy", "journalEntry"] &&
    status == "published" && publishedAt <= now()
  ]{
    _id, _type, title, "slug": slug.current,
    "bodyRefs": body[].markDefs[_type == "internalLink"].reference->{
      _type, "slug": slug.current, status, publishedAt
    },
    "figuresMissingAlt": count(body[_type == "figure" && decorative != true && !defined(alt)]),
    "coverMissingAlt": defined(coverImage) && coverImage.decorative != true && !defined(coverImage.alt),
    "galleryMissingAlt": count(gallery[decorative != true && !defined(alt)]),
    "internalLinkCount": count(body[].markDefs[_type == "internalLink"]),
    "tagCount": count(coalesce(tags, topics)),
    "hasExcerpt": defined(excerpt) || defined(reflection)
  }
}`;

type LintDoc = {
  _id: string;
  _type: string;
  title: string | null;
  slug: string | null;
  bodyRefs: ({ _type: string; slug: string | null; status: string | null } | null)[] | null;
  figuresMissingAlt: number | null;
  coverMissingAlt: boolean | null;
  galleryMissingAlt: number | null;
  internalLinkCount: number | null;
  tagCount: number | null;
  hasExcerpt: boolean | null;
};

async function main() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set — nothing to lint.");
    process.exit(1);
  }

  const { published } = await publishedClient.fetch<{ published: LintDoc[] }>(LINT_QUERY);
  console.log(`Linting ${published.length} published documents …`);

  for (const doc of published) {
    const name = `${doc._type} "${doc.title ?? doc.slug}"`;

    /* Missing alt text (§9.1). */
    if ((doc.figuresMissingAlt ?? 0) > 0) {
      problems.push({
        level: "error",
        message: `${name}: ${doc.figuresMissingAlt} body figure(s) missing alt text`,
      });
    }
    if (doc.coverMissingAlt) {
      problems.push({ level: "error", message: `${name}: cover image missing alt text` });
    }
    if ((doc.galleryMissingAlt ?? 0) > 0) {
      problems.push({
        level: "error",
        message: `${name}: ${doc.galleryMissingAlt} gallery figure(s) missing alt text`,
      });
    }

    /* Broken internal links — targets that are unpublished or deleted. */
    for (const ref of doc.bodyRefs ?? []) {
      if (ref === null) {
        problems.push({
          level: "error",
          message: `${name}: internal link to a deleted document`,
        });
      } else if (ref.status && ref.status !== "published" && ref.status !== "archived") {
        problems.push({
          level: "error",
          message: `${name}: internal link to unpublished ${ref._type} "${ref.slug}"`,
        });
      }
    }

    /* Orphans (§4.7): a post nobody can reach through taxonomy. Every doc is
       on its type index + /archive by construction, so "orphan" here means
       a post with no tags AND no internal links pointing anywhere. */
    if (doc._type === "post" && (doc.tagCount ?? 0) === 0) {
      problems.push({
        level: "warn",
        message: `${name}: no tags — unreachable through any facet page`,
      });
    }
    if (doc._type === "post" && (doc.internalLinkCount ?? 0) < 2) {
      problems.push({
        level: "warn",
        message: `${name}: fewer than 2 internal links (§6.4 publish checklist)`,
      });
    }
    if (!doc.hasExcerpt) {
      problems.push({
        level: "warn",
        message: `${name}: no excerpt/reflection — weak search snippet`,
      });
    }
  }

  /* Every published document present in search_documents (§5.9). */
  if (isDbConfigured()) {
    const db = getDb();
    const ids = published.map((doc) => doc._id);
    const indexed = ids.length
      ? await db.query.searchDocuments.findMany({
          where: inArray(schema.searchDocuments.id, ids),
          columns: { id: true },
        })
      : [];
    const indexedIds = new Set(indexed.map((row) => row.id));
    for (const doc of published) {
      if (!indexedIds.has(doc._id)) {
        problems.push({
          level: "error",
          message: `${doc._type} "${doc.title ?? doc.slug}" is missing from search_documents — run scripts/reindex-search.ts`,
        });
      }
    }
  } else {
    console.warn("DATABASE_URL not set — skipping the search-index presence check.");
  }

  const errors = problems.filter((problem) => problem.level === "error");
  const warns = problems.filter((problem) => problem.level === "warn");
  for (const problem of problems) {
    console.log(`${problem.level === "error" ? "✗" : "!"} ${problem.message}`);
  }
  console.log(`\n${errors.length} error(s), ${warns.length} warning(s).`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Content lint failed:", error);
  process.exit(1);
});
