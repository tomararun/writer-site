import { eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";

/**
 * SPEC §5.4/P7 — search_documents is a projection of Sanity. One pure
 * mapping (`toSearchDocument`) is shared by the revalidate webhook and the
 * full-rebuild script, so the two can never disagree about a row's shape.
 * The weighted tsv column derives in Postgres (§4.6) — nothing to compute
 * here beyond clean columns.
 */

export type SearchDocInput = {
  _id: string;
  _type: string;
  kind?: string | null;
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  reflection?: string | null;
  summary?: string | null;
  plainText?: string | null;
  /** Tag/topic TITLES — this feeds full-text matching, not URLs. */
  tagTitles?: (string | null)[] | null;
  category?: string | null;
  publishedAt?: string | null;
  entryDate?: string | null;
  readingTime?: number | null;
  coverUrl?: string | null;
};

const PATH_BY_TYPE: Record<string, (slug: string) => string> = {
  post: (slug) => `/writing/${slug}`,
  caseStudy: (slug) => `/case-studies/${slug}`,
  journalEntry: (slug) => `/journal/${slug}`,
  project: () => "/projects",
  page: (slug) => `/${slug}`,
};

export type SearchDocumentRow = typeof schema.searchDocuments.$inferInsert;

export function toSearchDocument(input: SearchDocInput): SearchDocumentRow | null {
  const toPath = PATH_BY_TYPE[input._type];
  if (!toPath || !input.slug) return null;

  const date = input.entryDate ?? input.publishedAt ?? null;
  const title = input.title ?? (date ? `Journal, ${date.slice(0, 10)}` : null);
  if (!title) return null;

  return {
    id: input._id,
    type: input._type,
    kind: input.kind ?? null,
    slug: input.slug,
    path: toPath(input.slug),
    title,
    excerpt: input.excerpt ?? input.reflection ?? input.summary ?? null,
    bodyText: input.plainText ?? null,
    tagsText: (input.tagTitles ?? []).filter(Boolean).join(" ") || null,
    category: input.category ?? null,
    publishedAt: date ? new Date(date) : null,
    year: date ? Number(date.slice(0, 4)) : null,
    readingTime: input.readingTime ?? null,
    coverUrl: input.coverUrl ?? null,
    updatedAt: new Date(),
  };
}

export async function upsertSearchDocument(input: SearchDocInput): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const row = toSearchDocument(input);
  if (!row) return false;
  const db = getDb();
  await db
    .insert(schema.searchDocuments)
    .values(row)
    .onConflictDoUpdate({ target: schema.searchDocuments.id, set: row });
  return true;
}

export async function deleteSearchDocument(id: string): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDb();
  await db.delete(schema.searchDocuments).where(eq(schema.searchDocuments.id, id));
}
