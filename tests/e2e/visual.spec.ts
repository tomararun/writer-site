import { expect, test } from "@playwright/test";
import { hasSeededContent, SEEDED_POST_PATH } from "./helpers";

/**
 * SPEC §5.9 — visual snapshots on key templates, light + dark, 3 widths.
 * Tagged @visual and excluded from the default run (see playwright.config):
 * baselines need stable seeded content. First run with VISUAL=1 writes the
 * baselines; later runs diff against them (manual approval on change).
 */

const TEMPLATES = ["/", SEEDED_POST_PATH, "/writing", "/journal", "/archive", "/newsletter"];
const WIDTHS = [320, 768, 1440];

for (const path of TEMPLATES) {
  for (const width of WIDTHS) {
    for (const theme of ["light", "dark"] as const) {
      test(`@visual ${path} @${width} [${theme}]`, async ({ page, request }) => {
        test.skip(!(await hasSeededContent(request)), "needs the seeded dataset");
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((t) => {
          window.localStorage.setItem("writer-site-theme", t);
        }, theme);
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot(
          `${path.replaceAll("/", "_") || "home"}-${width}-${theme}.png`,
          { fullPage: true, maxDiffPixelRatio: 0.02 },
        );
      });
    }
  }
}
