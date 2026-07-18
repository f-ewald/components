import { test, expect } from "@playwright/test";

test.describe("radio-cards", () => {
  test("renders options, reflects the selected value, and fires change", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#radio-cards-demo");

    await expect(cards.locator(".card")).toHaveCount(2);
    await expect(cards.locator(".card").nth(0).locator("input")).toBeChecked();

    await cards.locator(".card").nth(1).click();
    await expect(cards.locator(".card").nth(1).locator("input")).toBeChecked();
    await expect(cards.locator(".card").nth(0).locator("input")).not.toBeChecked();
    await expect(page.locator("#radio-cards-selected")).toHaveText("detailed");
  });
});
