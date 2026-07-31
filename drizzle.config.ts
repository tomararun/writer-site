import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read .env.local on its own; load it so db:migrate and
// db:studio work with the same file the app uses. Values already in the
// environment win.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !(match[1]! in process.env)) {
      process.env[match[1]!] = match[2]!.replace(/^["']|["']$/g, "");
    }
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Required only for `db:migrate` / `db:studio`; `db:generate` is offline.
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
