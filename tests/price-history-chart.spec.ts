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

test.describe("price-history-chart west of UTC", () => {
  test.use({ timezoneId: "America/New_York" });

  test("reads first-of-month dates as local calendar days", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const chart = document.createElement("price-history-chart");
      chart.id = "price-tz";
      chart.style.display = "block";
      chart.style.width = "400px";
      chart.history = [
        { date: "2024-01-01", price: 500000, eventType: "Listed" },
        { date: "2024-06-01", price: 520000, eventType: "Sold" },
      ];
      document.body.append(chart);
    });
    await expect(page.locator("#price-tz svg")).toHaveAccessibleName(
      "2 price points from Jan 2024 at $500,000 to Jun 2024 at $520,000.",
    );
  });
});
