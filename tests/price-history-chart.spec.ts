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

  test("summarizes the series and uses dark chart tokens", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#price-history-demo");
    const svg = chart.locator("svg");
    await expect(svg).toHaveAccessibleName(
      "5 price points from Jan 2023 at $620,000 to Jun 2024 at $680,000.",
    );

    await chart.evaluate((element) => {
      element.style.setProperty("--ui-primary", "#6366f1");
      element.style.setProperty("--ui-text-muted", "#94a3b8");
      element.style.setProperty("--ui-border", "#334155");
      element.style.setProperty("--ui-on-accent", "#ffffff");
    });
    await expect(svg.locator(".series-line")).toHaveCSS("stroke", "rgb(99, 102, 241)");
    await expect(svg.locator(".grid-line").first()).toHaveCSS("stroke", "rgb(51, 65, 85)");
    await expect(svg.locator(".series-point").first()).toHaveCSS("stroke", "rgb(255, 255, 255)");

    await svg.locator(".series-point").first().hover();
    await expect(svg.locator(".tooltip")).toHaveCSS("fill", "rgb(15, 23, 42)");
    await expect(svg.locator(".tooltip-label")).toHaveCSS("fill", "rgb(255, 255, 255)");
  });
});
