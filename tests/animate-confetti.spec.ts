import { test, expect } from "@playwright/test";

test.describe("animate-confetti", () => {
  test("attaches a canvas element after being triggered", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("animate-confetti")).toHaveCount(0);

    await page.locator("#confetti-trigger").click();

    const confetti = page.locator("animate-confetti");
    await expect(confetti).toHaveCount(1);
    await expect(confetti.locator("#confetti-canvas")).toBeAttached();
  });
});
