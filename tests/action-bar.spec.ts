import { test, expect } from "@playwright/test";

test.describe("action-bar", () => {
  test("lays out the start search cluster left of the end action cluster", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator("#action-bar-demo");
    const search = page.locator('[data-testid="action-bar-search"]');
    const create = page.locator('[data-testid="action-bar-create"]');
    await expect(bar).toContainText("Create");
    await expect(search).toBeVisible();

    const searchBox = await search.boundingBox();
    const createBox = await create.boundingBox();
    expect(searchBox!.x).toBeLessThan(createBox!.x);
  });
});
