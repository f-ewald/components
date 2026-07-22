import { test, expect } from "@playwright/test";

test.describe("copy-link-button", () => {
  test("copies its value to the clipboard on click", async ({ page }) => {
    await page.goto("/");
    await page.locator("#copy-demo").locator("button").click();
    await expect(page.locator("#copy-status")).toHaveText("Copied!");

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe("https://example.com/listing/42");
  });

  test("supports native focus and disabled button behavior", async ({ page }) => {
    await page.goto("/");
    const el = page.locator("#copy-demo");
    const button = el.locator("button");

    await button.focus();
    expect(await button.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
      "none",
    );
    await el.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(button).toBeDisabled();
  });
});
