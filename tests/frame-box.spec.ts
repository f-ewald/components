import { test, expect } from "@playwright/test";

test.describe("frame-box", () => {
  test("renders the label and slotted content", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#frame-box-demo");
    await expect(el.locator(".label")).toHaveText("Debug");
    await expect(el.locator("fieldset")).toHaveAccessibleName("Debug");
    await expect(el).toContainText("Framed content goes here.");
  });
});
