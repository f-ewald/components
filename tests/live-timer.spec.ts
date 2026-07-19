import { test, expect } from "@playwright/test";

test.describe("live-timer", () => {
  test("ticks a seconds value up and renders compact format", async ({ page }) => {
    await page.goto("/");
    await page.locator("#timer-start").click();

    const secondsTimer = page.locator("#timer-seconds");
    await expect(secondsTimer).toContainText("Sleeping for 0 seconds");
    await expect(secondsTimer).toContainText(/Sleeping for (1|2) seconds?/, { timeout: 3000 });

    await expect(page.locator("#timer-compact")).toContainText(/running for \d+s/);
  });
});
