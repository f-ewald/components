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

  test("renders a 32px icon-only target with an 18px standalone icon", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#copy-demo button");
    await expect(button).toHaveCSS("width", "32px");
    await expect(button).toHaveCSS("height", "32px");
    await expect(button).toHaveCSS("padding", "0px");
    const iconBounds = await page.locator("#copy-demo svg").boundingBox();
    expect(iconBounds?.width).toBe(18);
    expect(iconBounds?.height).toBe(18);
  });
});
