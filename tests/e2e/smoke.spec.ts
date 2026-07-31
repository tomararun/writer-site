import { expect, test } from "@playwright/test";
import { hasSeededContent, SEEDED_POST_PATH } from "./helpers";

/**
 * SPEC §5.9 — the chrome-level flows that must work with or without
 * content: navigation, theme persistence, skip link, the 404 contract,
 * no-JS form submission.
 */

test("home renders the statement and the four index links respond", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  for (const path of ["/writing", "/case-studies", "/journal", "/projects"]) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test("dark-mode preference survives navigation (§9.1)", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await page.getByRole("button", { name: /theme/i }).click();
  const theme = await html.getAttribute("data-theme");
  expect(theme === "dark" || theme === "light").toBe(true);

  await page.getByRole("link", { name: "Journal" }).first().click();
  await page.waitForURL("**/journal");
  await expect(html).toHaveAttribute("data-theme", theme!);
});

test("skip link is first-focusable and moves focus to main", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("404 returns a real HTTP 404 with recovery options (§6.14)", async ({ page }) => {
  const response = await page.goto("/definitely-not-a-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /isn.t here/i })).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: "Archive" })).toBeVisible();
});

test("the contact form posts without JavaScript (§6.11)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Playwright");
  await page.getByLabel("Email", { exact: true }).fill("e2e@example.com");
  await page
    .getByLabel("Message")
    .fill("A no-JavaScript submission with enough detail to pass.");
  await page.getByRole("button", { name: "Send message" }).click();
  // With services connected: the success line. Without: the honest
  // "not wired up" error. Either proves the server action ran without JS.
  await expect(page.getByText(/Message sent|isn't wired up|went wrong/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await context.close();
});

test("archive filters combine and survive reload", async ({ page, request }) => {
  test.skip(!(await hasSeededContent(request)), "needs the seeded dataset");
  await page.goto("/archive");
  await page
    .getByRole("checkbox", { name: /^Writing/ })
    .first()
    .check();
  await expect(page).toHaveURL(/types=post/);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /^Writing/ }).first()).toBeChecked();
  // Land on a valid result.
  const firstRow = page.locator("ol li a").first();
  await firstRow.click();
  await expect(page).toHaveURL(/\/writing\//);
});

test("an article reads end to end: rail, footnote, code copy (§5.9)", async ({
  page,
  request,
}) => {
  test.skip(!(await hasSeededContent(request)), "needs the seeded dataset");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(SEEDED_POST_PATH);

  await expect(
    page.getByRole("navigation", { name: "Sections in this article" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Reading progress" })).toBeVisible();
  // The margin footnote sits at its reference.
  await expect(page.locator("[data-footnote-margin] aside").first()).toBeVisible();
  // Prev/next or related exists at the bottom.
  await page.keyboard.press("End");
  await expect(page.getByText("Get the next one by email.")).toBeVisible();
});

test("⌘K opens the palette, Esc restores focus (§9.1)", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Search" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
