import { test, expect } from "@playwright/test";

test.describe("reveal-button", () => {
  test("shows hidden slot content after click", async ({ page }) => {
    await page.goto("/");
    const revealButton = page.locator("#reveal-button-demo");
    const hiddenDiv = revealButton.locator("div");
    await expect(hiddenDiv).toHaveClass(/hidden/);

    await revealButton.locator("button").click();
    await expect(hiddenDiv).not.toHaveClass(/hidden/);
    await expect(revealButton).toContainText("Surprise! This content was hidden.");
  });
});
