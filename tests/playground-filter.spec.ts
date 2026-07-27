import { test, expect } from "@playwright/test";

test.describe("playground component filter", () => {
  test("suggests matching components as you type", async ({ page }) => {
    await page.goto("/");
    await page.locator("#nav-filter input").fill("loading");
    await expect(page.locator("#nav-filter .suggestion")).toHaveText([
      "loading-dots",
      "loading-spinner",
    ]);
  });

  test("selecting a suggestion jumps to that component's section", async ({ page }) => {
    await page.goto("/");
    await page.locator("#nav-filter input").fill("loading-spinner");
    await page
      .locator("#nav-filter .suggestion", { hasText: "loading-spinner" })
      .click();
    await expect(page).toHaveURL(/#loading-spinner$/);
    await expect(page.locator("#loading-spinner")).toBeInViewport();
  });
});
