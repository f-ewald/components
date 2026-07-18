import { test, expect } from "@playwright/test";

test.describe("weight-bar-chart", () => {
  test("sorts rows descending by weight", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator("#weight-bar-demo");

    await page.evaluate(() => {
      const el = document.getElementById("weight-bar-demo") as HTMLElement & {
        items: { id: string; label: string; value: number }[];
      };
      el.items = [
        { id: "a", label: "Price", value: 0.2 },
        { id: "b", label: "Schools", value: 0.5 },
        { id: "c", label: "Commute", value: 0.3 },
      ];
    });

    const labels = chart.locator(".label");
    await expect(labels).toHaveCount(3);
    await expect(labels.nth(0)).toHaveText("Schools");
    await expect(labels.nth(1)).toHaveText("Commute");
    await expect(labels.nth(2)).toHaveText("Price");
  });
});
