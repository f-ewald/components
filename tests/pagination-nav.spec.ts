import { test, expect } from "@playwright/test";

test.describe("pagination-nav", () => {
  test("shows the current page, disables prev on the first page, and emits page-change", async ({
    page,
  }) => {
    await page.goto("/");
    const pager = page.locator("#pagination-demo");
    await expect(pager).toContainText("Page 1 of 5");
    await expect(pager.locator('button[aria-label="Previous page"]')).toBeDisabled();

    await pager.locator('button[aria-label="Next page"]').click();
    await expect(page.locator("#pagination-status")).toHaveText("On page 2 of 5");
    await expect(pager).toContainText("Page 2 of 5");
  });

  test("disables next on the last page", async ({ page }) => {
    await page.goto("/");
    const pager = page.locator("#pagination-demo");
    await pager.evaluate((element) => element.setAttribute("current-page", "5"));
    await expect(pager.locator('button[aria-label="Next page"]')).toBeDisabled();
    await expect(pager.locator('button[aria-label="Previous page"]')).toBeEnabled();
  });
});
