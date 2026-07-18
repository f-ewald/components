import { test, expect } from "@playwright/test";

test.describe("percent-bar-chart", () => {
  test("renders an svg with a rect per group and shows the labels", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#percent-bar-demo");
    const svg = chart.locator("svg");
    await expect(svg).toBeVisible();
    await expect(svg.locator("rect")).toHaveCount(4);
    await expect(svg).toContainText("White");
    await expect(svg).toContainText("Asian");
  });
});
