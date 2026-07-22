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

  test("keeps its decorative canvas static for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => {
      window.requestAnimationFrame = () => {
        document.body.dataset.confettiAnimated = "true";
        return 1;
      };
    });
    await page.locator("#confetti-trigger").click();

    const canvas = page.locator("animate-confetti #confetti-canvas");
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("body")).not.toHaveAttribute("data-confetti-animated", "true");
  });
});
