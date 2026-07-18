import { test, expect } from "@playwright/test";

test.describe("distance-value", () => {
  test("renders feet below 0.25 mi and one-decimal miles at 5 mi", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#distance-miles-output")).toHaveText("528 ft");
    await expect(page.locator("#distance-miles-long-output")).toHaveText("5.0 mi");
  });
});
