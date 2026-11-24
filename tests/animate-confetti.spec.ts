import { test, expect } from "@playwright/test";

test.describe("animate-confetti", () => {
  test("attaches a canvas element after being triggered", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("animate-confetti")).toHaveCount(0);

    await page.locator("#confetti-trigger").click();

    const confetti = page.locator("animate-confetti");
    await expect(confetti).toHaveCount(1);
    await expect(confetti.locator("#confetti-canvas")).toHaveAttribute("aria-hidden", "true");
  });

  test("lets in-flight confetti fall out of view instead of clearing it", async ({ page }) => {
    // Tall enough that confetti on screen when spawning stops is still falling
    // after the former fixed 5s cleanup.
    await page.setViewportSize({ width: 800, height: 2400 });
    await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
    await page.goto("/");
    await page.locator("#confetti-trigger").click();

    const confetti = page.locator("animate-confetti");
    const hasInk = () =>
      confetti.evaluate((el) => {
        const canvas = el.shadowRoot!.querySelector("canvas")!;
        const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
        return false;
      });

    // The demo spawns for 4s; 4s + 5s was the old forced cleanup.
    await page.clock.runFor(9_500);
    await expect(confetti).toHaveCount(1);
    expect(await hasInk()).toBe(true);

    // The demo removes the element on `confetti-end`, once the last piece has left.
    await page.clock.runFor(20_000);
    await expect(confetti).toHaveCount(0);
  });

  test("ends immediately without animating for reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => {
      window.requestAnimationFrame = () => {
        document.body.dataset.confettiAnimated = "true";
        return 1;
      };
    });
    await page.locator("#confetti-trigger").click();

    // The demo removes the element on `confetti-end`.
    await expect(page.locator("animate-confetti")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveAttribute("data-confetti-animated", "true");
  });
});
