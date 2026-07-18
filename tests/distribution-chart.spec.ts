import { test, expect } from "@playwright/test";

test.describe("distribution-chart", () => {
  test("renders an svg with a curve path given sample data", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#distribution-demo");
    const svg = chart.locator("svg");
    await expect(svg).toBeVisible({ timeout: 5000 });
    await expect(svg.locator("path.curve")).toHaveCount(1);
  });
});
