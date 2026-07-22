import { test, expect } from "@playwright/test";

test.describe("frame-box", () => {
  test("renders the label and slotted content", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#frame-box-demo");
    await expect(el.locator(".label")).toHaveText("Debug");
    await expect(el.locator("fieldset")).toHaveAccessibleName("Debug");
    await expect(el).toContainText("Framed content goes here.");
  });

  test("applies tokenized micro-label type and an 8px static-surface radius", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#frame-box-demo");
    await expect(el.locator(".label")).toHaveCSS("font-weight", "600");
    const tracking = await el
      .locator(".label")
      .evaluate((node) => Number.parseFloat(getComputedStyle(node).letterSpacing));
    expect(tracking).toBeGreaterThan(0);
    await expect(el.locator(".frame")).toHaveCSS("border-radius", "8px");
  });
});
