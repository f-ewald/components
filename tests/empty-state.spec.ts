import { test, expect } from "@playwright/test";

test.describe("empty-state", () => {
  test("renders heading, description, and slotted actions", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#empty-state-demo");
    await expect(el.locator(".heading")).toHaveText("No results found");
    await expect(el.locator(".description")).not.toHaveText("");
    await expect(el.locator('[slot="actions"]')).toBeVisible();
  });

  test("renders no description element when compact and heading-only", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#empty-state-compact");
    await expect(el).toHaveAttribute("size", "sm");
    await expect(el.locator(".heading")).not.toHaveText("");
    await expect(el.locator(".description")).toHaveCount(0);
  });
});
