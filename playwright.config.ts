import { defineConfig, devices } from "@playwright/test";

/**
 * SPEC §5.9 — Playwright across Chromium, WebKit and a mobile viewport.
 *
 * The suite expects a production build: `npm run build && npm run e2e`.
 * Content-dependent specs probe for the seeded dataset and skip themselves
 * when the site is running data-less (fresh clone, CI without Sanity) —
 * chrome-level flows, the 404 contract and axe scans always run.
 *
 * Visual snapshots (@visual) only run when VISUAL=1 — they need stable
 * seeded content to diff against.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  grepInvert: process.env.VISUAL ? undefined : /@visual/,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // PW_CHANNEL=chrome (or msedge) runs against a system browser — useful
    // where the Playwright browser download is blocked. CI leaves it unset.
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: process.env.PW_CHANNEL },
    },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: process.env.PW_CHANNEL },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
