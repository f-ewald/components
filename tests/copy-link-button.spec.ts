import { test, expect } from "@playwright/test";

test.describe("copy-link-button", () => {
  test("copies its value to the clipboard on click", async ({ page }) => {
    await page.goto("/");
    await page.locator("#copy-demo").locator("button").click();
    await expect(page.locator("#copy-status")).toHaveText("Copied!");

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe("https://example.com/listing/42");
  });
});
