/**
 * SPEC P7 — full search index rebuild: fetch every indexable published
 * document from Sanity and upsert it into search_documents, removing rows
 * whose documents no longer exist.
 *
 * Usage: npx tsx --env-file-if-exists=.env.local scripts/reindex-search.ts
 * Needs NEXT_PUBLIC_SANITY_PROJECT_ID and DATABASE_URL.
 */
import { notInArray, sql } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "../src/db";
import { publishedClient } from "../src/sanity/lib/client";
import { searchIndexQuery } from "../src/sanity/lib/queries";
import { toSearchDocument } from "../src/lib/search-index";

async function main() {
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set — nothing to index from.");
    process.exit(1);
  }
  if (!isDbConfigured()) {
    console.error("DATABASE_URL is not set — nowhere to index to.");
    process.exit(1);
  }

  console.log("Fetching indexable documents from Sanity …");
  const documents = await publishedClient.fetch(searchIndexQuery);
  const rows = documents
    .map((doc) => toSearchDocument(doc))
    .filter((row): row is NonNullable<typeof row> => row !== null);

  console.log(`Upserting ${rows.length} of ${documents.length} documents …`);
  const db = getDb();
  for (const row of rows) {
    await db
      .insert(schema.searchDocuments)
      .values(row)
      .onConflictDoUpdate({ target: schema.searchDocuments.id, set: row });
  }

  // Remove rows for unpublished/deleted documents. An empty keep-list means
  // nothing is published — clearing the index is then the correct rebuild.
  const keptIds = rows.map((row) => row.id);
  const removed = await db
    .delete(schema.searchDocuments)
    .where(keptIds.length ? notInArray(schema.searchDocuments.id, keptIds) : sql`true`)
    .returning({ id: schema.searchDocuments.id });

  console.log(`Done: ${rows.length} indexed, ${removed.length} stale rows removed.`);
}

main().catch((error) => {
  console.error("Reindex failed:", error);
  process.exit(1);
});
