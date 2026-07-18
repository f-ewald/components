import { test, expect } from "@playwright/test";

test.describe("price-history-chart", () => {
  test("renders an svg with a price line path given sample data", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#price-history-demo");
    const svg = chart.locator("svg");
    await expect(svg).toBeVisible();
    await expect(svg.locator("path")).not.toHaveCount(0);
    await expect(svg.locator("circle")).not.toHaveCount(0);
  });
});
