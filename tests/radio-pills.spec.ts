import { test, expect } from "@playwright/test";

test.describe("radio-pills", () => {
  test("renders options, reflects the selected value, and fires change", async ({ page }) => {
    await page.goto("/");
    const pills = page.locator("#radio-pills-demo");

    await expect(pills.locator(".pill")).toHaveCount(4);
    await expect(pills.locator(".pill").nth(0).locator("input")).toBeChecked();

    await pills.locator(".pill").nth(2).click();
    await expect(pills.locator(".pill").nth(2).locator("input")).toBeChecked();
    await expect(pills.locator(".pill").nth(0).locator("input")).not.toBeChecked();
    await expect(page.locator("#radio-pills-selected")).toHaveText("outdoors");
  });
});
