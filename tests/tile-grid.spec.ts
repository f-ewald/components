import { test, expect } from "@playwright/test";

test.describe("tile-grid", () => {
  test("renders one tile per item", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#grid-files");

    await expect(el.locator(".tile")).toHaveCount(2);
    await expect(el.locator(".tile")).toHaveText(["notes.txt", "photo.jpg"]);
  });

  test("clicking a tile navigates via itemHref", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#grid-files");

    await el.locator(".tile").first().click();
    await expect(page).toHaveURL(/#fil_1$/);
  });
});
