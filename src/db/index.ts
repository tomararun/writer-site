import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * SPEC §5.3 — the Neon serverless driver over HTTP: one-shot queries from
 * server actions, no pooling concerns, no `pg` in the edge runtime.
 *
 * Lazy by design: importing this module never throws, so builds and routes
 * that don't touch the database work without DATABASE_URL. Callers get a
 * clear error the moment they actually try to query without one.
 */

let cached: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a Neon project and add its connection string to .env.local (see docs/PHASE-5-NOTES.md).",
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export { schema };
