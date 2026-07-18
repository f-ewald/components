import { test, expect } from "@playwright/test";

test.describe("roman-numeral", () => {
  test("renders MMIV for 2004 and updates when the input changes", async ({ page }) => {
    await page.goto("/");
    const output = page.locator("#roman-output");
    await expect(output).toHaveText("MMIV");

    await page.locator("#roman-input").fill("1994");
    await expect(output).toHaveText("MCMXCIV");
  });
});
