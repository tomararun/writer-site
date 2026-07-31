import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    coverage: {
      // §5.9 — ≥80% on src/lib. The include list is the PURE modules; the
      // service-bound ones (search.ts, mailer.ts, rate-limit.ts,
      // turnstile.ts, feed-data.ts, shiki.ts, analytics.ts) belong to the
      // integration layer, which needs live services (Neon branch, Resend)
      // per the spec's own test strategy table.
      include: [
        "src/lib/archive-filter.ts",
        "src/lib/case-study-sections.ts",
        "src/lib/feeds.ts",
        "src/lib/form-security.ts",
        "src/lib/form-state.ts",
        "src/lib/format.ts",
        "src/lib/index-params.ts",
        "src/lib/journal-stats.ts",
        "src/lib/jsonld.ts",
        "src/lib/portable-text.ts",
        "src/lib/reading-time.ts",
        "src/lib/related.ts",
        "src/lib/revalidate-paths.ts",
        "src/lib/seo.ts",
        "src/lib/slugify.ts",
        "src/lib/validators.ts",
        "src/lib/visibility.ts",
      ],
      thresholds: { lines: 80, functions: 80 },
    },
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
