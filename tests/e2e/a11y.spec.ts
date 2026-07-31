import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { hasSeededContent, SEEDED_POST_PATH } from "./helpers";

/**
 * SPEC §5.9 — axe on the templates in BOTH themes; zero serious or critical
 * violations. The always-available templates scan unconditionally; the
 * content templates join in once the seeded dataset is reachable.
 */

const STATIC_TEMPLATES = [
  "/",
  "/writing",
  "/case-studies",
  "/journal",
  "/projects",
  "/archive",
  "/newsletter",
  "/contact",
  "/search",
  "/definitely-not-a-page", // 404
];

const CONTENT_TEMPLATES = [
  SEEDED_POST_PATH,
  "/case-studies/rebuilding-the-reading-page",
  "/journal/2026-07-24-grid-named-areas",
  "/writing/tag/typography",
  "/archive/2026",
];

async function scan(page: Page, path: string, theme: "light" | "dark") {
  // Set the theme BEFORE load: flipping it post-load races the body's
  // 160ms colour transition and axe reads mid-transition colours.
  await page.addInitScript((t) => {
    window.localStorage.setItem("writer-site-theme", t);
  }, theme);
  await page.goto(path);

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(
    serious.map(
      (violation) => `${violation.id}: ${violation.help} (${violation.nodes.length})`,
    ),
    `${path} [${theme}]`,
  ).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  for (const path of STATIC_TEMPLATES) {
    test(`axe clean: ${path} [${theme}]`, async ({ page }) => {
      await scan(page, path, theme);
    });
  }

  for (const path of CONTENT_TEMPLATES) {
    test(`axe clean: ${path} [${theme}]`, async ({ page, request }) => {
      test.skip(!(await hasSeededContent(request)), "needs the seeded dataset");
      await scan(page, path, theme);
    });
  }
}
