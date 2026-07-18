import { test, expect } from "@playwright/test";

test.describe("relative-time", () => {
  test("renders '3 hours ago' for a datetime 3 hours in the past, with a locale string title", async ({ page }) => {
    await page.goto("/");
    const output = page.locator("#relative-output");
    const span = output.locator("span");

    await expect(span).toHaveText("3 hours ago");
    const title = await span.getAttribute("title");
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(0);
  });
});
