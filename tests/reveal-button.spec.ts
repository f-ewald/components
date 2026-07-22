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

  test("supports native focus and disabled button behavior", async ({ page }) => {
    await page.goto("/");
    const revealButton = page.locator("#reveal-button-demo");
    const button = revealButton.locator("button");

    await button.focus();
    expect(await button.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
      "none",
    );
    await revealButton.evaluate((element) => {
      (element as HTMLElement & { disabled: boolean }).disabled = true;
    });
    await expect(button).toBeDisabled();
    await button.click({ force: true });
    await expect(revealButton.locator("div")).toHaveClass(/hidden/);
  });
});
