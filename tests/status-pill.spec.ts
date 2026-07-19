import { test, expect } from "@playwright/test";

test.describe("status-pill", () => {
  test("renders label text, applies the color variant, and shows the spinner when set", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#pill-neutral")).toContainText("Backlog");

    const dangerPill = page.locator("#pill-danger .pill");
    await expect(dangerPill).toHaveClass(/danger/);
    const dangerColor = await dangerPill.evaluate((el) => getComputedStyle(el).color);
    expect(dangerColor).toBe("rgb(220, 38, 38)");

    await expect(page.locator("#pill-primary .spin")).toBeVisible();
    await expect(page.locator("#pill-neutral .spin")).toHaveCount(0);
  });
});
