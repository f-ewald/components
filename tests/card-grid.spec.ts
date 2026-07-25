import { test, expect } from "@playwright/test";

test.describe("card-grid", () => {
  test("renders one grid item per slotted link-card", async ({ page }) => {
    await page.goto("/");
    const grid = page.locator("#grid-services");

    await expect(grid.locator("link-card")).toHaveCount(4);
    await expect(grid.locator("link-card .heading")).toHaveText(["Grafana", "Plex", "Pi-hole", "Backup Server"]);
  });

  test("lays out children in a responsive auto-fill grid", async ({ page }) => {
    await page.goto("/");
    const inner = page.locator("#grid-services .grid");

    await expect(inner).toHaveCSS("display", "grid");
    await expect(inner).toHaveCSS("gap", "16px");
    const columns = await inner.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    // auto-fill resolves to a concrete track list once rendered; every track should be >= the 15rem (240px) floor.
    const widths = columns.split(" ").map((token) => parseFloat(token));
    expect(widths.length).toBeGreaterThan(0);
    for (const width of widths) expect(width).toBeGreaterThanOrEqual(240);
  });
});
